-- Migration 026: allow the kiosk to supply an initial status when creating a
-- new check-in lead.  Adds a p_status parameter (default 'new') so day/week
-- pass visits can be created as 'closed' right away.
-- Run in: Supabase Dashboard → SQL Editor

CREATE OR REPLACE FUNCTION upsert_checkin_lead(
  p_name         TEXT,
  p_email        TEXT,
  p_phone        TEXT,
  p_zip_code     TEXT,
  p_visit_reason TEXT,
  p_how_heard    TEXT,
  p_interests    TEXT,
  p_signed_at    TIMESTAMPTZ,
  p_status       TEXT DEFAULT 'new'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Match existing check-in lead by phone or email
  SELECT id INTO v_id
  FROM lead_submissions
  WHERE source = 'checkin_app'
    AND (
      (p_phone IS NOT NULL AND p_phone <> '' AND phone = p_phone)
      OR
      (p_email IS NOT NULL AND p_email <> '' AND email = p_email)
    )
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    -- Return visitor: bump count and refresh details (do not override status).
    UPDATE lead_submissions SET
      visit_count = visit_count + 1,
      last_seen   = p_signed_at,
      name        = COALESCE(NULLIF(p_name,  ''), name),
      email       = COALESCE(NULLIF(p_email, ''), email),
      phone       = COALESCE(NULLIF(p_phone, ''), phone),
      details     = jsonb_build_object(
                      'visit_reason', p_visit_reason,
                      'how_heard',    p_how_heard,
                      'interests',    p_interests,
                      'zip_code',     p_zip_code
                    )
    WHERE id = v_id;
  ELSE
    -- First visit: create new lead with the supplied status.
    INSERT INTO lead_submissions
      (source, name, email, phone, details,
       status, visit_count, first_seen, last_seen)
    VALUES (
      'checkin_app',
      p_name,
      NULLIF(p_email, ''),
      NULLIF(p_phone, ''),
      jsonb_build_object(
        'visit_reason', p_visit_reason,
        'how_heard',    p_how_heard,
        'interests',    p_interests,
        'zip_code',     p_zip_code
      ),
      p_status, 1, p_signed_at, p_signed_at
    )
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$;

-- Re-grant execute so the anon role can still call this function.
GRANT EXECUTE ON FUNCTION upsert_checkin_lead(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT) TO anon;
