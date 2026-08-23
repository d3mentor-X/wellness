-- ============================================================================
-- Fitness Application - Gamification: Streaks, XP, Levels & Achievements
-- ============================================================================
-- Migration: 20260823000006_gamification_streaks_xp.sql
-- Description:
-- 1. Adds tier column to achievements table and seeds initial achievements.
-- 2. Creates xp_transactions table with unique reference constraint (idempotency).
-- 3. Implements calculate_user_streak function with client date support.
-- 4. Implements sync_user_gamification RPC function for automatic XP & badge awards.
-- 5. Enables RLS policies preventing manual user manipulation.
-- ============================================================================

-- 1. Extend achievements table
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'bronze';

-- Seed curated achievements
INSERT INTO public.achievements (name, description, icon, category, requirement_type, requirement_value, tier)
VALUES
  ('First 3 Days', 'Complete a 3-day active streak', '🔥', 'streak', 'streak_days', 3, 'bronze'),
  ('7 Day Streak', 'Complete a 7-day active streak', '🔥', 'streak', 'streak_days', 7, 'bronze'),
  ('14 Day Streak', 'Complete a 14-day active streak', '🔥', 'streak', 'streak_days', 14, 'silver'),
  ('30 Day Streak', 'Complete a 30-day active streak', '🔥', 'streak', 'streak_days', 30, 'gold'),
  ('100 Day Streak', 'Complete a 100-day active streak', '🔥', 'streak', 'streak_days', 100, 'diamond'),
  ('First Workout', 'Complete your first logged workout session', '🏋', 'workout', 'total_workouts', 1, 'bronze'),
  ('10 Workouts', 'Complete 10 logged workout sessions', '🏋', 'workout', 'total_workouts', 10, 'bronze'),
  ('25 Workouts', 'Complete 25 logged workout sessions', '🏋', 'workout', 'total_workouts', 25, 'silver'),
  ('50 Workouts', 'Complete 50 logged workout sessions', '🏋', 'workout', 'total_workouts', 50, 'gold'),
  ('100 Workouts', 'Complete 100 logged workout sessions', '🏋', 'workout', 'total_workouts', 100, 'diamond'),
  ('First 10K', 'Reach 10,000 steps in a single day', '👟', 'steps', 'single_day_steps', 10000, 'bronze'),
  ('100K Steps', 'Accumulate 100,000 total walking steps', '👟', 'steps', 'total_steps', 100000, 'silver'),
  ('1 Million Steps', 'Accumulate 1,000,000 total walking steps', '👟', 'steps', 'total_steps', 1000000, 'gold')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  requirement_type = EXCLUDED.requirement_type,
  requirement_value = EXCLUDED.requirement_value,
  tier = EXCLUDED.tier;

-- 2. Create xp_transactions table
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  reference_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_xp_ref UNIQUE (user_id, reference_type, reference_id)
);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON public.xp_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_club_user ON public.xp_transactions(club_id, user_id);

-- Enable RLS on xp_transactions
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "xp_transactions_select_club_members"
  ON public.xp_transactions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR public.is_active_club_member(club_id, auth.uid())
  );

-- 3. Streak Calculation Database Function
CREATE OR REPLACE FUNCTION public.calculate_user_streak(
  p_user_id UUID,
  p_client_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  current_streak INTEGER,
  longest_streak INTEGER,
  active_today BOOLEAN,
  total_active_days INTEGER
) AS $$
DECLARE
  v_dates DATE[];
  v_cur_streak INTEGER := 0;
  v_max_streak INTEGER := 0;
  v_temp_streak INTEGER := 0;
  v_prev_date DATE := NULL;
  v_d DATE;
  v_active_today BOOLEAN := false;
  v_total_days INTEGER := 0;
  v_expected_date DATE;
BEGIN
  -- Gather distinct active dates from workouts, daily_activity, and steps
  SELECT ARRAY_AGG(d ORDER BY d DESC)
  INTO v_dates
  FROM (
    SELECT workout_date AS d FROM public.workout_sessions WHERE user_id = p_user_id
    UNION
    SELECT activity_date AS d FROM public.daily_activity WHERE user_id = p_user_id AND (workout_completed = true OR steps >= 10000)
    UNION
    SELECT activity_date AS d FROM public.steps WHERE user_id = p_user_id AND step_count >= 10000
  ) active_set;

  IF v_dates IS NULL OR array_length(v_dates, 1) IS NULL THEN
    RETURN QUERY SELECT 0, 0, false, 0;
    RETURN;
  END IF;

  v_total_days := array_length(v_dates, 1);
  v_active_today := (v_dates[1] = p_client_date);

  -- 1. Compute Current Streak
  IF v_active_today THEN
    v_expected_date := p_client_date;
  ELSIF v_dates[1] = (p_client_date - INTERVAL '1 day')::DATE THEN
    v_expected_date := (p_client_date - INTERVAL '1 day')::DATE;
  ELSE
    v_expected_date := NULL;
  END IF;

  IF v_expected_date IS NOT NULL THEN
    FOREACH v_d IN ARRAY v_dates LOOP
      IF v_d = v_expected_date THEN
        v_cur_streak := v_cur_streak + 1;
        v_expected_date := (v_expected_date - INTERVAL '1 day')::DATE;
      ELSE
        EXIT;
      END IF;
    END LOOP;
  ELSE
    v_cur_streak := 0;
  END IF;

  -- 2. Compute Longest Streak Ever
  FOREACH v_d IN ARRAY (SELECT ARRAY_AGG(d ORDER BY d ASC) FROM UNNEST(v_dates) d) LOOP
    IF v_prev_date IS NULL THEN
      v_temp_streak := 1;
    ELSIF v_d = (v_prev_date + INTERVAL '1 day')::DATE THEN
      v_temp_streak := v_temp_streak + 1;
    ELSE
      v_temp_streak := 1;
    END IF;

    IF v_temp_streak > v_max_streak THEN
      v_max_streak := v_temp_streak;
    END IF;

    v_prev_date := v_d;
  END LOOP;

  IF v_cur_streak > v_max_streak THEN
    v_max_streak := v_cur_streak;
  END IF;

  RETURN QUERY SELECT v_cur_streak, v_max_streak, v_active_today, v_total_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.calculate_user_streak(UUID, DATE) TO authenticated;

-- 4. Sync User Gamification RPC Function
CREATE OR REPLACE FUNCTION public.sync_user_gamification(
  p_user_id UUID,
  p_club_id UUID,
  p_client_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
  v_streak_record RECORD;
  v_total_xp INTEGER := 0;
  v_total_workouts INTEGER := 0;
  v_total_steps INTEGER := 0;
  v_ws RECORD;
  v_da RECORD;
  v_ach RECORD;
  v_newly_unlocked TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- 1. Compute streak metrics
  SELECT * INTO v_streak_record FROM public.calculate_user_streak(p_user_id, p_client_date);

  -- 2. Evaluate & award XP for completed workouts (+50 XP each)
  FOR v_ws IN (
    SELECT id, workout_name, workout_date FROM public.workout_sessions WHERE user_id = p_user_id
  ) LOOP
    INSERT INTO public.xp_transactions (user_id, club_id, amount, reason, reference_type, reference_id)
    VALUES (p_user_id, p_club_id, 50, 'Completed Workout: ' || v_ws.workout_name, 'workout', v_ws.id::TEXT)
    ON CONFLICT (user_id, reference_type, reference_id) DO NOTHING;
  END LOOP;

  -- 3. Evaluate & award XP for daily step targets (10K steps = +25 XP each)
  FOR v_da IN (
    SELECT activity_date, steps FROM public.daily_activity WHERE user_id = p_user_id AND steps >= 10000
    UNION
    SELECT activity_date, step_count AS steps FROM public.steps WHERE user_id = p_user_id AND step_count >= 10000
  ) LOOP
    INSERT INTO public.xp_transactions (user_id, club_id, amount, reason, reference_type, reference_id)
    VALUES (p_user_id, p_club_id, 25, 'Hit 10,000 Daily Steps Goal', 'daily_steps', v_da.activity_date::TEXT)
    ON CONFLICT (user_id, reference_type, reference_id) DO NOTHING;
  END LOOP;

  -- 4. Evaluate & award streak bonus XP
  IF v_streak_record.longest_streak >= 7 THEN
    INSERT INTO public.xp_transactions (user_id, club_id, amount, reason, reference_type, reference_id)
    VALUES (p_user_id, p_club_id, 100, '7-Day Streak Milestone Bonus', 'streak_bonus', 'streak-7')
    ON CONFLICT (user_id, reference_type, reference_id) DO NOTHING;
  END IF;

  IF v_streak_record.longest_streak >= 14 THEN
    INSERT INTO public.xp_transactions (user_id, club_id, amount, reason, reference_type, reference_id)
    VALUES (p_user_id, p_club_id, 200, '14-Day Streak Milestone Bonus', 'streak_bonus', 'streak-14')
    ON CONFLICT (user_id, reference_type, reference_id) DO NOTHING;
  END IF;

  IF v_streak_record.longest_streak >= 30 THEN
    INSERT INTO public.xp_transactions (user_id, club_id, amount, reason, reference_type, reference_id)
    VALUES (p_user_id, p_club_id, 500, '30-Day Streak Milestone Bonus', 'streak_bonus', 'streak-30')
    ON CONFLICT (user_id, reference_type, reference_id) DO NOTHING;
  END IF;

  -- 5. Calculate Aggregated Counts
  SELECT COUNT(*)::INTEGER INTO v_total_workouts FROM public.workout_sessions WHERE user_id = p_user_id;

  SELECT COALESCE(SUM(steps), 0)::INTEGER INTO v_total_steps FROM (
    SELECT steps FROM public.daily_activity WHERE user_id = p_user_id
    UNION ALL
    SELECT step_count AS steps FROM public.steps s WHERE user_id = p_user_id AND NOT EXISTS (
      SELECT 1 FROM public.daily_activity da WHERE da.user_id = p_user_id AND da.activity_date = s.activity_date
    )
  ) all_steps;

  SELECT COALESCE(SUM(amount), 0)::INTEGER INTO v_total_xp FROM public.xp_transactions WHERE user_id = p_user_id;

  -- 6. Evaluate and Unlock Achievements
  FOR v_ach IN SELECT * FROM public.achievements LOOP
    IF (
      (v_ach.requirement_type = 'streak_days' AND v_streak_record.longest_streak >= v_ach.requirement_value) OR
      (v_ach.requirement_type = 'total_workouts' AND v_total_workouts >= v_ach.requirement_value) OR
      (v_ach.requirement_type = 'total_steps' AND v_total_steps >= v_ach.requirement_value) OR
      (v_ach.requirement_type = 'single_day_steps' AND EXISTS (
        SELECT 1 FROM public.daily_activity WHERE user_id = p_user_id AND steps >= v_ach.requirement_value
        UNION
        SELECT 1 FROM public.steps WHERE user_id = p_user_id AND step_count >= v_ach.requirement_value
      ))
    ) THEN
      INSERT INTO public.user_achievements (user_id, club_id, achievement_id, awarded_at)
      VALUES (p_user_id, p_club_id, v_ach.id, now())
      ON CONFLICT (user_id, club_id, achievement_id) DO NOTHING;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'total_xp', v_total_xp,
    'current_streak', v_streak_record.current_streak,
    'longest_streak', v_streak_record.longest_streak,
    'active_today', v_streak_record.active_today,
    'total_active_days', v_streak_record.total_active_days,
    'total_workouts', v_total_workouts,
    'total_steps', v_total_steps
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.sync_user_gamification(UUID, UUID, DATE) TO authenticated;

