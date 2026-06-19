-- Helper function so the Edge Function can look up a user by email
-- when they're already registered (inviteUserByEmail would fail otherwise).
-- SECURITY DEFINER lets it read auth.users without exposing that table.
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE email = p_email LIMIT 1;
$$;

-- Backfill admin_profiles for anyone already in staff_admins
-- (e.g., the first admin seeded manually in Step 6).
INSERT INTO admin_profiles (user_id, email)
SELECT sa.user_id, au.email
FROM staff_admins sa
JOIN auth.users au ON au.id = sa.user_id
ON CONFLICT (user_id) DO NOTHING;
