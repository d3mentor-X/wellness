-- ============================================================================
-- Fitness Application - Membership Enhancements & Trigger Update
-- ============================================================================
-- Migration: 20260823000003_membership_enhancements.sql
-- Description:
-- 1. Adds 'pending' and 'suspended' statuses to member_status enum.
-- 2. Enhances handle_new_user() trigger to populate all profile metadata on signup.
-- 3. Seeds the default Fitness Club row if not already present.
-- ============================================================================

-- 1. Extend member_status enum with pending and suspended states
DO $$ BEGIN
  ALTER TYPE public.member_status ADD VALUE IF NOT EXISTS 'pending';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE public.member_status ADD VALUE IF NOT EXISTS 'suspended';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Enhanced User Profile Creation Trigger
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

-- Ensure trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Seed Default Primary Fitness Club (if none exists)
INSERT INTO public.clubs (id, name, description)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Fitness Club',
  'Private Fitness Community'
)
ON CONFLICT (id) DO NOTHING;

