-- Migration 032: guest bans, trial passes, Lead Manager role (Phase 2)
-- Run in: Supabase Dashboard → SQL Editor
--
-- Note on ban scope: this schema stores ban_status per lead_submissions row
-- and guest_bans.lead_id references a single row. Per Xavier's direction,
-- the *application* layer (not this migration) additionally syncs
-- ban_status across every lead_submissions row sharing the same guest's
-- email/phone whenever a ban is approved, denied, applied, or lifted —
-- guest_bans itself still only records the one row the action originated
-- on, as an audit trail entry point.

-- ── Trial pass + ban status on lead_submissions ───────────────────────────────
ALTER TABLE public.lead_submissions
  ADD COLUMN IF NOT EXISTS trial_pass BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_end_date DATE,
  ADD COLUMN IF NOT EXISTS ban_status TEXT NOT NULL DEFAULT 'none'
    CHECK (ban_status IN ('none', 'requested', 'banned'));

-- ── Ban request / decision audit trail ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.guest_bans (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           UUID        NOT NULL REFERENCES lead_submissions(id) ON DELETE CASCADE,
  status            TEXT        NOT NULL CHECK (status IN ('requested', 'approved', 'denied', 'lifted')),
  reason            TEXT        NOT NULL,
  requested_by      UUID        REFERENCES auth.users(id),
  requested_by_name TEXT,
  requested_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_by        UUID        REFERENCES auth.users(id),
  decided_by_name   TEXT,
  decided_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_guest_bans_lead ON guest_bans(lead_id);

-- RLS: any authenticated staff member can read/insert (request/apply/decide);
-- same permissive "authenticated staff" boundary used for lead_notes in
-- migration 013 — the app layer enforces bans.manage for approve/deny/lift.
ALTER TABLE public.guest_bans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated staff can read guest bans"   ON public.guest_bans;
DROP POLICY IF EXISTS "Authenticated staff can insert guest bans" ON public.guest_bans;
DROP POLICY IF EXISTS "Authenticated staff can update guest bans" ON public.guest_bans;

CREATE POLICY "Authenticated staff can read guest bans"
  ON public.guest_bans FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated staff can insert guest bans"
  ON public.guest_bans FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated staff can update guest bans"
  ON public.guest_bans FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Table-level grants — RLS alone isn't enough (see migration 031's lesson).
GRANT SELECT, INSERT, UPDATE ON public.guest_bans TO authenticated;

-- ── New role ───────────────────────────────────────────────────────────────────
INSERT INTO roles (name, description)
VALUES ('Lead Manager', 'Assigns leads to trainers/self; same page access as Trainer')
ON CONFLICT (name) DO NOTHING;

-- ── New permission keys ─────────────────────────────────────────────────────────
INSERT INTO permissions (key, label, group_name) VALUES
  ('leads.assign',            'Assign leads to trainers or self', 'Leads'),
  ('pages.banned_guests',     'View Banned Guests page',          'Pages'),
  ('bans.view',                'View ban details',                 'Bans'),
  ('bans.manage',              'Approve/deny/apply/lift bans',     'Bans'),
  ('leads.trial_pass.manage', 'Edit trial pass + end date',        'Leads')
ON CONFLICT (key) DO NOTHING;

-- pages.banned_guests / bans.view: grant to every existing role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE p.key IN ('pages.banned_guests', 'bans.view')
ON CONFLICT DO NOTHING;

-- bans.manage: Manager + Super Admin only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name IN ('Manager', 'Super Admin') AND p.key = 'bans.manage'
ON CONFLICT DO NOTHING;

-- leads.trial_pass.manage: Front Desk, Manager, Super Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name IN ('Front Desk', 'Manager', 'Super Admin') AND p.key = 'leads.trial_pass.manage'
ON CONFLICT DO NOTHING;

-- leads.assign: Lead Manager, Manager, Super Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name IN ('Lead Manager', 'Manager', 'Super Admin') AND p.key = 'leads.assign'
ON CONFLICT DO NOTHING;

-- Lead Manager gets the same baseline as Trainer
INSERT INTO role_permissions (role_id, permission_id)
SELECT lm.id, p.id FROM roles lm, roles tr, role_permissions rp, permissions p
WHERE lm.name = 'Lead Manager' AND tr.name = 'Trainer'
  AND rp.role_id = tr.id AND p.id = rp.permission_id
ON CONFLICT DO NOTHING;
