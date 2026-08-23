-- ============================================================================
-- Fitness Application - Real Fitness Activity & Workout Tracking Migration
-- ============================================================================
-- Migration: 20260823000005_fitness_activity_system.sql
-- Description:
-- 1. Extends exercises with muscle_group and equipment fields.
-- 2. Seeds standard exercise library (20 curated movements).
-- 3. Extends workout_sessions with workout_name, started_at, completed_at.
-- 4. Extends workout_exercises with order_index.
-- 5. Creates exercise_sets table with granular set logging & RLS.
-- 6. Creates daily_activity table for daily steps, water, workout completion & RLS.
-- ============================================================================

-- 1. Extend exercises table
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS muscle_group TEXT;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS equipment TEXT;

-- Seed standard curated exercise library
INSERT INTO public.exercises (name, category, muscle_group, equipment, description)
VALUES
  ('Bench Press', 'Strength', 'Chest', 'Barbell', 'Flat barbell bench press for chest, shoulders, and triceps.'),
  ('Incline Dumbbell Press', 'Strength', 'Chest', 'Dumbbells', 'Incline dumbbell press targeting upper chest.'),
  ('Push Up', 'Bodyweight', 'Chest', 'Bodyweight', 'Standard push-ups targeting chest, core, and triceps.'),
  ('Barbell Squat', 'Strength', 'Legs', 'Barbell', 'Back squat targeting quadriceps, glutes, and core.'),
  ('Romanian Deadlift', 'Strength', 'Hamstrings', 'Barbell', 'Hinge movement targeting hamstrings and glutes.'),
  ('Walking Lunges', 'Strength', 'Legs', 'Dumbbells', 'Unilateral leg strength and stability movement.'),
  ('Pull Up', 'Bodyweight', 'Back', 'Pull-up Bar', 'Vertical pull targeting lats, biceps, and upper back.'),
  ('Barbell Row', 'Strength', 'Back', 'Barbell', 'Horizontal rowing movement targeting middle and upper back.'),
  ('Lat Pulldown', 'Strength', 'Back', 'Cable Machine', 'Cable lat pulldown targeting wide back development.'),
  ('Shoulder Press', 'Strength', 'Shoulders', 'Dumbbells', 'Overhead dumbbell press targeting deltoids.'),
  ('Lateral Raises', 'Strength', 'Shoulders', 'Dumbbells', 'Isolation movement for lateral deltoid heads.'),
  ('Bicep Curls', 'Strength', 'Arms', 'Dumbbells', 'Bicep dumbbell curls for arm strength.'),
  ('Tricep Dips', 'Bodyweight', 'Arms', 'Dip Station', 'Bodyweight dips targeting triceps and lower chest.'),
  ('Plank', 'Mobility', 'Core', 'Bodyweight', 'Isometric core hold for abdominal and stability strength.'),
  ('Hanging Leg Raises', 'Strength', 'Core', 'Pull-up Bar', 'Hanging leg raises for lower abdominals.'),
  ('Russian Twists', 'Bodyweight', 'Core', 'Bodyweight', 'Rotational core exercise for obliques.'),
  ('Running', 'Cardio', 'Full Body', 'Treadmill / Outdoor', 'Aerobic cardiovascular running or jogging.'),
  ('Cycling', 'Cardio', 'Legs', 'Stationary Bike', 'Low-impact cardiovascular cycling.'),
  ('Outdoor Walking', 'Cardio', 'Full Body', 'None', 'Brisk walking for daily steps and recovery.'),
  ('Jump Rope', 'Cardio', 'Full Body', 'Jump Rope', 'High intensity cardio and calf conditioning.')
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  muscle_group = EXCLUDED.muscle_group,
  equipment = EXCLUDED.equipment,
  description = EXCLUDED.description;

-- 2. Extend workout_sessions table
ALTER TABLE public.workout_sessions ADD COLUMN IF NOT EXISTS workout_name TEXT NOT NULL DEFAULT 'Workout Session';
ALTER TABLE public.workout_sessions ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.workout_sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT now();

-- 3. Extend workout_exercises table
ALTER TABLE public.workout_exercises ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE public.workout_exercises ALTER COLUMN sets DROP NOT NULL;

-- 4. Create exercise_sets table
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

CREATE INDEX IF NOT EXISTS idx_exercise_sets_workout_exercise ON public.exercise_sets(workout_exercise_id);

-- Enable RLS on exercise_sets
ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercise_sets_select_session_access"
  ON public.exercise_sets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_exercises we
      JOIN public.workout_sessions ws ON ws.id = we.workout_session_id
      WHERE we.id = exercise_sets.workout_exercise_id
        AND (ws.user_id = auth.uid() OR public.is_active_club_member(ws.club_id, auth.uid()))
    )
  );

CREATE POLICY "exercise_sets_insert_own_session"
  ON public.exercise_sets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_exercises we
      JOIN public.workout_sessions ws ON ws.id = we.workout_session_id
      WHERE we.id = exercise_sets.workout_exercise_id AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "exercise_sets_update_own_session"
  ON public.exercise_sets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_exercises we
      JOIN public.workout_sessions ws ON ws.id = we.workout_session_id
      WHERE we.id = exercise_sets.workout_exercise_id AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "exercise_sets_delete_own_session"
  ON public.exercise_sets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_exercises we
      JOIN public.workout_sessions ws ON ws.id = we.workout_session_id
      WHERE we.id = exercise_sets.workout_exercise_id AND ws.user_id = auth.uid()
    )
  );

-- 5. Create daily_activity table
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

CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date ON public.daily_activity(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_activity_club_date ON public.daily_activity(club_id, activity_date DESC);

-- Enable RLS on daily_activity
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_activity_select_club_members"
  ON public.daily_activity FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR public.is_active_club_member(club_id, auth.uid())
  );

CREATE POLICY "daily_activity_insert_own"
  ON public.daily_activity FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND public.is_active_club_member(club_id, auth.uid())
  );

CREATE POLICY "daily_activity_update_own"
  ON public.daily_activity FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "daily_activity_delete_own"
  ON public.daily_activity FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

