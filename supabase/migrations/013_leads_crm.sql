-- ── Staff color for note attribution ────────────────────────────────────────
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS color TEXT;

-- ── Lead notes ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_notes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID        NOT NULL REFERENCES lead_submissions(id) ON DELETE CASCADE,
  author_id   UUID        NOT NULL REFERENCES staff(id),
  note_text   TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead ON lead_notes(lead_id);

-- ── Status column (may already exist) ────────────────────────────────────────
ALTER TABLE lead_submissions
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new';

-- Expand valid status values to add 'converted' and 'not_interested'.
-- 'closed' is kept for backward compatibility with existing rows.
DO $$
BEGIN
  ALTER TABLE lead_submissions DROP CONSTRAINT IF EXISTS lead_submissions_status_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE lead_submissions
  ADD CONSTRAINT lead_submissions_status_check
  CHECK (status IN ('new', 'contacted', 'converted', 'not_interested', 'closed'));

-- ── RLS for lead_notes ───────────────────────────────────────────────────────
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated admins can read lead notes"  ON lead_notes;
DROP POLICY IF EXISTS "Authenticated admins can add lead notes"   ON lead_notes;

CREATE POLICY "Authenticated admins can read lead notes"
  ON lead_notes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated admins can add lead notes"
  ON lead_notes FOR INSERT TO authenticated WITH CHECK (true);
