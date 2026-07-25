-- Migration 044: admin_profiles.phone_number, shared by pnw-employee-app's
-- and the admin dashboard's Profile pages (Phase 6 Design Addendum Section
-- 4.5 — one column, one migration, built into both apps together).
-- Run via: supabase db push (CLI, linked project)

ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- The existing UPDATE policy (migration 035) only allows users.manage /
-- is_admin_role() to update ANY row — there was never a path for someone
-- to update their OWN row, since nothing before Profile needed that (color
-- picking and role changes were always manager actions on someone else).
-- Profile needs every employee to update their own phone_number (and,
-- incidentally, display_name) on their own admin_profiles row.
DROP POLICY IF EXISTS "Admins can update admin_profiles" ON admin_profiles;
CREATE POLICY "Admins can update admin_profiles"
  ON admin_profiles FOR UPDATE TO authenticated
  USING     (auth_has_permission('users.manage') OR is_admin_role() OR user_id = auth.uid())
  WITH CHECK (auth_has_permission('users.manage') OR is_admin_role() OR user_id = auth.uid());
