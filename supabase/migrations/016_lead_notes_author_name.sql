-- lead_notes.author_id was a hard FK to staff(id), which meant only users
-- with a linked staff record could write notes. No such link exists.
-- Fix: make author_id nullable and add author_name so any admin/trainer user
-- can write notes. Old notes (if any) keep their staff FK; new ones use author_name.

ALTER TABLE lead_notes
  ALTER COLUMN author_id DROP NOT NULL;

ALTER TABLE lead_notes
  ADD COLUMN IF NOT EXISTS author_name TEXT;
