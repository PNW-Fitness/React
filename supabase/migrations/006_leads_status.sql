-- ── Create lead_submissions table ────────────────────────────
CREATE TABLE IF NOT EXISTS public.lead_submissions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source     TEXT        NOT NULL CHECK (source IN ('join', 'tour', 'booking')),
  name       TEXT,
  email      TEXT,
  phone      TEXT,
  details    JSONB,
  status     TEXT        NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lead_submissions ENABLE ROW LEVEL SECURITY;

-- Public site can submit leads (INSERT only, no SELECT)
CREATE POLICY "Public can insert lead_submissions"
  ON public.lead_submissions FOR INSERT
  WITH CHECK (true);

-- Admins can read all leads
CREATE POLICY "Admins can select lead_submissions"
  ON public.lead_submissions FOR SELECT
  USING (public.is_staff_admin());

-- Admins can update status
CREATE POLICY "Admins can update lead_submissions"
  ON public.lead_submissions FOR UPDATE
  USING (public.is_staff_admin())
  WITH CHECK (public.is_staff_admin());
