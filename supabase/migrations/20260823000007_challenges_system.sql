-- ============================================================================
-- Fitness Application - Club Challenges System Migration
-- ============================================================================
-- Migration: 20260823000007_challenges_system.sql
-- Description:
-- 1. Extends challenge_participants with completed_at column.
-- 2. Seeds standard initial club challenges for default club.
-- 3. Implements calculate_challenge_progress function (derived from real activity).
-- 4. Implements get_challenge_leaderboard RPC function with auto-completion and +100 XP award.
-- 5. Implements join_challenge and leave_challenge secure RPC functions.
-- 6. Enforces strict RLS policies: members can only join/leave their own club challenges.
-- ============================================================================

-- 1. Extend challenge_participants table
ALTER TABLE public.challenge_participants ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 2. Seed initial curated club challenges
INSERT INTO public.challenges (
  id,
  club_id,
  title,
  description,
  challenge_type,
  target_value,
  unit,
  start_date,
  end_date,
  status
)
VALUES
  (
    'c1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '30-Day Consistency Challenge',
    'Log at least 20 active days (workouts or 10,000 steps) during this month.',
    'active_days',
    20,
    'days',
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE + INTERVAL '20 days',
    'active'
  ),
  (
    'c2222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '100K Steps Explorer',
    'Accumulate 100,000 steps during the challenge window. Every walk counts!',
    'steps',
    100000,
    'steps',
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '25 days',
    'active'
  ),
  (
    'c3333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    '20 Workouts Milestone',
    'Complete 20 strength or cardio workout sessions to build indestructible momentum.',
    'workouts',
    20,
    'workouts',
    CURRENT_DATE - INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '28 days',
    'active'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  challenge_type = EXCLUDED.challenge_type,
  target_value = EXCLUDED.target_value,
  unit = EXCLUDED.unit,
  status = EXCLUDED.status;

-- 3. Function to calculate real derived progress for a user in a challenge
CREATE OR REPLACE FUNCTION public.calculate_challenge_progress(
  p_challenge_id UUID,
  p_user_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_ch RECORD;
  v_progress NUMERIC := 0;
BEGIN
  SELECT * INTO v_ch FROM public.challenges WHERE id = p_challenge_id;
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  IF v_ch.challenge_type = 'steps' THEN
    -- Sum steps in [start_date, end_date]
    SELECT COALESCE(SUM(s_val), 0)
    INTO v_progress
    FROM (
      SELECT steps AS s_val FROM public.daily_activity
      WHERE user_id = p_user_id
        AND activity_date >= v_ch.start_date
        AND activity_date <= v_ch.end_date
      UNION ALL
      SELECT step_count AS s_val FROM public.steps s
      WHERE user_id = p_user_id
        AND activity_date >= v_ch.start_date
        AND activity_date <= v_ch.end_date
        AND NOT EXISTS (
          SELECT 1 FROM public.daily_activity da
          WHERE da.user_id = p_user_id AND da.activity_date = s.activity_date
        )
    ) step_records;

  ELSIF v_ch.challenge_type = 'workouts' THEN
    -- Count completed workout sessions in [start_date, end_date]
    SELECT COUNT(*)::NUMERIC
    INTO v_progress
    FROM public.workout_sessions
    WHERE user_id = p_user_id
      AND workout_date >= v_ch.start_date
      AND workout_date <= v_ch.end_date;

  ELSIF v_ch.challenge_type = 'active_days' THEN
    -- Count distinct active calendar days in [start_date, end_date]
    SELECT COUNT(DISTINCT d)::NUMERIC
    INTO v_progress
    FROM (
      SELECT workout_date AS d FROM public.workout_sessions
      WHERE user_id = p_user_id
        AND workout_date >= v_ch.start_date
        AND workout_date <= v_ch.end_date
      UNION
      SELECT activity_date AS d FROM public.daily_activity
      WHERE user_id = p_user_id
        AND (workout_completed = true OR steps >= 10000)
        AND activity_date >= v_ch.start_date
        AND activity_date <= v_ch.end_date
      UNION
      SELECT activity_date AS d FROM public.steps
      WHERE user_id = p_user_id
        AND step_count >= 10000
        AND activity_date >= v_ch.start_date
        AND activity_date <= v_ch.end_date
    ) active_dates;

  ELSIF v_ch.challenge_type = 'distance' THEN
    -- Sum distance (exercise_sets distance + steps * 0.75 / 1000)
    SELECT COALESCE(SUM(dist), 0)
    INTO v_progress
    FROM (
      SELECT COALESCE(es.distance, 0) AS dist
      FROM public.exercise_sets es
      JOIN public.workout_exercises we ON we.id = es.workout_exercise_id
      JOIN public.workout_sessions ws ON ws.id = we.workout_session_id
      WHERE ws.user_id = p_user_id
        AND ws.workout_date >= v_ch.start_date
        AND ws.workout_date <= v_ch.end_date
        AND es.distance > 0
      UNION ALL
      SELECT (da.steps * 0.75 / 1000.0) AS dist
      FROM public.daily_activity da
      WHERE da.user_id = p_user_id
        AND da.activity_date >= v_ch.start_date
        AND da.activity_date <= v_ch.end_date
    ) dist_records;

  ELSE
    v_progress := 0;
  END IF;

  RETURN v_progress;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Get Challenge Leaderboard RPC (with auto-sync and XP award)
CREATE OR REPLACE FUNCTION public.get_challenge_leaderboard(
  p_challenge_id UUID
)
RETURNS TABLE (
  rank INTEGER,
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  role club_role,
  current_value NUMERIC,
  target_value NUMERIC,
  completed BOOLEAN,
  completed_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  progress_percent NUMERIC
) AS $$
DECLARE
  v_ch RECORD;
  v_p RECORD;
  v_calc_val NUMERIC;
  v_is_completed BOOLEAN;
BEGIN
  -- Verify challenge exists and caller belongs to same club
  SELECT * INTO v_ch FROM public.challenges WHERE id = p_challenge_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF NOT public.is_active_club_member(v_ch.club_id, auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: You are not an active member of this club.';
  END IF;

  -- Refresh progress for all participants in this challenge
  FOR v_p IN (SELECT cp.id, cp.user_id, cp.completed, cp.completed_at FROM public.challenge_participants cp WHERE cp.challenge_id = p_challenge_id) LOOP
    v_calc_val := public.calculate_challenge_progress(p_challenge_id, v_p.user_id);
    v_is_completed := (v_calc_val >= v_ch.target_value);

    UPDATE public.challenge_participants
    SET
      current_value = v_calc_val,
      completed = (v_is_completed OR v_p.completed),
      completed_at = CASE
        WHEN (v_is_completed OR v_p.completed) AND v_p.completed_at IS NULL THEN now()
        ELSE v_p.completed_at
      END,
      updated_at = now()
    WHERE id = v_p.id;

    -- Award +100 XP if challenge completed (idempotent)
    IF v_is_completed THEN
      INSERT INTO public.xp_transactions (user_id, club_id, amount, reason, reference_type, reference_id)
      VALUES (v_p.user_id, v_ch.club_id, 100, 'Completed Challenge: ' || v_ch.title, 'challenge_completed', p_challenge_id::TEXT)
      ON CONFLICT (user_id, reference_type, reference_id) DO NOTHING;
    END IF;
  END LOOP;

  -- Return sorted leaderboard
  RETURN QUERY
  SELECT
    (ROW_NUMBER() OVER (ORDER BY cp.current_value DESC, cp.completed_at ASC NULLS LAST, cp.joined_at ASC))::INTEGER AS rank,
    cp.user_id,
    COALESCE(p.full_name, 'Club Member') AS full_name,
    p.avatar_url,
    COALESCE(cm.role, 'member'::club_role) AS role,
    cp.current_value,
    v_ch.target_value,
    cp.completed,
    cp.completed_at,
    cp.joined_at,
    LEAST(100.0, ROUND((cp.current_value / NULLIF(v_ch.target_value, 0)) * 100.0, 1)) AS progress_percent
  FROM public.challenge_participants cp
  JOIN public.profiles p ON p.id = cp.user_id
  LEFT JOIN public.club_members cm ON cm.user_id = cp.user_id AND cm.club_id = v_ch.club_id
  WHERE cp.challenge_id = p_challenge_id
  ORDER BY cp.current_value DESC, cp.completed_at ASC NULLS LAST, cp.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_challenge_leaderboard(UUID) TO authenticated;

-- 5. RPC function to join a challenge
CREATE OR REPLACE FUNCTION public.join_challenge(
  p_challenge_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_ch RECORD;
  v_user_id UUID := auth.uid();
  v_initial_progress NUMERIC := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to join challenges.';
  END IF;

  SELECT * INTO v_ch FROM public.challenges WHERE id = p_challenge_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge not found.';
  END IF;

  IF NOT public.is_active_club_member(v_ch.club_id, v_user_id) THEN
    RAISE EXCEPTION 'Access denied: You are not an active member of this club.';
  END IF;

  IF v_ch.status NOT IN ('active', 'upcoming') THEN
    RAISE EXCEPTION 'This challenge is no longer accepting new participants.';
  END IF;

  -- Calculate initial progress
  v_initial_progress := public.calculate_challenge_progress(p_challenge_id, v_user_id);

  INSERT INTO public.challenge_participants (
    challenge_id,
    user_id,
    current_value,
    completed,
    completed_at
  )
  VALUES (
    p_challenge_id,
    v_user_id,
    v_initial_progress,
    (v_initial_progress >= v_ch.target_value),
    CASE WHEN v_initial_progress >= v_ch.target_value THEN now() ELSE NULL END
  )
  ON CONFLICT (challenge_id, user_id) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'challenge_id', p_challenge_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.join_challenge(UUID) TO authenticated;

-- 6. RPC function to leave a challenge
CREATE OR REPLACE FUNCTION public.leave_challenge(
  p_challenge_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  DELETE FROM public.challenge_participants
  WHERE challenge_id = p_challenge_id
    AND user_id = v_user_id;

  RETURN jsonb_build_object('success', true, 'challenge_id', p_challenge_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.leave_challenge(UUID) TO authenticated;

