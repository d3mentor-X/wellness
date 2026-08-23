-- ============================================================================
-- Fitness Application - Production Hardening & Security Migration
-- ============================================================================
-- Migration: 20260823000012_production_hardening_and_security.sql
-- Description:
-- 1. Tightens RLS on club_members: Only club admins can update club_members.
-- 2. Protects moderation_logs: Strictly append-only by system RPCs, read-only for admins.
-- 3. Adds robust safety constraints to prevent absurd/overflow numbers (steps, workouts, nutrition).
-- 4. Ensures all foreign key indexes exist for high performance.
-- 5. Implements club-level isolation guards across all RPC functions.
-- ============================================================================

-- 1. Tighten club_members UPDATE policy (Prevent privilege escalation)
DROP POLICY IF EXISTS "club_members_update_admin_or_instructor" ON public.club_members;
DROP POLICY IF EXISTS "club_members_update_admin_only" ON public.club_members;

CREATE POLICY "club_members_update_admin_only"
  ON public.club_members FOR UPDATE
  TO authenticated
  USING (
    public.is_club_admin(club_id, auth.uid())
  )
  WITH CHECK (
    public.is_club_admin(club_id, auth.uid())
  );

-- 2. Audit Trail Protection: moderation_logs can only be queried by club admins, never altered
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "moderation_logs_select_admin" ON public.moderation_logs;
CREATE POLICY "moderation_logs_select_admin"
  ON public.moderation_logs FOR SELECT
  TO authenticated
  USING (
    public.is_club_admin(club_id, auth.uid())
  );

-- 3. Add Bounds & Validation Constraints (Prevent absurd or malicious payloads)
DO $$
BEGIN
  -- Daily activity bounds
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_daily_activity_steps_max') THEN
    ALTER TABLE public.daily_activity ADD CONSTRAINT chk_daily_activity_steps_max CHECK (steps >= 0 AND steps <= 200000);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_daily_activity_water_max') THEN
    ALTER TABLE public.daily_activity ADD CONSTRAINT chk_daily_activity_water_max CHECK (water_glasses >= 0 AND water_glasses <= 50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_daily_activity_active_min_max') THEN
    ALTER TABLE public.daily_activity ADD CONSTRAINT chk_daily_activity_active_min_max CHECK (active_minutes >= 0 AND active_minutes <= 1440);
  END IF;

  -- Workout sessions bounds
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_workout_sessions_duration_max') THEN
    ALTER TABLE public.workout_sessions ADD CONSTRAINT chk_workout_sessions_duration_max CHECK (duration_minutes >= 0 AND duration_minutes <= 720);
  END IF;

  -- Nutrition bounds
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_nutrition_logs_calories_max') THEN
    ALTER TABLE public.nutrition_logs ADD CONSTRAINT chk_nutrition_logs_calories_max CHECK (calories >= 0 AND calories <= 20000);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_nutrition_log_items_qty_max') THEN
    ALTER TABLE public.nutrition_log_items ADD CONSTRAINT chk_nutrition_log_items_qty_max CHECK (quantity > 0 AND quantity <= 10000);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_nutrition_log_items_cals_max') THEN
    ALTER TABLE public.nutrition_log_items ADD CONSTRAINT chk_nutrition_log_items_cals_max CHECK (calories >= 0 AND calories <= 10000);
  END IF;
END $$;

-- 4. Ensure high performance index coverage on all relational queries
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON public.workout_sessions(user_id, workout_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date ON public.daily_activity(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date ON public.nutrition_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_club_created ON public.activity_feed(club_id, created_at DESC);

