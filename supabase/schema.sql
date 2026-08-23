-- ============================================================================
-- FITNESS GROUP APPLICATION - COMPLETE DATABASE SCHEMA & RLS POLICIES
-- ============================================================================
-- Target Database: PostgreSQL 15+ / Supabase
-- Multi-club Architecture with Strict Row-Level Security (RLS) & Column Privacy
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions & Types
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE club_role AS ENUM ('admin', 'instructor', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE member_status AS ENUM ('active', 'pending', 'suspended', 'muted', 'removed', 'banned');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE goal_status AS ENUM ('in_progress', 'completed', 'abandoned');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE challenge_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- Common Trigger Functions
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Table 1: clubs
-- Multi-club platform architecture
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_clubs_updated_at
  BEFORE UPDATE ON public.clubs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- Table 2: profiles
-- User profile information linked 1:1 to auth.users.
-- Note: Does NOT store club_id directly (users can join multiple clubs).
-- Sensitive fields: age, height, weight.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  whatsapp_number TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  age INTEGER CHECK (age >= 0 AND age <= 150),
  height NUMERIC(5,2) CHECK (height > 0),
  weight NUMERIC(5,2) CHECK (weight > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Automatically create profile when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    avatar_url,
    whatsapp_number,
    gender,
    age,
    height
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Member'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'whatsapp_number',
    NEW.raw_user_meta_data->>'gender',
    NULLIF(NEW.raw_user_meta_data->>'age', '')::INTEGER,
    NULLIF(NEW.raw_user_meta_data->>'height', '')::NUMERIC
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    whatsapp_number = COALESCE(EXCLUDED.whatsapp_number, public.profiles.whatsapp_number),
    gender = COALESCE(EXCLUDED.gender, public.profiles.gender),
    age = COALESCE(EXCLUDED.age, public.profiles.age),
    height = COALESCE(EXCLUDED.height, public.profiles.height);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Table 3: club_members
-- Multi-club membership with roles (admin, instructor, member) & status
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role club_role NOT NULL DEFAULT 'member',
  status member_status NOT NULL DEFAULT 'active',
  muted_until TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_club_member UNIQUE (club_id, user_id)
);

CREATE TRIGGER set_club_members_updated_at
  BEFORE UPDATE ON public.club_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- Table 4: exercises
-- Exercise catalog / movement database
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  muscle_group TEXT,
  equipment TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Table 5: workout_sessions
-- Logged workout sessions per user per club.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  workout_name TEXT NOT NULL DEFAULT 'Workout Session',
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ DEFAULT now(),
  duration_minutes INTEGER CHECK (duration_minutes >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Table 6: workout_exercises
-- Individual exercises attached to a workout session.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  order_index INTEGER DEFAULT 0,
  sets INTEGER CHECK (sets > 0),
  reps INTEGER CHECK (reps >= 0),
  weight NUMERIC(6,2) CHECK (weight >= 0),
  duration_seconds INTEGER CHECK (duration_seconds >= 0),
  notes TEXT
);

-- ----------------------------------------------------------------------------
-- Table 6b: exercise_sets
-- Granular sets, reps, weights, duration, distance logged per exercise.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exercise_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL CHECK (set_number > 0),
  reps INTEGER CHECK (reps >= 0),
  weight NUMERIC(6,2) CHECK (weight >= 0),
  duration_seconds INTEGER CHECK (duration_seconds >= 0),
  distance NUMERIC(6,2) CHECK (distance >= 0),
  completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Table 7: daily_activity
-- Daily steps, hydration, and workout completion per user per date.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INTEGER NOT NULL DEFAULT 0 CHECK (steps >= 0),
  water_glasses INTEGER NOT NULL DEFAULT 0 CHECK (water_glasses >= 0),
  workout_completed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_daily_activity UNIQUE (user_id, activity_date)
);

CREATE TRIGGER set_daily_activity_updated_at
  BEFORE UPDATE ON public.daily_activity
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- Table 7b: steps (legacy compatibility)
-- Daily steps tracking per user per club
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  step_count INTEGER NOT NULL CHECK (step_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_club_step_date UNIQUE (user_id, club_id, activity_date)
);

CREATE TRIGGER set_steps_updated_at
  BEFORE UPDATE ON public.steps
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- Table 8: nutrition_logs
-- Daily nutrition, calories, and macros (strictly private to user)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nutrition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  calories NUMERIC(6,1) CHECK (calories >= 0),
  protein NUMERIC(5,1) CHECK (protein >= 0),
  carbs NUMERIC(5,1) CHECK (carbs >= 0),
  fat NUMERIC(5,1) CHECK (fat >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Table 9: goals
-- Personal and club milestone targets
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC(10,2) NOT NULL,
  current_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  status goal_status NOT NULL DEFAULT 'in_progress',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- Table 10: achievements
-- System badge definitions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value NUMERIC(10,2) NOT NULL,
  tier TEXT DEFAULT 'bronze',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Table 10b: xp_transactions
-- Gamification XP audit trail with unique event idempotency
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Table 11: user_achievements
-- Awarded badges per user per club
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  awarded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT uq_user_club_achievement UNIQUE (user_id, club_id, achievement_id)
);

-- ----------------------------------------------------------------------------
-- Table 12: challenges
-- Club-wide fitness competitions & challenges
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL,
  target_value NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status challenge_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_challenge_dates CHECK (end_date >= start_date)
);

-- ----------------------------------------------------------------------------
-- Table 13: challenge_participants
-- Member progress in club challenges
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_challenge_participant UNIQUE (challenge_id, user_id)
);

CREATE TRIGGER set_challenge_participants_updated_at
  BEFORE UPDATE ON public.challenge_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- Table 14: activity_feed
-- Aggregated club activity feed
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  reference_id UUID,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Table 15: chat_messages
-- Club community chat messages
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- Table 16: notifications
-- User notifications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Table 17: daily_prayer_tracking
-- Daily spiritual habits and prayer tracking (private to user)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_prayer_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  tracking_date DATE NOT NULL DEFAULT CURRENT_DATE,
  fajr BOOLEAN NOT NULL DEFAULT false,
  dhuhr BOOLEAN NOT NULL DEFAULT false,
  asr BOOLEAN NOT NULL DEFAULT false,
  maghrib BOOLEAN NOT NULL DEFAULT false,
  isha BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_club_prayer_date UNIQUE (user_id, club_id, tracking_date)
);

CREATE TRIGGER set_daily_prayer_updated_at
  BEFORE UPDATE ON public.daily_prayer_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_club_members_club_user ON public.club_members(club_id, user_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user ON public.club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_club_members_status ON public.club_members(status);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_club_date ON public.workout_sessions(club_id, workout_date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON public.workout_sessions(user_id, workout_date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_session ON public.workout_exercises(workout_session_id);

CREATE INDEX IF NOT EXISTS idx_steps_club_date ON public.steps(club_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_steps_user_date ON public.steps(user_id, activity_date DESC);

CREATE INDEX IF NOT EXISTS idx_nutrition_user_date ON public.nutrition_logs(user_id, log_date DESC);

CREATE INDEX IF NOT EXISTS idx_goals_user_club ON public.goals(user_id, club_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_club_user ON public.user_achievements(club_id, user_id);

CREATE INDEX IF NOT EXISTS idx_challenges_club_status ON public.challenges(club_id, status);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON public.challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON public.challenge_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_activity_feed_club_created ON public.activity_feed(club_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_club_created ON public.chat_messages(club_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_prayer_tracking_user_date ON public.daily_prayer_tracking(user_id, tracking_date DESC);

-- ============================================================================
-- SECURITY FUNCTIONS (SECURITY DEFINER)
-- ============================================================================

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
-- SECURE VIEW FOR CO-MEMBER PROFILES (Hides age, height, weight)
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

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
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

-- 1. CLUBS
CREATE POLICY "clubs_select_active_members"
  ON public.clubs FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.is_active_club_member(id, auth.uid()));

CREATE POLICY "clubs_insert_creator"
  ON public.clubs FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "clubs_update_admin"
  ON public.clubs FOR UPDATE TO authenticated
  USING (public.is_club_admin(id, auth.uid()))
  WITH CHECK (public.is_club_admin(id, auth.uid()));

CREATE POLICY "clubs_delete_admin"
  ON public.clubs FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.is_club_admin(id, auth.uid()));

-- 2. PROFILES (Strictly Private)
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE TO authenticated
  USING (id = auth.uid());

-- 3. CLUB_MEMBERS
CREATE POLICY "club_members_select_active"
  ON public.club_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_active_club_member(club_id, auth.uid()));

CREATE POLICY "club_members_insert"
  ON public.club_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_club_admin(club_id, auth.uid()));

CREATE POLICY "club_members_update_admin_or_instructor"
  ON public.club_members FOR UPDATE TO authenticated
  USING (
    public.is_club_admin(club_id, auth.uid()) OR
    (public.is_club_instructor_or_admin(club_id, auth.uid()) AND role = 'member')
  )
  WITH CHECK (
    public.is_club_admin(club_id, auth.uid()) OR
    (public.is_club_instructor_or_admin(club_id, auth.uid()) AND role = 'member')
  );

CREATE POLICY "club_members_delete_admin_or_self"
  ON public.club_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_club_admin(club_id, auth.uid()));

-- 4. EXERCISES
CREATE POLICY "exercises_select_authenticated"
  ON public.exercises FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "exercises_insert_instructors_or_admins"
  ON public.exercises FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'instructor') AND status = 'active'
    )
  );

CREATE POLICY "exercises_update_instructors_or_admins"
  ON public.exercises FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'instructor') AND status = 'active'
    )
  );

-- 5. WORKOUT_SESSIONS
CREATE POLICY "workout_sessions_select_club_members"
  ON public.workout_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_active_club_member(club_id, auth.uid()));

CREATE POLICY "workout_sessions_insert_own"
  ON public.workout_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_active_club_member(club_id, auth.uid()));

CREATE POLICY "workout_sessions_update_own"
  ON public.workout_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "workout_sessions_delete_own_or_admin"
  ON public.workout_sessions FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_club_admin(club_id, auth.uid()));

-- 6. WORKOUT_EXERCISES
CREATE POLICY "workout_exercises_select_session_access"
  ON public.workout_exercises FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = workout_session_id
        AND (ws.user_id = auth.uid() OR public.is_active_club_member(ws.club_id, auth.uid()))
    )
  );

CREATE POLICY "workout_exercises_insert_own_session"
  ON public.workout_exercises FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = workout_session_id AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "workout_exercises_update_own_session"
  ON public.workout_exercises FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = workout_session_id AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "workout_exercises_delete_own_session"
  ON public.workout_exercises FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = workout_session_id AND ws.user_id = auth.uid()
    )
  );

-- 7. STEPS
CREATE POLICY "steps_select_club_members"
  ON public.steps FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_active_club_member(club_id, auth.uid()));

CREATE POLICY "steps_insert_own"
  ON public.steps FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_active_club_member(club_id, auth.uid()));

CREATE POLICY "steps_update_own"
  ON public.steps FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "steps_delete_own"
  ON public.steps FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 8. NUTRITION_LOGS (Strictly Private)
CREATE POLICY "nutrition_logs_select_own"
  ON public.nutrition_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "nutrition_logs_insert_own"
  ON public.nutrition_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_active_club_member(club_id, auth.uid()));

CREATE POLICY "nutrition_logs_update_own"
  ON public.nutrition_logs FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "nutrition_logs_delete_own"
  ON public.nutrition_logs FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 9. GOALS (Private to User)
CREATE POLICY "goals_select_own"
  ON public.goals FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "goals_insert_own"
  ON public.goals FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_active_club_member(club_id, auth.uid()));

CREATE POLICY "goals_update_own"
  ON public.goals FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "goals_delete_own"
  ON public.goals FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 10. ACHIEVEMENTS
CREATE POLICY "achievements_select_authenticated"
  ON public.achievements FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "achievements_insert_admin"
  ON public.achievements FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "achievements_update_admin"
  ON public.achievements FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- 11. USER_ACHIEVEMENTS
CREATE POLICY "user_achievements_select_club_members"
  ON public.user_achievements FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_active_club_member(club_id, auth.uid()));

CREATE POLICY "user_achievements_insert_instructors_or_admins"
  ON public.user_achievements FOR INSERT TO authenticated
  WITH CHECK (public.is_club_instructor_or_admin(club_id, auth.uid()));

CREATE POLICY "user_achievements_delete_admin"
  ON public.user_achievements FOR DELETE TO authenticated
  USING (public.is_club_admin(club_id, auth.uid()));

-- 12. CHALLENGES
CREATE POLICY "challenges_select_club_members"
  ON public.challenges FOR SELECT TO authenticated
  USING (public.is_active_club_member(club_id, auth.uid()));

CREATE POLICY "challenges_insert_instructors_or_admins"
  ON public.challenges FOR INSERT TO authenticated
  WITH CHECK (public.is_club_instructor_or_admin(club_id, auth.uid()));

CREATE POLICY "challenges_update_instructors_or_admins"
  ON public.challenges FOR UPDATE TO authenticated
  USING (public.is_club_instructor_or_admin(club_id, auth.uid()))
  WITH CHECK (public.is_club_instructor_or_admin(club_id, auth.uid()));

CREATE POLICY "challenges_delete_admin"
  ON public.challenges FOR DELETE TO authenticated
  USING (public.is_club_admin(club_id, auth.uid()));

-- 13. CHALLENGE_PARTICIPANTS
CREATE POLICY "challenge_participants_select_club_members"
  ON public.challenge_participants FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id
        AND (user_id = auth.uid() OR public.is_active_club_member(c.club_id, auth.uid()))
    )
  );

CREATE POLICY "challenge_participants_insert_own"
  ON public.challenge_participants FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id AND public.is_active_club_member(c.club_id, auth.uid())
    )
  );

CREATE POLICY "challenge_participants_update_own_or_instructors"
  ON public.challenge_participants FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id AND public.is_club_instructor_or_admin(c.club_id, auth.uid())
    )
  );

CREATE POLICY "challenge_participants_delete_own_or_admin"
  ON public.challenge_participants FOR DELETE TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id AND public.is_club_admin(c.club_id, auth.uid())
    )
  );

-- 14. ACTIVITY_FEED
CREATE POLICY "activity_feed_select_club_members"
  ON public.activity_feed FOR SELECT TO authenticated
  USING (public.is_active_club_member(club_id, auth.uid()));

CREATE POLICY "activity_feed_insert_own"
  ON public.activity_feed FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_active_club_member(club_id, auth.uid()));

CREATE POLICY "activity_feed_delete_own_or_admin"
  ON public.activity_feed FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_club_admin(club_id, auth.uid()));

-- 15. CHAT_MESSAGES
CREATE POLICY "chat_messages_select_club_members"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (public.is_active_club_member(club_id, auth.uid()));

CREATE POLICY "chat_messages_insert_unmuted_members"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.can_send_chat(club_id, auth.uid()));

CREATE POLICY "chat_messages_update_author_or_moderator"
  ON public.chat_messages FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid() OR public.is_club_instructor_or_admin(club_id, auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid() OR public.is_club_instructor_or_admin(club_id, auth.uid())
  );

CREATE POLICY "chat_messages_delete_author_or_moderator"
  ON public.chat_messages FOR DELETE TO authenticated
  USING (
    user_id = auth.uid() OR public.is_club_instructor_or_admin(club_id, auth.uid())
  );

-- 16. NOTIFICATIONS
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_delete_own"
  ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 17. DAILY_PRAYER_TRACKING
CREATE POLICY "daily_prayer_tracking_select_own"
  ON public.daily_prayer_tracking FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "daily_prayer_tracking_insert_own"
  ON public.daily_prayer_tracking FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_active_club_member(club_id, auth.uid()));

CREATE POLICY "daily_prayer_tracking_update_own"
  ON public.daily_prayer_tracking FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "daily_prayer_tracking_delete_own"
  ON public.daily_prayer_tracking FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- Public Member Directory View & RPC
-- Exposes ONLY public fields (full_name, avatar_url, whatsapp_number, gender, role, status, joined_at)
-- Strictly excludes private biometric fields (age, height, weight).
-- ============================================================================
CREATE OR REPLACE VIEW public.club_member_directory AS
SELECT
  cm.id AS membership_id,
  cm.club_id,
  cm.user_id,
  p.full_name,
  p.avatar_url,
  p.whatsapp_number,
  p.gender,
  cm.role,
  cm.status,
  cm.joined_at
FROM public.club_members cm
JOIN public.profiles p ON p.id = cm.user_id
WHERE cm.status = 'active'
  AND public.is_active_club_member(cm.club_id, auth.uid());

GRANT SELECT ON public.club_member_directory TO authenticated;

CREATE OR REPLACE FUNCTION public.get_club_members(target_club_id UUID)
RETURNS TABLE (
  membership_id UUID,
  club_id UUID,
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  whatsapp_number TEXT,
  gender TEXT,
  role club_role,
  status member_status,
  joined_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT public.is_active_club_member(target_club_id, auth.uid()) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    cm.id AS membership_id,
    cm.club_id,
    cm.user_id,
    p.full_name,
    p.avatar_url,
    p.whatsapp_number,
    p.gender,
    cm.role,
    cm.status,
    cm.joined_at
  FROM public.club_members cm
  JOIN public.profiles p ON p.id = cm.user_id
  WHERE cm.club_id = target_club_id
    AND cm.status = 'active'
  ORDER BY
    CASE WHEN cm.role = 'admin' THEN 1 WHEN cm.role = 'instructor' THEN 2 ELSE 3 END,
    cm.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_club_members(UUID) TO authenticated;


