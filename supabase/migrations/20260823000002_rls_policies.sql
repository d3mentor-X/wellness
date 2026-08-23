-- ============================================================================
-- Fitness Application - Row Level Security (RLS) & Privacy Policies Migration
-- ============================================================================
-- Migration: 20260823000002_rls_policies.sql
-- Description:
-- 1. Helper security functions (bypasses RLS recursion using SECURITY DEFINER).
-- 2. Secure public profile view for co-member privacy (hides age, height, weight).
-- 3. Enables RLS on all 17 tables.
-- 4. Role-based policies (ADMIN, INSTRUCTOR, MEMBER) and multi-club isolation.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Security Helper Functions (SECURITY DEFINER to avoid infinite RLS recursion)
-- ----------------------------------------------------------------------------

-- Check if user is an active member of a specific club
CREATE OR REPLACE FUNCTION public.is_active_club_member(
  lookup_club_id UUID,
  lookup_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = lookup_club_id
      AND user_id = lookup_user_id
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check if user is an active admin of a specific club
CREATE OR REPLACE FUNCTION public.is_club_admin(
  lookup_club_id UUID,
  lookup_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = lookup_club_id
      AND user_id = lookup_user_id
      AND role = 'admin'
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check if user is an active instructor or admin of a specific club
CREATE OR REPLACE FUNCTION public.is_club_instructor_or_admin(
  lookup_club_id UUID,
  lookup_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = lookup_club_id
      AND user_id = lookup_user_id
      AND role IN ('admin', 'instructor')
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check if member is allowed to send chat messages (active, not muted, not banned)
CREATE OR REPLACE FUNCTION public.can_send_chat(
  lookup_club_id UUID,
  lookup_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = lookup_club_id
      AND user_id = lookup_user_id
      AND status = 'active'
      AND (muted_until IS NULL OR muted_until < now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check if two users share at least one common active club
CREATE OR REPLACE FUNCTION public.shares_active_club(
  user_a UUID,
  user_b UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  IF user_a = user_b THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.club_members m1
    JOIN public.club_members m2 ON m1.club_id = m2.club_id
    WHERE m1.user_id = user_a
      AND m2.user_id = user_b
      AND m1.status = 'active'
      AND m2.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- Secure Member Profile View
-- Allows co-members in the same active club to view public profile info
-- (full_name, avatar_url, whatsapp_number, gender) while strictly hiding
-- private biometric metrics (age, height, weight).
-- ============================================================================
CREATE OR REPLACE VIEW public.club_member_profiles AS
SELECT
  p.id,
  p.full_name,
  p.avatar_url,
  p.whatsapp_number,
  p.gender,
  p.created_at
FROM public.profiles p
WHERE public.shares_active_club(auth.uid(), p.id);

-- ----------------------------------------------------------------------------
-- Enable RLS on all 17 Tables
-- ----------------------------------------------------------------------------
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_prayer_tracking ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 1. CLUBS POLICIES
-- ============================================================================
CREATE POLICY "clubs_select_active_members"
  ON public.clubs FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR public.is_active_club_member(id, auth.uid())
  );

CREATE POLICY "clubs_insert_creator"
  ON public.clubs FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "clubs_update_admin"
  ON public.clubs FOR UPDATE
  TO authenticated
  USING (public.is_club_admin(id, auth.uid()))
  WITH CHECK (public.is_club_admin(id, auth.uid()));

CREATE POLICY "clubs_delete_admin"
  ON public.clubs FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR public.is_club_admin(id, auth.uid()));

-- ============================================================================
-- 2. PROFILES POLICIES
-- Strict privacy: Users can only directly select and modify their own profile.
-- Co-members access non-sensitive info via public.club_member_profiles.
-- ============================================================================
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (id = auth.uid());

-- ============================================================================
-- 3. CLUB_MEMBERS POLICIES
-- ============================================================================
CREATE POLICY "club_members_select_active"
  ON public.club_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR public.is_active_club_member(club_id, auth.uid())
  );

CREATE POLICY "club_members_insert"
  ON public.club_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR public.is_club_admin(club_id, auth.uid())
  );

CREATE POLICY "club_members_update_admin_or_instructor"
  ON public.club_members FOR UPDATE
  TO authenticated
  USING (
    public.is_club_admin(club_id, auth.uid()) OR
    (public.is_club_instructor_or_admin(club_id, auth.uid()) AND role = 'member')
  )
  WITH CHECK (
    public.is_club_admin(club_id, auth.uid()) OR
    (public.is_club_instructor_or_admin(club_id, auth.uid()) AND role = 'member')
  );

CREATE POLICY "club_members_delete_admin_or_self"
  ON public.club_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR public.is_club_admin(club_id, auth.uid())
  );

-- ============================================================================
-- 4. EXERCISES POLICIES (Shared catalog)
-- ============================================================================
CREATE POLICY "exercises_select_authenticated"
  ON public.exercises FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "exercises_insert_instructors_or_admins"
  ON public.exercises FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'instructor')
        AND status = 'active'
    )
  );

CREATE POLICY "exercises_update_instructors_or_admins"
  ON public.exercises FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'instructor')
        AND status = 'active'
    )
  );

-- ============================================================================
-- 5. WORKOUT_SESSIONS POLICIES
-- ============================================================================
CREATE POLICY "workout_sessions_select_club_members"
  ON public.workout_sessions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR public.is_active_club_member(club_id, auth.uid())
  );

CREATE POLICY "workout_sessions_insert_own"
  ON public.workout_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND public.is_active_club_member(club_id, auth.uid())
  );

CREATE POLICY "workout_sessions_update_own"
  ON public.workout_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "workout_sessions_delete_own_or_admin"
  ON public.workout_sessions FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR public.is_club_admin(club_id, auth.uid())
  );

-- ============================================================================
-- 6. WORKOUT_EXERCISES POLICIES
-- ============================================================================
CREATE POLICY "workout_exercises_select_session_access"
  ON public.workout_exercises FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = workout_session_id
        AND (ws.user_id = auth.uid() OR public.is_active_club_member(ws.club_id, auth.uid()))
    )
  );

CREATE POLICY "workout_exercises_insert_own_session"
  ON public.workout_exercises FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = workout_session_id AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "workout_exercises_update_own_session"
  ON public.workout_exercises FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = workout_session_id AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "workout_exercises_delete_own_session"
  ON public.workout_exercises FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = workout_session_id AND ws.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. STEPS POLICIES
-- ============================================================================
CREATE POLICY "steps_select_club_members"
  ON public.steps FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR public.is_active_club_member(club_id, auth.uid())
  );

CREATE POLICY "steps_insert_own"
  ON public.steps FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND public.is_active_club_member(club_id, auth.uid())
  );

CREATE POLICY "steps_update_own"
  ON public.steps FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "steps_delete_own"
  ON public.steps FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 8. NUTRITION_LOGS POLICIES (Strictly Private)
-- ============================================================================
CREATE POLICY "nutrition_logs_select_own"
  ON public.nutrition_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "nutrition_logs_insert_own"
  ON public.nutrition_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND public.is_active_club_member(club_id, auth.uid())
  );

CREATE POLICY "nutrition_logs_update_own"
  ON public.nutrition_logs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "nutrition_logs_delete_own"
  ON public.nutrition_logs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 9. GOALS POLICIES (Private to user)
-- ============================================================================
CREATE POLICY "goals_select_own"
  ON public.goals FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "goals_insert_own"
  ON public.goals FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND public.is_active_club_member(club_id, auth.uid())
  );

CREATE POLICY "goals_update_own"
  ON public.goals FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "goals_delete_own"
  ON public.goals FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 10. ACHIEVEMENTS POLICIES (Catalog)
-- ============================================================================
CREATE POLICY "achievements_select_authenticated"
  ON public.achievements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "achievements_insert_admin"
  ON public.achievements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "achievements_update_admin"
  ON public.achievements FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- ============================================================================
-- 11. USER_ACHIEVEMENTS POLICIES
-- ============================================================================
CREATE POLICY "user_achievements_select_club_members"
  ON public.user_achievements FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR public.is_active_club_member(club_id, auth.uid())
  );

CREATE POLICY "user_achievements_insert_instructors_or_admins"
  ON public.user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_club_instructor_or_admin(club_id, auth.uid())
  );

CREATE POLICY "user_achievements_delete_admin"
  ON public.user_achievements FOR DELETE
  TO authenticated
  USING (public.is_club_admin(club_id, auth.uid()));

-- ============================================================================
-- 12. CHALLENGES POLICIES
-- ============================================================================
CREATE POLICY "challenges_select_club_members"
  ON public.challenges FOR SELECT
  TO authenticated
  USING (public.is_active_club_member(club_id, auth.uid()));

CREATE POLICY "challenges_insert_instructors_or_admins"
  ON public.challenges FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_club_instructor_or_admin(club_id, auth.uid())
  );

CREATE POLICY "challenges_update_instructors_or_admins"
  ON public.challenges FOR UPDATE
  TO authenticated
  USING (public.is_club_instructor_or_admin(club_id, auth.uid()))
  WITH CHECK (public.is_club_instructor_or_admin(club_id, auth.uid()));

CREATE POLICY "challenges_delete_admin"
  ON public.challenges FOR DELETE
  TO authenticated
  USING (public.is_club_admin(club_id, auth.uid()));

-- ============================================================================
-- 13. CHALLENGE_PARTICIPANTS POLICIES
-- ============================================================================
CREATE POLICY "challenge_participants_select_club_members"
  ON public.challenge_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id
        AND (user_id = auth.uid() OR public.is_active_club_member(c.club_id, auth.uid()))
    )
  );

CREATE POLICY "challenge_participants_insert_own"
  ON public.challenge_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id AND public.is_active_club_member(c.club_id, auth.uid())
    )
  );

CREATE POLICY "challenge_participants_update_own_or_instructors"
  ON public.challenge_participants FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id AND public.is_club_instructor_or_admin(c.club_id, auth.uid())
    )
  );

CREATE POLICY "challenge_participants_delete_own_or_admin"
  ON public.challenge_participants FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id AND public.is_club_admin(c.club_id, auth.uid())
    )
  );

-- ============================================================================
-- 14. ACTIVITY_FEED POLICIES
-- ============================================================================
CREATE POLICY "activity_feed_select_club_members"
  ON public.activity_feed FOR SELECT
  TO authenticated
  USING (public.is_active_club_member(club_id, auth.uid()));

CREATE POLICY "activity_feed_insert_own"
  ON public.activity_feed FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND public.is_active_club_member(club_id, auth.uid())
  );

CREATE POLICY "activity_feed_delete_own_or_admin"
  ON public.activity_feed FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR public.is_club_admin(club_id, auth.uid())
  );

-- ============================================================================
-- 15. CHAT_MESSAGES POLICIES
-- Moderation: Muted or banned members cannot send messages.
-- Instructors/Admins can soft-delete or moderate messages.
-- ============================================================================
CREATE POLICY "chat_messages_select_club_members"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (public.is_active_club_member(club_id, auth.uid()));

CREATE POLICY "chat_messages_insert_unmuted_members"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND public.can_send_chat(club_id, auth.uid())
  );

CREATE POLICY "chat_messages_update_author_or_moderator"
  ON public.chat_messages FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR public.is_club_instructor_or_admin(club_id, auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid() OR public.is_club_instructor_or_admin(club_id, auth.uid())
  );

CREATE POLICY "chat_messages_delete_author_or_moderator"
  ON public.chat_messages FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR public.is_club_instructor_or_admin(club_id, auth.uid())
  );

-- ============================================================================
-- 16. NOTIFICATIONS POLICIES (Private to recipient)
-- ============================================================================
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_delete_own"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 17. DAILY_PRAYER_TRACKING POLICIES (Private to user)
-- ============================================================================
CREATE POLICY "daily_prayer_tracking_select_own"
  ON public.daily_prayer_tracking FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "daily_prayer_tracking_insert_own"
  ON public.daily_prayer_tracking FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND public.is_active_club_member(club_id, auth.uid())
  );

CREATE POLICY "daily_prayer_tracking_update_own"
  ON public.daily_prayer_tracking FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "daily_prayer_tracking_delete_own"
  ON public.daily_prayer_tracking FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

