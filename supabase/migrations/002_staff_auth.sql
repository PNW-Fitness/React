-- ─────────────────────────────────────────────────────────────────────────────
-- 002_staff_auth.sql  —  Admin allowlist + write policies for staff tables
--
-- Paste the entire file into the Supabase SQL editor and run it in one shot.
-- Prerequisite: 001_staff.sql must already have been run.
-- ─────────────────────────────────────────────────────────────────────────────


-- ─── Admin allowlist table ────────────────────────────────────────────────────
-- References Supabase's built-in auth.users table.
-- Not every authenticated user is an admin — only rows in this table are.

CREATE TABLE IF NOT EXISTS staff_admins (
  user_id    UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lock down the allowlist table completely.
-- No policy is created, so all direct SELECT/INSERT/UPDATE/DELETE is denied
-- for both anon and authenticated roles. The only access path is the
-- security-definer function below, which runs as the table owner.
ALTER TABLE staff_admins ENABLE ROW LEVEL SECURITY;


-- ─── Admin check function ────────────────────────────────────────────────────
-- SECURITY DEFINER: executes with table-owner privileges, so the policy can
-- query staff_admins without granting the calling role any direct access to it.
-- STABLE: result may be cached within a single query, improving performance.

CREATE OR REPLACE FUNCTION public.is_staff_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_admins WHERE user_id = auth.uid()
  );
$$;


-- ─── Write policies for staff ─────────────────────────────────────────────────
-- The existing "Public read staff" SELECT policy is NOT touched here.
-- Public reads continue to work exactly as before.

CREATE POLICY "Admins can insert staff"
  ON staff FOR INSERT
  WITH CHECK (public.is_staff_admin());

CREATE POLICY "Admins can update staff"
  ON staff FOR UPDATE
  USING      (public.is_staff_admin())
  WITH CHECK (public.is_staff_admin());

CREATE POLICY "Admins can delete staff"
  ON staff FOR DELETE
  USING (public.is_staff_admin());


-- ─── Write policies for staff_roles ──────────────────────────────────────────
-- Same pattern. Public SELECT on staff_roles is also left untouched.

CREATE POLICY "Admins can insert staff_roles"
  ON staff_roles FOR INSERT
  WITH CHECK (public.is_staff_admin());

CREATE POLICY "Admins can update staff_roles"
  ON staff_roles FOR UPDATE
  USING      (public.is_staff_admin())
  WITH CHECK (public.is_staff_admin());

CREATE POLICY "Admins can delete staff_roles"
  ON staff_roles FOR DELETE
  USING (public.is_staff_admin());
