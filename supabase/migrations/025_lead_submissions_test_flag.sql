-- Add an is_test flag to lead_submissions so test entries can be
-- hidden from searches without permanently deleting them.

ALTER TABLE public.lead_submissions
  ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_lead_submissions_is_test
  ON public.lead_submissions (is_test);
