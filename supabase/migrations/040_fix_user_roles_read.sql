-- Migration 040: fix a latent RLS gap found while testing the Marketplace.
--
-- loadStaffDirectory() (src/lib/scheduling.ts) joins user_roles to resolve
-- everyone's role name, so trade-matching/role-view features can filter by
-- role. But user_roles SELECT was previously "your own row, or users.manage
-- holders" — a regular staff member calling it could only ever see their
-- OWN role, so every coworker's role_name silently came back null and
-- roleMatchesLabel() never matched anyone. This only surfaced now because
-- earlier trade testing only ever exercised "drop to open" from a
-- non-manager session, never the "offer to specific coworkers" path.
--
-- Role names aren't sensitive here (just "Trainer"/"Front Desk"/"Manager"
-- labels), and pages.schedule is already granted to every role, so this
-- broadens read access to match reality: anyone who can see the schedule
-- can see who holds what role.
-- Run in: Supabase Dashboard → SQL Editor

DROP POLICY IF EXISTS "Users can read their own role or managers read all" ON user_roles;
CREATE POLICY "Users can read their own role or schedule participants read all"
  ON user_roles FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR auth_has_permission('users.manage')
    OR auth_has_permission('pages.schedule')
  );
