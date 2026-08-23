-- ============================================================================
-- Fitness Application - Admin & Instructor Management Migration
-- ============================================================================
-- Migration: 20260823000009_admin_instructor_management.sql
-- Description:
-- 1. Adds is_archived to exercises table.
-- 2. Creates moderation_logs table for audit trail.
-- 3. Implements admin_get_club_overview RPC function.
-- 4. Implements admin_get_members_detailed RPC function (strict privacy enforcement).
-- 5. Implements admin_update_member_status RPC function (approve, suspend, restore, ban, remove).
-- 6. Implements admin_set_member_role RPC function (assign/remove instructor).
-- 7. Implements admin_mute_member and admin_unmute_member RPC functions.
-- 8. Implements admin_update_club_settings RPC function.
-- 9. Implements instructor_manage_exercise RPC function.
-- 10. Implements admin_get_moderation_logs RPC function.
-- 11. Sets up RLS policies on moderation_logs and admin entities.
-- ============================================================================

-- 1. Add is_archived column to exercises
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- 2. Create moderation_logs table
CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_club ON public.moderation_logs(club_id, created_at DESC);

ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "moderation_logs_select_admin"
  ON public.moderation_logs FOR SELECT
  TO authenticated
  USING (public.is_club_admin(club_id, auth.uid()));

CREATE POLICY "moderation_logs_insert_admin_or_instructor"
  ON public.moderation_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_user_id = auth.uid() AND
    public.is_club_instructor_or_admin(club_id, auth.uid())
  );

-- 3. Admin Club Overview RPC
CREATE OR REPLACE FUNCTION public.admin_get_club_overview(p_club_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_total_members INTEGER := 0;
  v_pending_count INTEGER := 0;
  v_active_today INTEGER := 0;
  v_workouts_today INTEGER := 0;
  v_steps_today BIGINT := 0;
  v_active_challenges INTEGER := 0;
BEGIN
  IF NOT public.is_club_instructor_or_admin(p_club_id, v_caller_id) THEN
    RAISE EXCEPTION 'Access denied: Admin or Instructor privileges required.';
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_total_members
  FROM public.club_members WHERE club_id = p_club_id AND status = 'active';

  SELECT COUNT(*)::INTEGER INTO v_pending_count
  FROM public.club_members WHERE club_id = p_club_id AND status = 'pending';

  SELECT COUNT(DISTINCT cm.user_id)::INTEGER INTO v_active_today
  FROM public.club_members cm
  LEFT JOIN public.workout_sessions ws ON ws.user_id = cm.user_id AND ws.club_id = p_club_id AND ws.workout_date = CURRENT_DATE
  LEFT JOIN public.daily_activity da ON da.user_id = cm.user_id AND da.club_id = p_club_id AND da.activity_date = CURRENT_DATE
  WHERE cm.club_id = p_club_id AND cm.status = 'active'
    AND (ws.id IS NOT NULL OR (da.steps > 0 OR da.workout_completed = true));

  SELECT COUNT(*)::INTEGER INTO v_workouts_today
  FROM public.workout_sessions WHERE club_id = p_club_id AND workout_date = CURRENT_DATE;

  SELECT COALESCE(SUM(steps), 0)::BIGINT INTO v_steps_today
  FROM public.daily_activity WHERE club_id = p_club_id AND activity_date = CURRENT_DATE;

  SELECT COUNT(*)::INTEGER INTO v_active_challenges
  FROM public.challenges WHERE club_id = p_club_id AND status = 'active';

  RETURN jsonb_build_object(
    'total_members', v_total_members,
    'pending_members', v_pending_count,
    'active_today', v_active_today,
    'workouts_today', v_workouts_today,
    'steps_today', v_steps_today,
    'active_challenges', v_active_challenges
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_get_club_overview(UUID) TO authenticated;

-- 4. Admin Get Members Detailed RPC (Omits age, height, weight)
CREATE OR REPLACE FUNCTION public.admin_get_members_detailed(
  p_club_id UUID,
  p_status_filter TEXT DEFAULT 'all',
  p_search TEXT DEFAULT ''
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  whatsapp_number TEXT,
  gender TEXT,
  role club_role,
  status member_status,
  joined_at TIMESTAMPTZ,
  muted_until TIMESTAMPTZ,
  current_streak INTEGER,
  total_xp BIGINT,
  level INTEGER
) AS $$
BEGIN
  IF NOT public.is_club_instructor_or_admin(p_club_id, auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin or Instructor privileges required.';
  END IF;

  RETURN QUERY
  WITH member_xp AS (
    SELECT
      cm.user_id AS m_uid,
      COALESCE(SUM(xt.amount), 0)::BIGINT AS xp_sum
    FROM public.club_members cm
    LEFT JOIN public.xp_transactions xt ON xt.user_id = cm.user_id AND xt.club_id = p_club_id
    WHERE cm.club_id = p_club_id
    GROUP BY cm.user_id
  )
  SELECT
    cm.user_id,
    COALESCE(p.full_name, 'Member') AS full_name,
    p.avatar_url,
    p.whatsapp_number,
    p.gender,
    cm.role,
    cm.status,
    cm.joined_at,
    cm.muted_until,
    COALESCE(st.current_streak, 0)::INTEGER AS current_streak,
    COALESCE(mx.xp_sum, 0)::BIGINT AS total_xp,
    CASE
      WHEN COALESCE(mx.xp_sum, 0) >= 4100 THEN 10 + ((COALESCE(mx.xp_sum, 0) - 4100) / 1000)::INTEGER
      WHEN COALESCE(mx.xp_sum, 0) >= 3250 THEN 9
      WHEN COALESCE(mx.xp_sum, 0) >= 2500 THEN 8
      WHEN COALESCE(mx.xp_sum, 0) >= 1850 THEN 7
      WHEN COALESCE(mx.xp_sum, 0) >= 1300 THEN 6
      WHEN COALESCE(mx.xp_sum, 0) >= 850 THEN 5
      WHEN COALESCE(mx.xp_sum, 0) >= 500 THEN 4
      WHEN COALESCE(mx.xp_sum, 0) >= 250 THEN 3
      WHEN COALESCE(mx.xp_sum, 0) >= 100 THEN 2
      ELSE 1
    END AS level
  FROM public.club_members cm
  JOIN public.profiles p ON p.id = cm.user_id
  LEFT JOIN member_xp mx ON mx.m_uid = cm.user_id
  LEFT JOIN LATERAL (
    SELECT current_streak FROM public.calculate_user_streak(cm.user_id, CURRENT_DATE)
  ) st ON true
  WHERE cm.club_id = p_club_id
    AND (
      p_status_filter = 'all' OR
      cm.status::TEXT = p_status_filter
    )
    AND (
      p_search = '' OR
      p.full_name ILIKE '%' || p_search || '%' OR
      p.whatsapp_number ILIKE '%' || p_search || '%'
    )
  ORDER BY
    CASE cm.status
      WHEN 'pending' THEN 1
      WHEN 'active' THEN 2
      WHEN 'suspended' THEN 3
      WHEN 'banned' THEN 4
      ELSE 5
    END,
    cm.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_get_members_detailed(UUID, TEXT, TEXT) TO authenticated;

-- 5. Admin Update Member Status RPC
CREATE OR REPLACE FUNCTION public.admin_update_member_status(
  p_club_id UUID,
  p_target_user_id UUID,
  p_new_status member_status,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_current_role club_role;
  v_old_status member_status;
BEGIN
  IF NOT public.is_club_admin(p_club_id, v_caller_id) THEN
    RAISE EXCEPTION 'Access denied: Only club administrators can modify member status.';
  END IF;

  IF v_caller_id = p_target_user_id THEN
    RAISE EXCEPTION 'Self-modification forbidden: You cannot change your own membership status.';
  END IF;

  SELECT role, status INTO v_current_role, v_old_status
  FROM public.club_members
  WHERE club_id = p_club_id AND user_id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member record not found in this club.';
  END IF;

  IF v_current_role = 'admin' AND p_new_status IN ('suspended', 'banned') THEN
    RAISE EXCEPTION 'Operation forbidden: Cannot suspend or ban a fellow administrator.';
  END IF;

  UPDATE public.club_members
  SET status = p_new_status, updated_at = now()
  WHERE club_id = p_club_id AND user_id = p_target_user_id;

  -- Insert audit log
  INSERT INTO public.moderation_logs (club_id, actor_user_id, target_user_id, action_type, metadata)
  VALUES (
    p_club_id,
    v_caller_id,
    p_target_user_id,
    'member_status_updated',
    jsonb_build_object('old_status', v_old_status, 'new_status', p_new_status, 'reason', p_reason)
  );

  RETURN jsonb_build_object('success', true, 'old_status', v_old_status, 'new_status', p_new_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_update_member_status(UUID, UUID, member_status, TEXT) TO authenticated;

-- 6. Admin Set Member Role RPC
CREATE OR REPLACE FUNCTION public.admin_set_member_role(
  p_club_id UUID,
  p_target_user_id UUID,
  p_new_role club_role
)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_old_role club_role;
BEGIN
  IF NOT public.is_club_admin(p_club_id, v_caller_id) THEN
    RAISE EXCEPTION 'Access denied: Only club administrators can assign or remove roles.';
  END IF;

  IF v_caller_id = p_target_user_id THEN
    RAISE EXCEPTION 'Self-modification forbidden: You cannot alter your own administrative role.';
  END IF;

  SELECT role INTO v_old_role
  FROM public.club_members
  WHERE club_id = p_club_id AND user_id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found in this club.';
  END IF;

  UPDATE public.club_members
  SET role = p_new_role, updated_at = now()
  WHERE club_id = p_club_id AND user_id = p_target_user_id;

  -- Insert audit log
  INSERT INTO public.moderation_logs (club_id, actor_user_id, target_user_id, action_type, metadata)
  VALUES (
    p_club_id,
    v_caller_id,
    p_target_user_id,
    CASE WHEN p_new_role = 'instructor' THEN 'instructor_assigned' ELSE 'instructor_removed' END,
    jsonb_build_object('old_role', v_old_role, 'new_role', p_new_role)
  );

  RETURN jsonb_build_object('success', true, 'old_role', v_old_role, 'new_role', p_new_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_set_member_role(UUID, UUID, club_role) TO authenticated;

-- 7. Admin Mute Member RPC
CREATE OR REPLACE FUNCTION public.admin_mute_member(
  p_club_id UUID,
  p_target_user_id UUID,
  p_duration_minutes INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_muted_until TIMESTAMPTZ;
BEGIN
  IF NOT public.is_club_instructor_or_admin(p_club_id, v_caller_id) THEN
    RAISE EXCEPTION 'Access denied: Instructor or Admin privileges required.';
  END IF;

  IF v_caller_id = p_target_user_id THEN
    RAISE EXCEPTION 'Cannot mute yourself.';
  END IF;

  IF p_duration_minutes > 0 THEN
    v_muted_until := now() + (p_duration_minutes || ' minutes')::INTERVAL;
  ELSE
    -- Indefinite mute (100 years)
    v_muted_until := now() + INTERVAL '100 years';
  END IF;

  UPDATE public.club_members
  SET muted_until = v_muted_until, updated_at = now()
  WHERE club_id = p_club_id AND user_id = p_target_user_id;

  INSERT INTO public.moderation_logs (club_id, actor_user_id, target_user_id, action_type, metadata)
  VALUES (
    p_club_id,
    v_caller_id,
    p_target_user_id,
    'member_muted',
    jsonb_build_object('duration_minutes', p_duration_minutes, 'muted_until', v_muted_until)
  );

  RETURN jsonb_build_object('success', true, 'muted_until', v_muted_until);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_mute_member(UUID, UUID, INTEGER) TO authenticated;

-- Unmute Member RPC
CREATE OR REPLACE FUNCTION public.admin_unmute_member(
  p_club_id UUID,
  p_target_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID := auth.uid();
BEGIN
  IF NOT public.is_club_instructor_or_admin(p_club_id, v_caller_id) THEN
    RAISE EXCEPTION 'Access denied: Instructor or Admin privileges required.';
  END IF;

  UPDATE public.club_members
  SET muted_until = NULL, updated_at = now()
  WHERE club_id = p_club_id AND user_id = p_target_user_id;

  INSERT INTO public.moderation_logs (club_id, actor_user_id, target_user_id, action_type, metadata)
  VALUES (
    p_club_id,
    v_caller_id,
    p_target_user_id,
    'member_unmuted',
    '{}'::jsonb
  );

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_unmute_member(UUID, UUID) TO authenticated;

-- 8. Admin Update Club Settings RPC
CREATE OR REPLACE FUNCTION public.admin_update_club_settings(
  p_club_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_whatsapp_link TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID := auth.uid();
BEGIN
  IF NOT public.is_club_admin(p_club_id, v_caller_id) THEN
    RAISE EXCEPTION 'Access denied: Only club administrators can modify club settings.';
  END IF;

  UPDATE public.clubs
  SET
    name = COALESCE(NULLIF(p_name, ''), name),
    description = p_description,
    whatsapp_group_link = p_whatsapp_link,
    updated_at = now()
  WHERE id = p_club_id;

  INSERT INTO public.moderation_logs (club_id, actor_user_id, action_type, metadata)
  VALUES (
    p_club_id,
    v_caller_id,
    'club_settings_updated',
    jsonb_build_object('name', p_name, 'whatsapp_link', p_whatsapp_link)
  );

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_update_club_settings(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- 9. Instructor / Admin Manage Exercise RPC
CREATE OR REPLACE FUNCTION public.instructor_manage_exercise(
  p_exercise_id UUID,
  p_name TEXT,
  p_category TEXT,
  p_muscle_group TEXT DEFAULT NULL,
  p_equipment TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_is_archived BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_res_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.club_members
    WHERE user_id = v_caller_id
      AND role IN ('admin', 'instructor')
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Access denied: Instructor or Admin role required.';
  END IF;

  IF p_exercise_id IS NOT NULL THEN
    UPDATE public.exercises
    SET
      name = p_name,
      category = p_category,
      muscle_group = p_muscle_group,
      equipment = p_equipment,
      description = p_description,
      is_archived = p_is_archived
    WHERE id = p_exercise_id
    RETURNING id INTO v_res_id;
  ELSE
    INSERT INTO public.exercises (name, category, muscle_group, equipment, description, is_archived)
    VALUES (p_name, p_category, p_muscle_group, p_equipment, p_description, p_is_archived)
    RETURNING id INTO v_res_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'exercise_id', v_res_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.instructor_manage_exercise(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;

-- 10. Admin Get Moderation Logs RPC
CREATE OR REPLACE FUNCTION public.admin_get_moderation_logs(p_club_id UUID)
RETURNS TABLE (
  id UUID,
  actor_id UUID,
  actor_name TEXT,
  actor_role club_role,
  target_id UUID,
  target_name TEXT,
  action_type TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT public.is_club_admin(p_club_id, auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can view moderation logs.';
  END IF;

  RETURN QUERY
  SELECT
    ml.id,
    ml.actor_user_id AS actor_id,
    COALESCE(ap.full_name, 'Admin') AS actor_name,
    COALESCE(acm.role, 'admin'::club_role) AS actor_role,
    ml.target_user_id AS target_id,
    tp.full_name AS target_name,
    ml.action_type,
    ml.metadata,
    ml.created_at
  FROM public.moderation_logs ml
  JOIN public.profiles ap ON ap.id = ml.actor_user_id
  LEFT JOIN public.club_members acm ON acm.user_id = ml.actor_user_id AND acm.club_id = p_club_id
  LEFT JOIN public.profiles tp ON tp.id = ml.target_user_id
  WHERE ml.club_id = p_club_id
  ORDER BY ml.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_get_moderation_logs(UUID) TO authenticated;

