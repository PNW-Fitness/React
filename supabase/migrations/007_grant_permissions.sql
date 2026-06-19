-- ── Table-level grants ────────────────────────────────────────
-- RLS policies are checked *after* PostgreSQL privilege checks.
-- Tables created via SQL migrations do not automatically inherit
-- the default Supabase grants, so we add them explicitly here.

-- staff_admins: authenticated users need SELECT (for is_staff_admin checks
-- done inside SECURITY DEFINER functions) and the ability to remove members;
-- service_role needs full access for the invite Edge Function.
GRANT SELECT, INSERT, DELETE ON public.staff_admins  TO authenticated;
GRANT ALL                    ON public.staff_admins  TO service_role;

-- admin_profiles: same pattern
GRANT SELECT, INSERT, DELETE ON public.admin_profiles TO authenticated;
GRANT ALL                    ON public.admin_profiles TO service_role;

-- sign_in_log: admins read, trigger (runs as postgres) writes
GRANT SELECT ON public.sign_in_log TO authenticated;
GRANT ALL    ON public.sign_in_log TO service_role;

-- lead_submissions: anon can insert (public forms), authenticated admins can read/update
GRANT INSERT         ON public.lead_submissions TO anon;
GRANT SELECT, UPDATE ON public.lead_submissions TO authenticated;
GRANT ALL            ON public.lead_submissions TO service_role;
