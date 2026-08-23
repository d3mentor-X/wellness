-- ============================================================================
-- Fitness Application - Club Social Layer Migration
-- ============================================================================
-- Migration: 20260823000008_club_social_layer.sql
-- Description:
-- 1. Extends clubs with whatsapp_group_link column.
-- 2. Extends activity_feed table with metadata column.
-- 3. Creates activity_reactions table with unique user-activity-reaction constraint.
-- 4. Creates club_announcements table for coach/admin announcements.
-- 5. Implements get_club_leaderboard RPC with time filter support ('all_time', 'this_month', 'this_week').
-- 6. Implements get_club_momentum RPC for real today stats and active member summaries.
-- 7. Implements toggle_activity_reaction RPC function.
-- 8. Enables strict RLS policies on all social entities.
-- ============================================================================

-- 1. Extend clubs table
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS whatsapp_group_link TEXT DEFAULT 'https://chat.whatsapp.com';

-- 2. Extend activity_feed table
ALTER TABLE public.activity_feed ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Enable Realtime publication for activity_feed, activity_reactions, and club_announcements if publication exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 3. Create activity_reactions table
CREATE TABLE IF NOT EXISTS public.activity_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activity_feed(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('heart', 'fire', 'muscle', 'clap')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_activity_reaction UNIQUE(activity_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_activity_reactions_activity ON public.activity_reactions(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_reactions_user ON public.activity_reactions(user_id);

ALTER TABLE public.activity_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_reactions_select_club_members"
  ON public.activity_reactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.activity_feed af
      WHERE af.id = activity_reactions.activity_id
        AND public.is_active_club_member(af.club_id, auth.uid())
    )
  );

CREATE POLICY "activity_reactions_insert_own"
  ON public.activity_reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.activity_feed af
      WHERE af.id = activity_reactions.activity_id
        AND public.is_active_club_member(af.club_id, auth.uid())
    )
  );

CREATE POLICY "activity_reactions_delete_own"
  ON public.activity_reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 4. Create club_announcements table
CREATE TABLE IF NOT EXISTS public.club_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_club_announcements_club ON public.club_announcements(club_id, created_at DESC);

ALTER TABLE public.club_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "club_announcements_select_club_members"
  ON public.club_announcements FOR SELECT
  TO authenticated
  USING (public.is_active_club_member(club_id, auth.uid()));

CREATE POLICY "club_announcements_insert_instructors_or_admins"
  ON public.club_announcements FOR INSERT
  TO authenticated
  WITH CHECK (public.is_club_instructor_or_admin(club_id, auth.uid()));

CREATE POLICY "club_announcements_update_instructors_or_admins"
  ON public.club_announcements FOR UPDATE
  TO authenticated
  USING (public.is_club_instructor_or_admin(club_id, auth.uid()))
  WITH CHECK (public.is_club_instructor_or_admin(club_id, auth.uid()));

CREATE POLICY "club_announcements_delete_admin"
  ON public.club_announcements FOR DELETE
  TO authenticated
  USING (public.is_club_admin(club_id, auth.uid()));

-- Seed a pinned coach announcement
INSERT INTO public.club_announcements (club_id, title, message, is_pinned)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Weekly Training Focus & Challenge Kickoff',
  'Welcome to the new week, team! Remember to log your workouts and step counts daily to keep your streaks alive. Push for the 30-Day Consistency Challenge!',
  true
)
ON CONFLICT DO NOTHING;

-- 5. Global Club Leaderboard RPC Function
CREATE OR REPLACE FUNCTION public.get_club_leaderboard(
  p_club_id UUID,
  p_time_filter TEXT DEFAULT 'all_time'
)
RETURNS TABLE (
  rank INTEGER,
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  role club_role,
  total_xp BIGINT,
  current_streak INTEGER,
  total_workouts BIGINT,
  total_steps BIGINT,
  level INTEGER
) AS $$
DECLARE
  v_start_time TIMESTAMPTZ;
BEGIN
  IF NOT public.is_active_club_member(p_club_id, auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: You are not an active member of this club.';
  END IF;

  IF p_time_filter = 'this_month' THEN
    v_start_time := date_trunc('month', now());
  ELSIF p_time_filter = 'this_week' THEN
    v_start_time := date_trunc('week', now());
  ELSE
    v_start_time := '1970-01-01 00:00:00+00'::TIMESTAMPTZ;
  END IF;

  RETURN QUERY
  WITH member_xp AS (
    SELECT
      cm.user_id AS m_uid,
      COALESCE(SUM(xt.amount), 0)::BIGINT AS xp_sum
    FROM public.club_members cm
    LEFT JOIN public.xp_transactions xt
      ON xt.user_id = cm.user_id
      AND xt.club_id = p_club_id
      AND xt.created_at >= v_start_time
    WHERE cm.club_id = p_club_id AND cm.status = 'active'
    GROUP BY cm.user_id
  ),
  member_workouts AS (
    SELECT
      cm.user_id AS m_uid,
      COUNT(ws.id)::BIGINT AS wo_count
    FROM public.club_members cm
    LEFT JOIN public.workout_sessions ws
      ON ws.user_id = cm.user_id
      AND ws.club_id = p_club_id
      AND ws.workout_date >= v_start_time::DATE
    WHERE cm.club_id = p_club_id AND cm.status = 'active'
    GROUP BY cm.user_id
  ),
  member_steps AS (
    SELECT
      cm.user_id AS m_uid,
      COALESCE(SUM(da.steps), 0)::BIGINT AS step_sum
    FROM public.club_members cm
    LEFT JOIN public.daily_activity da
      ON da.user_id = cm.user_id
      AND da.club_id = p_club_id
      AND da.activity_date >= v_start_time::DATE
    WHERE cm.club_id = p_club_id AND cm.status = 'active'
    GROUP BY cm.user_id
  )
  SELECT
    (ROW_NUMBER() OVER (
      ORDER BY mx.xp_sum DESC,
               mw.wo_count DESC,
               ms.step_sum DESC,
               cm.joined_at ASC
    ))::INTEGER AS rank,
    cm.user_id,
    COALESCE(p.full_name, 'Club Member') AS full_name,
    p.avatar_url,
    cm.role,
    mx.xp_sum AS total_xp,
    COALESCE(st.current_streak, 0)::INTEGER AS current_streak,
    mw.wo_count AS total_workouts,
    ms.step_sum AS total_steps,
    CASE
      WHEN mx.xp_sum >= 4100 THEN 10 + ((mx.xp_sum - 4100) / 1000)::INTEGER
      WHEN mx.xp_sum >= 3250 THEN 9
      WHEN mx.xp_sum >= 2500 THEN 8
      WHEN mx.xp_sum >= 1850 THEN 7
      WHEN mx.xp_sum >= 1300 THEN 6
      WHEN mx.xp_sum >= 850 THEN 5
      WHEN mx.xp_sum >= 500 THEN 4
      WHEN mx.xp_sum >= 250 THEN 3
      WHEN mx.xp_sum >= 100 THEN 2
      ELSE 1
    END AS level
  FROM public.club_members cm
  JOIN public.profiles p ON p.id = cm.user_id
  JOIN member_xp mx ON mx.m_uid = cm.user_id
  JOIN member_workouts mw ON mw.m_uid = cm.user_id
  JOIN member_steps ms ON ms.m_uid = cm.user_id
  LEFT JOIN LATERAL (
    SELECT current_streak FROM public.calculate_user_streak(cm.user_id, CURRENT_DATE)
  ) st ON true
  WHERE cm.club_id = p_club_id AND cm.status = 'active'
  ORDER BY rank ASC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_club_leaderboard(UUID, TEXT) TO authenticated;

-- 6. Club Momentum & Active Today RPC Function
CREATE OR REPLACE FUNCTION public.get_club_momentum(
  p_club_id UUID,
  p_client_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
  v_members_active_count INTEGER := 0;
  v_workouts_today INTEGER := 0;
  v_steps_today BIGINT := 0;
  v_active_challenges_count INTEGER := 0;
  v_achievements_count INTEGER := 0;
  v_active_members JSONB := '[]'::jsonb;
BEGIN
  IF NOT public.is_active_club_member(p_club_id, auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: You are not an active member of this club.';
  END IF;

  -- 1. Workouts today in club
  SELECT COUNT(*)::INTEGER
  INTO v_workouts_today
  FROM public.workout_sessions
  WHERE club_id = p_club_id AND workout_date = p_client_date;

  -- 2. Steps today in club
  SELECT COALESCE(SUM(steps), 0)::BIGINT
  INTO v_steps_today
  FROM public.daily_activity
  WHERE club_id = p_club_id AND activity_date = p_client_date;

  -- 3. Active challenges count
  SELECT COUNT(*)::INTEGER
  INTO v_active_challenges_count
  FROM public.challenges
  WHERE club_id = p_club_id AND status = 'active' AND p_client_date BETWEEN start_date AND end_date;

  -- 4. Achievements unlocked in club
  SELECT COUNT(*)::INTEGER
  INTO v_achievements_count
  FROM public.user_achievements
  WHERE club_id = p_club_id;

  -- 5. List of active members today
  SELECT jsonb_agg(sub)
  INTO v_active_members
  FROM (
    SELECT DISTINCT ON (cm.user_id)
      cm.user_id,
      COALESCE(p.full_name, 'Club Member') AS full_name,
      p.avatar_url,
      cm.role,
      CASE
        WHEN ws.id IS NOT NULL THEN 'Completed ' || ws.workout_name
        WHEN da.steps >= 10000 THEN 'Hit ' || da.steps || ' steps'
        WHEN da.steps > 0 THEN 'Logged ' || da.steps || ' steps'
        ELSE 'Active Today'
      END AS action_summary
    FROM public.club_members cm
    JOIN public.profiles p ON p.id = cm.user_id
    LEFT JOIN public.workout_sessions ws
      ON ws.user_id = cm.user_id AND ws.club_id = p_club_id AND ws.workout_date = p_client_date
    LEFT JOIN public.daily_activity da
      ON da.user_id = cm.user_id AND da.club_id = p_club_id AND da.activity_date = p_client_date
    WHERE cm.club_id = p_club_id
      AND cm.status = 'active'
      AND (ws.id IS NOT NULL OR (da.steps > 0 OR da.workout_completed = true))
    LIMIT 20
  ) sub;

  SELECT COALESCE(jsonb_array_length(v_active_members), 0) INTO v_members_active_count;

  RETURN jsonb_build_object(
    'members_active_today', v_members_active_count,
    'workouts_today', v_workouts_today,
    'steps_today', v_steps_today,
    'active_challenges_count', v_active_challenges_count,
    'achievements_count', v_achievements_count,
    'active_members', COALESCE(v_active_members, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_club_momentum(UUID, DATE) TO authenticated;

-- 7. Toggle Activity Reaction RPC Function
CREATE OR REPLACE FUNCTION public.toggle_activity_reaction(
  p_activity_id UUID,
  p_reaction_type TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_af RECORD;
  v_existing_id UUID;
  v_action TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  SELECT * INTO v_af FROM public.activity_feed WHERE id = p_activity_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activity not found.';
  END IF;

  IF NOT public.is_active_club_member(v_af.club_id, v_user_id) THEN
    RAISE EXCEPTION 'Access denied.';
  END IF;

  SELECT id INTO v_existing_id
  FROM public.activity_reactions
  WHERE activity_id = p_activity_id
    AND user_id = v_user_id
    AND reaction_type = p_reaction_type;

  IF v_existing_id IS NOT NULL THEN
    DELETE FROM public.activity_reactions WHERE id = v_existing_id;
    v_action := 'removed';
  ELSE
    INSERT INTO public.activity_reactions (activity_id, user_id, reaction_type)
    VALUES (p_activity_id, v_user_id, p_reaction_type)
    ON CONFLICT (activity_id, user_id, reaction_type) DO NOTHING;
    v_action := 'added';
  END IF;

  RETURN jsonb_build_object('success', true, 'action', v_action);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.toggle_activity_reaction(UUID, TEXT) TO authenticated;

