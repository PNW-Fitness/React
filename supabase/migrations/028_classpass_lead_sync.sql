-- Migration 028: push ClassPass kiosk check-ins to lead_submissions.
-- Adds 'classpass' to the source CHECK constraint and creates the upsert RPC.
-- Run in: Supabase Dashboard → SQL Editor

-- ── Extend source constraint ──────────────────────────────────────────────────
ALTER TABLE public.lead_submissions
  DROP CONSTRAINT IF EXISTS lead_submissions_source_check;

ALTER TABLE public.lead_submissions
  ADD CONSTRAINT lead_submissions_source_check
  CHECK (source IN (
    'join', 'tour', 'booking', 'training_assessment',
    'nasm_partnership', 'checkin_app', 'classpass'
  ));

-- ── Upsert function ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION upsert_classpass_lead(
  p_name       TEXT,
  p_email      TEXT,
  p_phone      TEXT,
  p_zip_code   TEXT,
  p_signed_at  TIMESTAMPTZ
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Match an existing ClassPass lead by phone or email.
  SELECT id INTO v_id
  FROM lead_submissions
  WHERE source = 'classpass'
    AND (
      (p_phone IS NOT NULL AND p_phone <> '' AND phone = p_phone)
      OR
      (p_email IS NOT NULL AND p_email <> '' AND email = p_email)
    )
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    -- Return visitor: bump visit count and refresh last_seen.
    UPDATE lead_submissions SET
      visit_count = visit_count + 1,
      last_seen   = p_signed_at,
      name        = COALESCE(NULLIF(p_name, ''), name)
    WHERE id = v_id;
  ELSE
    -- New ClassPass guest.
    INSERT INTO lead_submissions
      (source, name, email, phone, details, status, visit_count, first_seen, last_seen)
    VALUES (
      'classpass',
      p_name,
      NULLIF(p_email, ''),
      NULLIF(p_phone, ''),
      jsonb_build_object('visit_reason', 'ClassPass', 'zip_code', p_zip_code),
      'new',
      1,
      p_signed_at,
      p_signed_at
    )
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_classpass_lead(TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ) TO anon;
