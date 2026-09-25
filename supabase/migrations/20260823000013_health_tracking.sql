-- ============================================================================
-- Wellness Application - Daily Health: Sleep & Screen Time Tracking
-- ============================================================================
-- Migration: 20260823000013_health_tracking.sql
-- Description:
-- 1. Creates daily_health_logs table for daily sleep duration, sleep goals,
--    screen time minutes, and optional digital wellbeing screenshots.
-- 2. Enforces strict RLS policies (health data is strictly private to the owner).
-- 3. Implements immutability trigger protecting club_id, user_id, and log_date.
-- 4. Creates private storage bucket 'health_screenshots' and strict object-level RLS
--    via a security-definer helper function to maintain table privacy.
-- 5. Implements RPC function get_daily_health_summary with 7-day rolling averages.
-- ============================================================================

-- 1. Create daily_health_logs table
CREATE TABLE IF NOT EXISTS public.daily_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sleep_minutes INTEGER CHECK (sleep_minutes >= 0 AND sleep_minutes <= 1440),
  sleep_goal_minutes INTEGER DEFAULT 480 CHECK (sleep_goal_minutes >= 180 AND sleep_goal_minutes <= 960),
  screen_time_minutes INTEGER CHECK (screen_time_minutes >= 0 AND screen_time_minutes <= 1440),
  screen_time_goal_minutes INTEGER DEFAULT 240 CHECK (screen_time_goal_minutes >= 0 AND screen_time_goal_minutes <= 1440),
  screenshot_url TEXT,
  is_screenshot_shared BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_club_health_date UNIQUE (user_id, club_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_health_logs_user_date ON public.daily_health_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_health_logs_club_date ON public.daily_health_logs(club_id, log_date DESC);

-- 2. Trigger for updated_at (safely repeatable)
DROP TRIGGER IF EXISTS set_daily_health_logs_updated_at ON public.daily_health_logs;
CREATE TRIGGER set_daily_health_logs_updated_at
  BEFORE UPDATE ON public.daily_health_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. Immutability validation trigger for sensitive foreign keys
CREATE OR REPLACE FUNCTION public.check_daily_health_logs_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'user_id cannot be modified.';
  END IF;
  IF NEW.club_id <> OLD.club_id THEN
    RAISE EXCEPTION 'club_id cannot be modified.';
  END IF;
  IF NEW.log_date <> OLD.log_date THEN
    RAISE EXCEPTION 'log_date cannot be modified.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS check_daily_health_logs_immutable ON public.daily_health_logs;
CREATE TRIGGER check_daily_health_logs_immutable
  BEFORE UPDATE ON public.daily_health_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.check_daily_health_logs_immutability();

-- 4. RLS on daily_health_logs (STRICTLY private to owner)
ALTER TABLE public.daily_health_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_health_logs_select_own" ON public.daily_health_logs;
CREATE POLICY "daily_health_logs_select_own"
  ON public.daily_health_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "daily_health_logs_insert_own" ON public.daily_health_logs;
CREATE POLICY "daily_health_logs_insert_own"
  ON public.daily_health_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    public.is_active_club_member(club_id, auth.uid())
  );

DROP POLICY IF EXISTS "daily_health_logs_update_own" ON public.daily_health_logs;
CREATE POLICY "daily_health_logs_update_own"
  ON public.daily_health_logs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    public.is_active_club_member(club_id, auth.uid())
  );

DROP POLICY IF EXISTS "daily_health_logs_delete_own" ON public.daily_health_logs;
CREATE POLICY "daily_health_logs_delete_own"
  ON public.daily_health_logs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 5. Storage Bucket for Health Screenshots (Private bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('health_screenshots', 'health_screenshots', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 5a. Dedicated SECURITY DEFINER helper function for exact object-level screenshot authorization
CREATE OR REPLACE FUNCTION public.can_view_health_screenshot(
  p_object_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_viewer_id UUID := auth.uid();
  v_owner_id UUID;
BEGIN
  IF v_viewer_id IS NULL OR p_object_name IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Extract owner UUID from the path: <owner_id>/<filename>
  BEGIN
    v_owner_id := (storage.foldername(p_object_name))[1]::UUID;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;

  -- 1. Owner can always access their own files
  IF v_owner_id = v_viewer_id THEN
    RETURN TRUE;
  END IF;

  -- 2. Exact match check against explicitly shared record for active club member
  RETURN EXISTS (
    SELECT 1
    FROM public.daily_health_logs dhl
    WHERE dhl.user_id = v_owner_id
      AND dhl.is_screenshot_shared = true
      AND dhl.screenshot_url = p_object_name
      AND public.is_active_club_member(dhl.club_id, v_viewer_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.can_view_health_screenshot(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_view_health_screenshot(TEXT) TO authenticated;

-- Storage RLS Policies
DROP POLICY IF EXISTS "health_screenshots_upload_own" ON storage.objects;
CREATE POLICY "health_screenshots_upload_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'health_screenshots' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "health_screenshots_select_own_or_shared" ON storage.objects;
CREATE POLICY "health_screenshots_select_own_or_shared"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'health_screenshots' AND
    public.can_view_health_screenshot(name)
  );

DROP POLICY IF EXISTS "health_screenshots_delete_own" ON storage.objects;
CREATE POLICY "health_screenshots_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'health_screenshots' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 6. RPC Function: Get Daily Health Summary with 7-Day Trends
CREATE OR REPLACE FUNCTION public.get_daily_health_summary(
  p_club_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_today RECORD;
  v_seven_days_ago DATE := p_date - INTERVAL '6 days';
  v_avg_sleep NUMERIC(5,1);
  v_avg_screentime NUMERIC(5,1);
  v_history JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF NOT public.is_active_club_member(p_club_id, v_user_id) THEN
    RAISE EXCEPTION 'Active club membership required.';
  END IF;

  -- 1. Fetch record for the requested date (strictly for calling user)
  SELECT
    id,
    log_date,
    sleep_minutes,
    sleep_goal_minutes,
    screen_time_minutes,
    screen_time_goal_minutes,
    screenshot_url,
    is_screenshot_shared,
    notes,
    created_at,
    updated_at
  INTO v_today
  FROM public.daily_health_logs
  WHERE user_id = v_user_id AND club_id = p_club_id AND log_date = p_date;

  -- 2. Calculate 7-day averages (strictly for calling user)
  SELECT
    COALESCE(AVG(sleep_minutes) FILTER (WHERE sleep_minutes IS NOT NULL), 0),
    COALESCE(AVG(screen_time_minutes) FILTER (WHERE screen_time_minutes IS NOT NULL), 0)
  INTO v_avg_sleep, v_avg_screentime
  FROM public.daily_health_logs
  WHERE user_id = v_user_id AND club_id = p_club_id AND log_date BETWEEN v_seven_days_ago AND p_date;

  -- 3. Fetch past 14 days history (strictly for calling user)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'log_date', log_date,
        'sleep_minutes', sleep_minutes,
        'sleep_goal_minutes', sleep_goal_minutes,
        'screen_time_minutes', screen_time_minutes,
        'screen_time_goal_minutes', screen_time_goal_minutes,
        'screenshot_url', screenshot_url,
        'is_screenshot_shared', is_screenshot_shared,
        'notes', notes
      ) ORDER BY log_date DESC
    ),
    '[]'::jsonb
  )
  INTO v_history
  FROM public.daily_health_logs
  WHERE user_id = v_user_id AND club_id = p_club_id AND log_date >= (p_date - INTERVAL '13 days');

  RETURN jsonb_build_object(
    'date', p_date,
    'current', CASE
      WHEN v_today.id IS NOT NULL THEN jsonb_build_object(
        'id', v_today.id,
        'log_date', v_today.log_date,
        'sleep_minutes', v_today.sleep_minutes,
        'sleep_goal_minutes', COALESCE(v_today.sleep_goal_minutes, 480),
        'screen_time_minutes', v_today.screen_time_minutes,
        'screen_time_goal_minutes', COALESCE(v_today.screen_time_goal_minutes, 240),
        'screenshot_url', v_today.screenshot_url,
        'is_screenshot_shared', v_today.is_screenshot_shared,
        'notes', v_today.notes
      )
      ELSE NULL
    END,
    'averages_7d', jsonb_build_object(
      'avg_sleep_minutes', ROUND(v_avg_sleep, 0),
      'avg_screen_time_minutes', ROUND(v_avg_screentime, 0)
    ),
    'history', v_history
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_daily_health_summary(UUID, DATE) TO authenticated;
