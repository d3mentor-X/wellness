-- ============================================================================
-- Fitness Application - AI Fitness Coach Migration
-- ============================================================================
-- Migration: 20260823000011_ai_coach.sql
-- Description:
-- 1. Creates ai_conversations table (strictly private to user).
-- 2. Creates ai_messages table (strictly private to user).
-- 3. Implements get_user_fitness_context RPC function for secure server-side AI context assembly.
-- 4. Enables strict RLS policies on all AI conversation tables.
-- ============================================================================

-- 1. Create ai_conversations table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Fitness Coaching Session',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON public.ai_conversations(user_id, updated_at DESC);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_conversations_select_own"
  ON public.ai_conversations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "ai_conversations_insert_own"
  ON public.ai_conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ai_conversations_update_own"
  ON public.ai_conversations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ai_conversations_delete_own"
  ON public.ai_conversations FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Create ai_messages table
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON public.ai_messages(conversation_id, created_at ASC);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_messages_select_own"
  ON public.ai_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations ac
      WHERE ac.id = ai_messages.conversation_id AND ac.user_id = auth.uid()
    )
  );

CREATE POLICY "ai_messages_insert_own"
  ON public.ai_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_conversations ac
      WHERE ac.id = ai_messages.conversation_id AND ac.user_id = auth.uid()
    )
  );

CREATE POLICY "ai_messages_delete_own"
  ON public.ai_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations ac
      WHERE ac.id = ai_messages.conversation_id AND ac.user_id = auth.uid()
    )
  );

-- 3. RPC Function: Get User Fitness Context (Strictly authenticated to caller)
CREATE OR REPLACE FUNCTION public.get_user_fitness_context(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_profile RECORD;
  v_gamification RECORD;
  v_seven_days_ago DATE := CURRENT_DATE - INTERVAL '7 days';
  v_workouts JSONB;
  v_steps RECORD;
  v_nutrition RECORD;
  v_targets RECORD;
  v_challenges JSONB;
  v_achievements JSONB;
BEGIN
  IF v_caller_id IS NULL OR v_caller_id <> p_user_id THEN
    RAISE EXCEPTION 'Access denied: You can only retrieve your own fitness context.';
  END IF;

  -- 1. Profile
  SELECT full_name, gender, age, height INTO v_profile
  FROM public.profiles WHERE id = v_caller_id;

  -- 2. Streak & XP
  SELECT
    COALESCE(st.current_streak, 0) AS streak,
    COALESCE((SELECT SUM(amount) FROM public.xp_transactions WHERE user_id = v_caller_id), 0) AS total_xp
  INTO v_gamification
  FROM (SELECT current_streak FROM public.calculate_user_streak(v_caller_id, CURRENT_DATE)) st;

  -- 3. Workouts last 7 days
  SELECT jsonb_build_object(
    'total_last_7_days', COUNT(*),
    'latest_sessions', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'name', workout_name,
          'date', workout_date,
          'duration_minutes', duration_minutes
        )
      ) FILTER (WHERE id IS NOT NULL),
      '[]'::jsonb
    )
  )
  INTO v_workouts
  FROM public.workout_sessions
  WHERE user_id = v_caller_id AND workout_date >= v_seven_days_ago;

  -- 4. Steps last 7 days
  SELECT
    COALESCE(AVG(steps), 0)::INTEGER AS avg_steps,
    COALESCE(SUM(steps), 0)::BIGINT AS total_steps,
    COALESCE(MAX(steps), 0)::INTEGER AS max_steps
  INTO v_steps
  FROM public.daily_activity
  WHERE user_id = v_caller_id AND activity_date >= v_seven_days_ago;

  -- 5. Nutrition last 7 days
  SELECT
    COALESCE(COUNT(DISTINCT log_date), 0)::INTEGER AS days_logged,
    COALESCE(AVG(calories), 0)::INTEGER AS avg_calories,
    COALESCE(AVG(protein), 0)::INTEGER AS avg_protein,
    COALESCE(AVG(carbs), 0)::INTEGER AS avg_carbs,
    COALESCE(AVG(fat), 0)::INTEGER AS avg_fat
  INTO v_nutrition
  FROM public.nutrition_logs
  WHERE user_id = v_caller_id AND log_date >= v_seven_days_ago;

  -- Nutrition targets
  SELECT calories, protein, carbs, fat
  INTO v_targets
  FROM public.nutrition_targets
  WHERE user_id = v_caller_id;

  -- 6. Active challenges
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'title', c.title,
        'type', c.challenge_type,
        'target', c.target_value,
        'unit', c.unit,
        'user_progress', cp.current_value,
        'completed', cp.completed
      )
    ),
    '[]'::jsonb
  )
  INTO v_challenges
  FROM public.challenge_participants cp
  JOIN public.challenges c ON c.id = cp.challenge_id
  WHERE cp.user_id = v_caller_id AND c.status = 'active';

  -- 7. Recent Achievements
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'title', a.name,
        'tier', a.tier,
        'awarded_at', ua.awarded_at
      )
    ),
    '[]'::jsonb
  )
  INTO v_achievements
  FROM public.user_achievements ua
  JOIN public.achievements a ON a.id = ua.achievement_id
  WHERE ua.user_id = v_caller_id;

  RETURN jsonb_build_object(
    'user_name', COALESCE(v_profile.full_name, 'Member'),
    'gender', v_profile.gender,
    'age', v_profile.age,
    'height_cm', v_profile.height,
    'streak_days', v_gamification.streak,
    'total_xp', v_gamification.total_xp,
    'workouts_last_7_days', v_workouts,
    'steps_last_7_days', jsonb_build_object(
      'average_daily_steps', v_steps.avg_steps,
      'total_steps', v_steps.total_steps,
      'highest_single_day', v_steps.max_steps
    ),
    'nutrition_last_7_days', jsonb_build_object(
      'days_logged', v_nutrition.days_logged,
      'avg_daily_calories', v_nutrition.avg_calories,
      'avg_daily_protein_g', v_nutrition.avg_protein,
      'avg_daily_carbs_g', v_nutrition.avg_carbs,
      'avg_daily_fat_g', v_nutrition.avg_fat,
      'targets', CASE
        WHEN v_targets.calories IS NOT NULL THEN jsonb_build_object(
          'calories', v_targets.calories,
          'protein', v_targets.protein,
          'carbs', v_targets.carbs,
          'fat', v_targets.fat
        )
        ELSE NULL
      END
    ),
    'active_challenges', v_challenges,
    'unlocked_achievements', v_achievements
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_user_fitness_context(UUID) TO authenticated;

