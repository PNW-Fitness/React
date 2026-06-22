-- ── Extend source CHECK constraint ───────────────────────────
-- Add 'training_assessment' and 'nasm_partnership' alongside the existing values.
ALTER TABLE public.lead_submissions
  DROP CONSTRAINT IF EXISTS lead_submissions_source_check;

ALTER TABLE public.lead_submissions
  ADD CONSTRAINT lead_submissions_source_check
  CHECK (source IN ('join', 'tour', 'booking', 'training_assessment', 'nasm_partnership'));
