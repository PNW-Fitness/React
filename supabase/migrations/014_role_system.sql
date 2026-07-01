-- ── Role column on admin_profiles ────────────────────────────────────────────
-- Existing rows get 'admin' so current users keep full access.
ALTER TABLE admin_profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin';

ALTER TABLE admin_profiles
  ADD CONSTRAINT admin_profiles_role_check
  CHECK (role IN ('admin', 'trainer', 'staff'));

-- Future invites default to the least-privileged role.
ALTER TABLE admin_profiles
  ALTER COLUMN role SET DEFAULT 'staff';

-- ── Helper: is current user an admin? (SECURITY DEFINER bypasses RLS) ────────
CREATE OR REPLACE FUNCTION is_admin_role()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION is_admin_role() TO authenticated;

-- ── get_my_role: returns current user's role ──────────────────────────────────
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM admin_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_my_role() TO authenticated;

-- ── RLS: only admins can change roles ────────────────────────────────────────
-- Uses is_admin_role() (SECURITY DEFINER) to avoid self-referential policy recursion.
DROP POLICY IF EXISTS "Admins can update admin_profiles" ON admin_profiles;
CREATE POLICY "Admins can update admin_profiles"
  ON admin_profiles FOR UPDATE TO authenticated
  USING     (is_admin_role())
  WITH CHECK (is_admin_role());
