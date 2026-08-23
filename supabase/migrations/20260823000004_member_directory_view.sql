-- ============================================================================
-- Fitness Application - Member Directory View & Secure RPC Migration
-- ============================================================================
-- Migration: 20260823000004_member_directory_view.sql
-- Description:
-- 1. Creates public.club_member_directory view.
-- 2. Creates public.get_club_members() RPC function for authenticated club members.
-- 3. Strictly exposes only public fields (full_name, avatar_url, whatsapp_number, gender, role, status, joined_at).
-- 4. Strictly protects and omits private biometric fields (age, height, weight).
-- 5. Prevents cross-club access or access by pending/suspended members.
-- ============================================================================

-- 1. Member Directory View
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

-- 2. Secure Security Definer RPC for fetching club members
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
  -- Strict multi-tenant authorization check
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

