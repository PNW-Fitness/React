-- Migration 033: staff scheduling, shift trades, team announcements (Phase 3)
-- Run in: Supabase Dashboard → SQL Editor
--
-- Note: schedule.view / schedule.manage already exist as permission keys from
-- migration 020 (seeded for a Schedule feature that was never built — Manager
-- and Super Admin already hold schedule.manage from that seed). This migration
-- adds pages.schedule as the actual page-gate instead of reusing schedule.view,
-- since pages.schedule needs to go to every role (including Front Desk) and
-- schedule.view does not. The schedule.manage insert below is a harmless
-- ON CONFLICT no-op against the pre-existing row.

CREATE TABLE IF NOT EXISTS public.staff_shifts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_to UUID        REFERENCES auth.users(id),
  role_label  TEXT        NOT NULL,
  shift_date  DATE        NOT NULL,
  start_time  TIME        NOT NULL,
  end_time    TIME        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'open', 'trade_pending', 'completed', 'no_show')),
  notes       TEXT,
  created_by  UUID        REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_shifts_date     ON staff_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_assignee ON staff_shifts(assigned_to);

CREATE TABLE IF NOT EXISTS public.shift_trade_requests (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id     UUID        NOT NULL REFERENCES staff_shifts(id) ON DELETE CASCADE,
  requested_by UUID        NOT NULL REFERENCES auth.users(id),
  requested_to UUID        REFERENCES auth.users(id),
  reason       TEXT,
  status       TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'denied', 'claimed', 'cancelled')),
  decided_by   UUID        REFERENCES auth.users(id),
  decided_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trade_requests_shift ON shift_trade_requests(shift_id);

CREATE TABLE IF NOT EXISTS public.team_announcements (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  body           TEXT        NOT NULL,
  posted_by      UUID        REFERENCES auth.users(id),
  posted_by_name TEXT,
  pinned         BOOLEAN     NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── New permission keys ─────────────────────────────────────────────────────────
INSERT INTO permissions (key, label, group_name) VALUES
  ('pages.schedule',      'View Schedule page',               'Schedule'),
  ('schedule.manage',     'Create/edit/delete/assign shifts', 'Schedule'),
  ('shift_trade.request', 'Request a trade on own shift',     'Schedule'),
  ('shift_trade.manage',  'Approve/deny trade requests',      'Schedule'),
  ('pages.team_board',    'View team announcements',          'Team Board'),
  ('team_board.post',     'Post a new announcement',          'Team Board')
ON CONFLICT (key) DO NOTHING;

-- pages.schedule, shift_trade.request, pages.team_board: every role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE p.key IN ('pages.schedule', 'shift_trade.request', 'pages.team_board')
ON CONFLICT DO NOTHING;

-- schedule.manage, shift_trade.manage, team_board.post: Manager + Super Admin only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name IN ('Manager', 'Super Admin')
  AND p.key IN ('schedule.manage', 'shift_trade.manage', 'team_board.post')
ON CONFLICT DO NOTHING;

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Uses auth_has_permission() (from migration 019) for precise, permission-key-
-- driven policies, rather than the broader "any authenticated staff" pattern
-- used for lead_notes/guest_bans.
ALTER TABLE public.staff_shifts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_trade_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_announcements  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Schedule viewers can read shifts"        ON public.staff_shifts;
DROP POLICY IF EXISTS "Schedule managers can insert shifts"     ON public.staff_shifts;
DROP POLICY IF EXISTS "Schedule managers or requesters can update shifts" ON public.staff_shifts;
DROP POLICY IF EXISTS "Schedule managers can delete shifts"     ON public.staff_shifts;

CREATE POLICY "Schedule viewers can read shifts"
  ON public.staff_shifts FOR SELECT TO authenticated
  USING (auth_has_permission('pages.schedule'));

CREATE POLICY "Schedule managers can insert shifts"
  ON public.staff_shifts FOR INSERT TO authenticated
  WITH CHECK (auth_has_permission('schedule.manage'));

-- Covers both manager edits/reassignment AND a staff member's own actions
-- (dropping their shift to trade_pending, claiming an open shift) — the app
-- only ever sends the specific narrow update for each of those, RLS just
-- keeps this to legitimate schedule participants.
CREATE POLICY "Schedule managers or requesters can update shifts"
  ON public.staff_shifts FOR UPDATE TO authenticated
  USING      (auth_has_permission('schedule.manage') OR auth_has_permission('shift_trade.request'))
  WITH CHECK (auth_has_permission('schedule.manage') OR auth_has_permission('shift_trade.request'));

CREATE POLICY "Schedule managers can delete shifts"
  ON public.staff_shifts FOR DELETE TO authenticated
  USING (auth_has_permission('schedule.manage'));

DROP POLICY IF EXISTS "Schedule viewers can read trade requests" ON public.shift_trade_requests;
DROP POLICY IF EXISTS "Requesters can insert trade requests"     ON public.shift_trade_requests;
DROP POLICY IF EXISTS "Trade managers can update trade requests" ON public.shift_trade_requests;

CREATE POLICY "Schedule viewers can read trade requests"
  ON public.shift_trade_requests FOR SELECT TO authenticated
  USING (auth_has_permission('pages.schedule'));

CREATE POLICY "Requesters can insert trade requests"
  ON public.shift_trade_requests FOR INSERT TO authenticated
  WITH CHECK (auth_has_permission('shift_trade.request') AND requested_by = auth.uid());

CREATE POLICY "Trade managers can update trade requests"
  ON public.shift_trade_requests FOR UPDATE TO authenticated
  USING      (auth_has_permission('shift_trade.manage'))
  WITH CHECK (auth_has_permission('shift_trade.manage'));

DROP POLICY IF EXISTS "Team board viewers can read announcements" ON public.team_announcements;
DROP POLICY IF EXISTS "Team board posters can insert announcements" ON public.team_announcements;
DROP POLICY IF EXISTS "Team board posters can update announcements" ON public.team_announcements;

CREATE POLICY "Team board viewers can read announcements"
  ON public.team_announcements FOR SELECT TO authenticated
  USING (auth_has_permission('pages.team_board'));

CREATE POLICY "Team board posters can insert announcements"
  ON public.team_announcements FOR INSERT TO authenticated
  WITH CHECK (auth_has_permission('team_board.post'));

CREATE POLICY "Team board posters can update announcements"
  ON public.team_announcements FOR UPDATE TO authenticated
  USING      (auth_has_permission('team_board.post'))
  WITH CHECK (auth_has_permission('team_board.post'));

-- Table-level grants — RLS alone isn't enough (lesson from migration 031).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_shifts        TO authenticated;
GRANT SELECT, INSERT, UPDATE         ON public.shift_trade_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE         ON public.team_announcements  TO authenticated;
