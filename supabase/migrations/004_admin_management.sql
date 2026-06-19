-- ============================================================
-- 004_admin_management.sql
-- admin_profiles, sign_in_log, staff_admins RLS,
-- sign-in trigger, storage policies
-- ============================================================


-- ── admin_profiles ───────────────────────────────────────────
-- Human-readable info about each admin user.
-- Kept separate from staff_admins so we can display email/name
-- without querying auth.users directly from the client.
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  user_id      UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT        NOT NULL,
  display_name TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Only existing admins can read the admin list
CREATE POLICY "Admins can view admin_profiles"
  ON public.admin_profiles FOR SELECT
  USING (public.is_staff_admin());

-- Only existing admins can add new admin profiles
CREATE POLICY "Admins can insert admin_profiles"
  ON public.admin_profiles FOR INSERT
  WITH CHECK (public.is_staff_admin());

-- Only existing admins can remove admin profiles
CREATE POLICY "Admins can delete admin_profiles"
  ON public.admin_profiles FOR DELETE
  USING (public.is_staff_admin());

-- Grant table-level access to authenticated role;
-- RLS above controls which rows are visible/writeable
GRANT SELECT, INSERT, DELETE ON public.admin_profiles TO authenticated;


-- ── staff_admins: add RLS policies ───────────────────────────
-- Previously this table had NO policies (deny all).
-- Now we allow existing admins to manage the list via the UI.
-- The is_staff_admin() SECURITY DEFINER function still powers
-- the write policies on staff/staff_roles etc.

CREATE POLICY "Admins can view staff_admins"
  ON public.staff_admins FOR SELECT
  USING (public.is_staff_admin());

CREATE POLICY "Admins can grant admin access"
  ON public.staff_admins FOR INSERT
  WITH CHECK (public.is_staff_admin());

-- Admins can revoke other admins. Self-removal is prevented at
-- the UI layer (button is disabled for your own row). Even if
-- someone calls this directly, the CLI can always restore access.
CREATE POLICY "Admins can revoke admin access"
  ON public.staff_admins FOR DELETE
  USING (public.is_staff_admin());

GRANT SELECT, INSERT, DELETE ON public.staff_admins TO authenticated;


-- ── sign_in_log ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sign_in_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  email        TEXT        NOT NULL,
  signed_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sign_in_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read the log; no client INSERT policy —
-- rows are inserted exclusively by the trigger below.
CREATE POLICY "Admins can view sign_in_log"
  ON public.sign_in_log FOR SELECT
  USING (public.is_staff_admin());

GRANT SELECT ON public.sign_in_log TO authenticated;


-- ── Sign-in trigger ───────────────────────────────────────────
-- Supabase updates auth.users.last_sign_in_at on every
-- successful password login, magic-link use, and token refresh
-- that constitutes a new session. We watch for that column
-- changing to record one log row per login event.
--
-- SECURITY DEFINER: the function runs as the table owner so
-- it can INSERT into sign_in_log even though no client INSERT
-- policy exists — the trigger is the only writer.
--
-- IS DISTINCT FROM: handles the NULL→timestamp case (first
-- ever login) AND the old-value→new-value case (subsequent
-- logins), firing on both. It does NOT fire on unrelated
-- auth.users updates (e.g., email changes) where
-- last_sign_in_at stays the same.
CREATE OR REPLACE FUNCTION public.handle_user_sign_in()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at
     AND NEW.last_sign_in_at IS NOT NULL
  THEN
    INSERT INTO public.sign_in_log (user_id, email, signed_in_at)
    VALUES (NEW.id, NEW.email, NEW.last_sign_in_at);
  END IF;
  RETURN NEW;
END;
$$;

-- Drop first so re-running this migration is safe
DROP TRIGGER IF EXISTS on_auth_user_sign_in ON auth.users;

CREATE TRIGGER on_auth_user_sign_in
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_sign_in();


-- ── Storage policies for staff-photos bucket ─────────────────
-- NOTE: The bucket must be created BEFORE running these.
-- Create it via: supabase storage create staff-photos --public
-- Or: Supabase dashboard → Storage → New bucket → "staff-photos"
--     (check "Public bucket")
--
-- Public read: anyone can fetch a photo URL (needed for the
-- public marketing site to display coach photos).
CREATE POLICY "Public can read staff photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'staff-photos');

-- Only admins can upload, replace, or delete photos.
CREATE POLICY "Admins can upload staff photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'staff-photos' AND public.is_staff_admin());

CREATE POLICY "Admins can update staff photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'staff-photos' AND public.is_staff_admin());

CREATE POLICY "Admins can delete staff photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'staff-photos' AND public.is_staff_admin());
