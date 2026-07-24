-- Migration 034: schedule-related notifications — trade requests/decisions,
-- and pinging role-matched staff when a shift becomes open (either a single
-- shift, or a whole batch from Bulk Schedule).
-- Run in: Supabase Dashboard → SQL Editor

-- Generalize notifications beyond leads: a nullable link lets the bell
-- navigate anywhere (e.g. /schedule) instead of only /leads?lead=<id>.
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT;

-- Trigger functions run SECURITY DEFINER so they can read user_roles /
-- role_permissions to find managers regardless of the calling user's own
-- RLS visibility (a Trainer requesting a trade can't read who the
-- managers are — auth_has_permission() from migration 019 uses the same
-- bypass pattern for the same reason).

CREATE OR REPLACE FUNCTION public.notify_trade_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shift RECORD;
  v_requester_name TEXT;
BEGIN
  SELECT * INTO v_shift FROM staff_shifts WHERE id = NEW.shift_id;

  SELECT COALESCE(display_name, email) INTO v_requester_name
  FROM admin_profiles WHERE user_id = NEW.requested_by;

  INSERT INTO notifications (user_id, message, link)
  SELECT DISTINCT ur.user_id,
         COALESCE(v_requester_name, 'A staff member') || ' requested a trade on '
           || v_shift.role_label || ' — ' || v_shift.shift_date,
         '/schedule'
  FROM user_roles ur
  JOIN role_permissions rp ON rp.role_id = ur.role_id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE p.key = 'shift_trade.manage';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_trade_request ON shift_trade_requests;
CREATE TRIGGER trg_notify_trade_request
  AFTER INSERT ON shift_trade_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_trade_request();

CREATE OR REPLACE FUNCTION public.notify_trade_decided()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shift RECORD;
BEGIN
  IF NEW.status IN ('approved', 'denied') AND OLD.status = 'pending' THEN
    SELECT * INTO v_shift FROM staff_shifts WHERE id = NEW.shift_id;

    INSERT INTO notifications (user_id, message, link)
    VALUES (
      NEW.requested_by,
      'Your trade request for ' || v_shift.role_label || ' — ' || v_shift.shift_date || ' was ' || NEW.status || '.',
      '/schedule'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_trade_decided ON shift_trade_requests;
CREATE TRIGGER trg_notify_trade_decided
  AFTER UPDATE ON shift_trade_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_trade_decided();

-- ── Open-shift alerts ────────────────────────────────────────────────────────
-- role_label -> role_name matching mirrors roleMatchesLabel() in
-- src/lib/scheduling.ts: "Manager-on-duty" matches Manager or Super Admin,
-- everything else matches its role name exactly.

-- Bulk Schedule inserts many rows in one INSERT (often several "open" rows
-- per role). A per-row trigger would fire once per row and flood every
-- Front Desk person with a dozen pings for one action, so this is a
-- statement-level trigger with a transition table: it sees the whole
-- INSERT's rows at once and sends ONE notification per matching role,
-- covering anywhere from 1 to N newly-open shifts.
CREATE OR REPLACE FUNCTION public.notify_open_shifts_inserted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT role_label, COUNT(*) AS cnt, MIN(shift_date) AS first_date, MAX(shift_date) AS last_date
    FROM new_shifts
    WHERE status = 'open'
    GROUP BY role_label
  LOOP
    INSERT INTO notifications (user_id, message, link)
    SELECT DISTINCT ur.user_id,
      CASE WHEN rec.cnt = 1
        THEN 'A new ' || rec.role_label || ' shift is open on ' || rec.first_date || '.'
        ELSE rec.cnt || ' new ' || rec.role_label || ' shifts are open (' || rec.first_date || ' to ' || rec.last_date || ').'
      END,
      '/schedule'
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE (rec.role_label = 'Manager-on-duty' AND r.name IN ('Manager', 'Super Admin'))
       OR (rec.role_label <> 'Manager-on-duty' AND r.name = rec.role_label);
  END LOOP;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_open_shifts_inserted ON staff_shifts;
CREATE TRIGGER trg_notify_open_shifts_inserted
  AFTER INSERT ON staff_shifts
  REFERENCING NEW TABLE AS new_shifts
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.notify_open_shifts_inserted();

-- Single-shift case: a shift that was assigned becomes open (a manager
-- unassigns it, or a trade is approved as "drop to open"). These happen
-- one at a time by nature, so a per-row trigger is fine here.
CREATE OR REPLACE FUNCTION public.notify_shift_opened()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'open' AND OLD.status <> 'open' THEN
    INSERT INTO notifications (user_id, message, link)
    SELECT DISTINCT ur.user_id,
      'A ' || NEW.role_label || ' shift just opened up on ' || NEW.shift_date
        || ' (' || NEW.start_time || '-' || NEW.end_time || ').',
      '/schedule'
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE (NEW.role_label = 'Manager-on-duty' AND r.name IN ('Manager', 'Super Admin'))
       OR (NEW.role_label <> 'Manager-on-duty' AND r.name = NEW.role_label);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_shift_opened ON staff_shifts;
CREATE TRIGGER trg_notify_shift_opened
  AFTER UPDATE ON staff_shifts
  FOR EACH ROW EXECUTE FUNCTION public.notify_shift_opened();
