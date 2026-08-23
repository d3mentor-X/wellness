// Supabase Edge Function: ai-coach
// Secure Server-Side AI Fitness Coach
// Deno Deploy Environment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''

    // Authenticated client using the caller's JWT
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    // 1. Verify User from JWT
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()

    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized user token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = user.id
    const { message, conversation_id } = await req.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Message content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Limit message size to prevent abuse
    const trimmedMessage = message.trim().slice(0, 1000)

    // 2. Manage Conversation
    let conversationId = conversation_id
    if (!conversationId) {
      const { data: newConv, error: convErr } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: userId,
          title: trimmedMessage.slice(0, 40) + '...',
        })
        .select()
        .single()

      if (convErr) throw convErr
      conversationId = newConv.id
    }

    // 3. Save User Message
    await supabase.from('ai_messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: trimmedMessage,
    })

    // 4. Fetch User's Real Fitness Context (Server-Side)
    const { data: fitnessContext, error: ctxErr } = await supabase.rpc(
      'get_user_fitness_context',
      { p_user_id: userId }
    )

    if (ctxErr) {
      console.error('Error getting fitness context:', ctxErr)
    }

    // 5. Fetch Recent Conversation History (Last 6 messages)
    const { data: recentMessages } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(6)

    const historyReversed = (recentMessages || []).reverse()

    // 6. Build Contextual System Prompt
    const systemPrompt = `You are the AI Fitness Coach for the user's private fitness club.
You provide personalized, encouraging, and evidence-based fitness, workout, and nutrition guidance.

CRITICAL RULES:
1. Base your answers on the user's REAL LOGGED DATA provided below.
2. If data is not logged (e.g. no workouts or no nutrition logged), state clearly that you don't have those logs rather than making things up.
3. Distinguish logged facts from reality (say "You logged 120g protein" instead of "You definitely ate 120g protein").
4. Never prescribe extreme crash diets, dangerous calorie deficits, or medical prescriptions.
5. Be concise, actionable, and warm. Use bullet points where appropriate.

USER FITNESS CONTEXT:
${JSON.stringify(fitnessContext || {}, null, 2)}
`

    // 7. Call AI Provider or Contextual Engine
    let assistantReply = ''
    const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('AI_API_KEY')

    if (apiKey) {
      try {
        const contents = [
          { role: 'user', parts: [{ text: systemPrompt }] },
          ...historyReversed.map((m: { role: string; content: string }) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
        ]

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents }),
          }
        )

        const geminiData = await geminiRes.json()
        if (geminiData?.candidates?.[0]?.content?.parts?.[0]?.text) {
          assistantReply = geminiData.candidates[0].content.parts[0].text
        } else {
          throw new Error('Invalid Gemini API response format')
        }
      } catch (geminiErr) {
        console.error('Gemini API call failed:', geminiErr)
        assistantReply = generateContextualFallback(trimmedMessage, fitnessContext)
      }
    } else {
      // Intelligent Contextual Fallback when server API key is not yet set
      assistantReply = generateContextualFallback(trimmedMessage, fitnessContext)
    }

    // 8. Save Assistant Message
    await supabase.from('ai_messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: assistantReply,
    })

    // Update conversation timestamp
    await supabase
      .from('ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    return new Response(
      JSON.stringify({
        success: true,
        conversation_id: conversationId,
        message: assistantReply,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error'
    console.error('AI Coach error:', errorMsg)
    return new Response(
      JSON.stringify({ error: 'I am having trouble connecting to your coach right now. Please try again.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

// Intelligent contextual fallback engine
function generateContextualFallback(userQuery: string, ctx: any): string {
  const query = userQuery.toLowerCase()
  const name = ctx?.user_name || 'there'
  const streak = ctx?.streak_days || 0
  const workouts = ctx?.workouts_last_7_days?.total_last_7_days || 0
  const avgSteps = ctx?.steps_last_7_days?.average_daily_steps || 0
  const nutritionDays = ctx?.nutrition_last_7_days?.days_logged || 0
  const avgCals = ctx?.nutrition_last_7_days?.avg_daily_calories || 0
  const avgP = ctx?.nutrition_last_7_days?.avg_daily_protein_g || 0
  const targetCals = ctx?.nutrition_last_7_days?.targets?.calories || 2200

  if (query.includes('how am i doing') || query.includes('summary') || query.includes('progress')) {
    return `Hi ${name}! Here is a summary of your recent fitness activity:

• **Workout Consistency**: You have completed **${workouts} workout${workouts === 1 ? '' : 's'}** in the last 7 days.
• **Daily Steps**: Averaging **${avgSteps.toLocaleString()} steps/day**.
• **Streak**: You are on an active streak of **${streak} day${streak === 1 ? '' : 's'}**! 🔥
• **Nutrition Tracking**: Logged **${nutritionDays} days** this week (averaging ~${avgCals} kcal and ~${avgP}g protein).

${workouts >= 3 ? 'Great momentum on your training!' : 'Consider adding an extra session this week to build consistency.'}`
  }

  if (query.includes('train') || query.includes('workout') || query.includes('exercise')) {
    return `Based on your recent logs (${workouts} session${workouts === 1 ? '' : 's'} this past week):

1. **Strength Focus**: Make sure to balance compound movements (Squats, Bench/Pushups, Deadlifts/Rows).
2. **Recovery**: Ensure at least 48 hours of rest for major muscle groups between heavy sessions.
3. **Step Goal**: Target 8,000–10,000 steps today to keep your daily calorie expenditure steady.`
  }

  if (query.includes('nutrition') || query.includes('protein') || query.includes('calorie')) {
    if (nutritionDays === 0) {
      return `I don't see any nutrition logs for the past 7 days yet.

To get personalized feedback:
1. Log your meals in the **Food & Nutrition** tab.
2. Aim for about 1.6–2.0g of protein per kg of body weight for muscle maintenance and recovery.`
    }
    return `Looking at your recent nutrition logs:

• **Logged Days**: ${nutritionDays} of the last 7 days.
• **Average Calories**: ~${avgCals} kcal/day (Target: ${targetCals} kcal).
• **Average Protein**: ~${avgP}g/day.

Keep prioritizing lean protein sources like chicken breast, eggs, lentils, and Greek yogurt with each meal!`
  }

  if (query.includes('streak')) {
    return `You're currently holding an active streak of **${streak} day${streak === 1 ? '' : 's'}**! 🔥

To keep your streak alive every day:
• Complete any workout session (strength, cardio, bodyweight), OR
• Reach at least 10,000 steps for the day.`
  }

  return `Hello ${name}! I'm your AI Fitness Coach. I can analyze your workouts (${workouts} this week), daily steps (${avgSteps.toLocaleString()} avg), streaks (${streak} days), and nutrition logs to help you stay on track.

Ask me anything about your training frequency, protein intake, streak tips, or challenge progress!`
}

