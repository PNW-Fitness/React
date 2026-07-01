-- Migration 004 granted SELECT, INSERT, DELETE on admin_profiles but omitted
-- UPDATE. The role-change feature added in 014 requires it.
GRANT UPDATE ON public.admin_profiles TO authenticated;
