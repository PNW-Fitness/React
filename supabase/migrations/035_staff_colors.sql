-- Migration 035: per-staff schedule color, for the Schedule calendar and the
-- printable monthly view (manager wants Homebase-style "assign a color to
-- each person" so shifts are identifiable at a glance).
-- Run in: Supabase Dashboard → SQL Editor

ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS schedule_color TEXT;

-- The existing UPDATE policy on admin_profiles (migration 014) only checks
-- the legacy is_admin_role() (admin_profiles.role = 'admin'), which predates
-- RBAC and doesn't recognize a pure-RBAC Manager/Super Admin who never had
-- the legacy role set. Users & Roles' "Deactivate/Reactivate" button already
-- depends on this same UPDATE policy — broadening it to also accept
-- users.manage is the same fix already applied to user_roles/roles in
-- migration 022, just extended to admin_profiles.
DROP POLICY IF EXISTS "Admins can update admin_profiles" ON admin_profiles;
CREATE POLICY "Admins can update admin_profiles"
  ON admin_profiles FOR UPDATE TO authenticated
  USING     (auth_has_permission('users.manage') OR is_admin_role())
  WITH CHECK (auth_has_permission('users.manage') OR is_admin_role());
