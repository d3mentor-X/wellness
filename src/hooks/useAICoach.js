import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

export function useAICoach() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  const userId = user?.id

  // 1. Fetch Conversations
  const fetchConversations = useCallback(async () => {
    if (!userId) {
      setConversations([])
      setLoading(false)
      return
    }

    try {
      const { data, error: convErr } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (!convErr && data) {
        setConversations(data)
        if (data.length > 0 && !activeConversationId) {
          setActiveConversationId(data[0].id)
        }
      }
    } catch (err) {
      console.error('Error fetching AI conversations:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, activeConversationId])

  // 2. Fetch Messages for Active Conversation
  const fetchMessages = useCallback(async (convId) => {
    if (!convId) {
      setMessages([])
      return
    }

    try {
      const { data, error: msgErr } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })

      if (!msgErr && data) {
        setMessages(data)
      }
    } catch (err) {
      console.error('Error fetching AI messages:', err)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId)
    }
  }, [activeConversationId, fetchMessages])

  // Send Message
  const sendMessage = async (text) => {
    if (!text.trim() || !userId) return
    const userText = text.trim()
    setSending(true)
    setError(null)

    // Optimistically add user message
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userText,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])

    try {
      // 1. Attempt secure Edge Function call
      let assistantResponseText = ''
      let targetConvId = activeConversationId

      const { data, error: fnError } = await supabase.functions.invoke('ai-coach', {
        body: {
          message: userText,
          conversation_id: activeConversationId,
        },
      })

      if (!fnError && data?.success && data?.message) {
        assistantResponseText = data.message
        if (data.conversation_id && data.conversation_id !== activeConversationId) {
          targetConvId = data.conversation_id
          setActiveConversationId(data.conversation_id)
        }
      } else {
        // Fallback: direct database context & messaging
        let convId = activeConversationId
        if (!convId) {
          const { data: newConv } = await supabase
            .from('ai_conversations')
            .insert({
              user_id: userId,
              title: userText.slice(0, 35) + '...',
            })
            .select()
            .single()
          convId = newConv.id
          targetConvId = convId
          setActiveConversationId(convId)
        }

        // Insert user message directly
        await supabase.from('ai_messages').insert({
          conversation_id: convId,
          role: 'user',
          content: userText,
        })

        // Fetch fitness context
        const { data: ctx } = await supabase.rpc('get_user_fitness_context', {
          p_user_id: userId,
        })

        // Generate contextual coaching response
        assistantResponseText = generateLocalCoachingResponse(userText, ctx)

        // Insert assistant response
        await supabase.from('ai_messages').insert({
          conversation_id: convId,
          role: 'assistant',
          content: assistantResponseText,
        })

        await supabase
          .from('ai_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', convId)
      }

      await fetchMessages(targetConvId)
      await fetchConversations()
    } catch (err) {
      console.error('Error in sendMessage:', err)
      setError("I'm having trouble connecting to your coach right now. Please try again.")
    } finally {
      setSending(false)
    }
  }

  // Start New Conversation
  const startNewConversation = () => {
    setActiveConversationId(null)
    setMessages([])
  }

  // Delete Conversation
  const deleteConversation = async (convId) => {
    try {
      await supabase.from('ai_conversations').delete().eq('id', convId).eq('user_id', userId)
      if (activeConversationId === convId) {
        startNewConversation()
      }
      await fetchConversations()
    } catch (err) {
      console.error('Error deleting conversation:', err)
    }
  }

  return {
    conversations,
    activeConversationId,
    setActiveConversationId,
    messages,
    loading,
    sending,
    error,
    sendMessage,
    startNewConversation,
    deleteConversation,
    refetch: () => {
      fetchConversations()
      if (activeConversationId) fetchMessages(activeConversationId)
    },
  }
}

// Client contextual helper
function generateLocalCoachingResponse(queryText, ctx) {
  const q = queryText.toLowerCase()
  const name = ctx?.user_name || 'there'
  const streak = ctx?.streak_days || 0
  const workouts = ctx?.workouts_last_7_days?.total_last_7_days || 0
  const avgSteps = ctx?.steps_last_7_days?.average_daily_steps || 0
  const nutritionDays = ctx?.nutrition_last_7_days?.days_logged || 0
  const avgCals = ctx?.nutrition_last_7_days?.avg_daily_calories || 0
  const avgP = ctx?.nutrition_last_7_days?.avg_daily_protein_g || 0

  if (q.includes('week') || q.includes('doing') || q.includes('progress')) {
    return `Hi ${name}! Here is a breakdown of your activity over the past 7 days:

• **Workouts**: You logged **${workouts} workout${workouts === 1 ? '' : 's'}**.
• **Daily Steps**: Averaging **${avgSteps.toLocaleString()} steps/day**.
• **Active Streak**: **${streak} days** 🔥
• **Nutrition**: Logged **${nutritionDays} days** (averaging ~${avgCals} kcal and ~${avgP}g protein).

${workouts >= 3 ? 'You are showing strong consistency!' : 'Try to schedule your next workout session to keep the momentum going.'}`
  }

  if (q.includes('train') || q.includes('workout') || q.includes('focus')) {
    return `Based on your recent workout frequency (${workouts} logged this week):

1. **Balance**: Ensure a mix of upper body, lower body, and cardiovascular activity.
2. **Progressive Overload**: Focus on clean form and gradually increasing reps or weights.
3. **Daily Steps**: Keep your daily step count above 8,000 to maintain baseline calorie burn.`
  }

  if (q.includes('protein') || q.includes('nutrition') || q.includes('food')) {
    if (nutritionDays === 0) {
      return `I don't have any logged nutrition records for you this week. 

To track your macros:
• Go to the **Food & Nutrition** tab and log your meals.
• Aim for ~1.6g to 2.0g of protein per kg of body weight to support muscle recovery.`
    }
    return `Looking at your recent food logs:

• **Logged Days**: ${nutritionDays} days.
• **Average Calories**: ~${avgCals} kcal/day.
• **Average Protein**: ~${avgP}g/day.

Keep prioritizing whole foods like chicken breast, eggs, lentils, and Greek yogurt!`
  }

  if (q.includes('streak')) {
    return `You currently have an active streak of **${streak} day${streak === 1 ? '' : 's'}**! 🔥

Remember that a day counts towards your streak when you:
• Complete and log any workout session, OR
• Walk at least 10,000 steps.`
  }

  return `Hello ${name}! I'm reviewing your real fitness profile. You currently have ${workouts} workouts logged this week and a ${streak}-day streak.

What specific goals, workout advice, or nutrition targets can I help you with today?`
}

