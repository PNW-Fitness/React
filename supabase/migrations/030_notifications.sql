-- Migration 030: in-app notifications (trainer lead-assignment alerts to start)
-- Run in: Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id     UUID        REFERENCES public.lead_submissions(id) ON DELETE CASCADE,
  message     TEXT        NOT NULL,
  is_read     BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Recipients only ever see their own notifications. Any authenticated staff
-- member can create one for someone else (e.g. assigning a lead to a
-- trainer creates a notification for that trainer) — same pattern as
-- public.is_staff_admin() used elsewhere for "any staff member may write".
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own notifications"      ON public.notifications;
DROP POLICY IF EXISTS "Staff can insert notifications for others"   ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications"    ON public.notifications;

CREATE POLICY "Users can read their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Staff can insert notifications for others"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff_admin());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── Realtime ─────────────────────────────────────────────────────────────────
-- So the bell icon can pop in a new notification live, same as the Vendor
-- Log page's postgres_changes subscription on vendor_submissions.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
