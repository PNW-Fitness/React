-- Add declined_id and cleared as valid statuses for pending_checkins.
-- These are set when a guest refuses to provide ID at the kiosk:
--   declined_id → staff saved a record (PDF generated with decline notice)
--   cleared      → staff dismissed the entry with no record saved
ALTER TABLE pending_checkins
  DROP CONSTRAINT IF EXISTS pending_checkins_status_check;

ALTER TABLE pending_checkins
  ADD CONSTRAINT pending_checkins_status_check
  CHECK (status IN ('awaiting_id', 'completed', 'declined_id', 'cleared'));
