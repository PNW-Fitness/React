-- ─────────────────────────────────────────────────────────────────────────────
-- 011_checkin_web.sql — Rotating QR self check-in: sessions, pending
-- check-ins, and vendor submissions
--
-- Paste the entire contents of this file into the Supabase SQL editor and run
-- it in one shot. Safe to re-run: tables/indexes use IF NOT EXISTS, policies
-- are dropped before being recreated, and the realtime publication add is
-- guarded against duplicates.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.checkin_sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT        NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL,
  active      BOOLEAN     NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.pending_checkins (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_type         TEXT        NOT NULL CHECK (flow_type IN ('guest', 'classpass')),
  session_token     TEXT        NOT NULL REFERENCES public.checkin_sessions(token),
  form_data         JSONB       NOT NULL,
  waiver_agreed_at  TIMESTAMPTZ NOT NULL,
  signature_data    TEXT        NOT NULL, -- base64 signature image
  status            TEXT        NOT NULL DEFAULT 'awaiting_id' CHECK (status IN ('awaiting_id', 'completed')),
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.vendor_submissions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token  TEXT        NOT NULL REFERENCES public.checkin_sessions(token),
  name           TEXT        NOT NULL,
  company        TEXT        NOT NULL,
  reason         TEXT        NOT NULL,
  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
-- Token validation runs on every phone landing on /checkin?token=..., and the
-- tablet's rotation loop looks up "the currently active token" every 45s.
-- The queue view filters pending_checkins by status.

CREATE INDEX IF NOT EXISTS idx_checkin_sessions_token_active
  ON public.checkin_sessions (token, active);

CREATE INDEX IF NOT EXISTS idx_pending_checkins_status
  ON public.pending_checkins (status);

-- ─── Row Level Security ─────────────────────────────────────────────────────
-- Neither the tablet app nor the public web form authenticate users — both
-- talk to Supabase with an anon key (same trust boundary already used
-- elsewhere in this project, e.g. lead_submissions). The rotating,
-- short-lived, physically-displayed token is the actual access control here,
-- not RLS, so these policies are intentionally permissive for anon.

ALTER TABLE public.checkin_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_checkins   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon select checkin_sessions" ON public.checkin_sessions;
DROP POLICY IF EXISTS "anon insert checkin_sessions" ON public.checkin_sessions;
DROP POLICY IF EXISTS "anon update checkin_sessions" ON public.checkin_sessions;

-- Tablet creates/rotates tokens (insert + deactivate-previous); phone
-- browsers read the token from the URL and validate it against this table.
CREATE POLICY "anon select checkin_sessions"
  ON public.checkin_sessions FOR SELECT USING (true);
CREATE POLICY "anon insert checkin_sessions"
  ON public.checkin_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "anon update checkin_sessions"
  ON public.checkin_sessions FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon select pending_checkins" ON public.pending_checkins;
DROP POLICY IF EXISTS "anon insert pending_checkins" ON public.pending_checkins;
DROP POLICY IF EXISTS "anon update pending_checkins" ON public.pending_checkins;

-- Phone browsers submit guest/ClassPass check-ins; tablet reads the live
-- queue and marks entries completed after ID verification.
CREATE POLICY "anon select pending_checkins"
  ON public.pending_checkins FOR SELECT USING (true);
CREATE POLICY "anon insert pending_checkins"
  ON public.pending_checkins FOR INSERT WITH CHECK (true);
CREATE POLICY "anon update pending_checkins"
  ON public.pending_checkins FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon select vendor_submissions" ON public.vendor_submissions;
DROP POLICY IF EXISTS "anon insert vendor_submissions" ON public.vendor_submissions;

-- Phone browsers submit vendor sign-ins (self-contained, no staff action);
-- tablet reads today's vendor log.
CREATE POLICY "anon select vendor_submissions"
  ON public.vendor_submissions FOR SELECT USING (true);
CREATE POLICY "anon insert vendor_submissions"
  ON public.vendor_submissions FOR INSERT WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.checkin_sessions   TO anon;
GRANT SELECT, INSERT, UPDATE ON public.pending_checkins   TO anon;
GRANT SELECT, INSERT         ON public.vendor_submissions TO anon;

GRANT ALL ON public.checkin_sessions   TO service_role;
GRANT ALL ON public.pending_checkins   TO service_role;
GRANT ALL ON public.vendor_submissions TO service_role;

-- ─── Realtime ────────────────────────────────────────────────────────────────
-- Phase 4's tablet queue subscribes to Postgres Changes on these two tables
-- instead of polling. Adding them to the replicated set now avoids a second
-- migration later.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pending_checkins'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_checkins;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'vendor_submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_submissions;
  END IF;
END $$;
