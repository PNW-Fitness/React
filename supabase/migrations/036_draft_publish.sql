-- Migration 036: Draft vs Published shift states, plus in-app notifications
-- for edited/canceled shifts. SMS/push (Twilio/Firebase) is deliberately
-- deferred per the manager's own call — everything here is in-app only,
-- same bell/notifications table used since migration 030.
-- Run in: Supabase Dashboard → SQL Editor

ALTER TABLE public.staff_shifts ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT false;

-- Backfill: shifts that already existed before this migration were already
-- effectively "live" (staff could already see them) — treat them as
-- published so nothing already relied upon disappears. Only shifts created
-- from here on start as drafts.
UPDATE public.staff_shifts SET published = true WHERE published = false;

-- Non-managers can now only see published shifts; managers (schedule.manage)
-- still see everything, drafts included, so they can build a schedule out
-- before publishing it.
DROP POLICY IF EXISTS "Schedule viewers can read shifts" ON public.staff_shifts;
CREATE POLICY "Schedule viewers can read shifts"
  ON public.staff_shifts FOR SELECT TO authenticated
  USING (
    auth_has_permission('schedule.manage')
    OR (auth_has_permission('pages.schedule') AND published = true)
  );

-- ── Edited / canceled notifications ─────────────────────────────────────────
-- Published-shifts only — tweaking a draft hasn't been seen by anyone yet,
-- so there's nothing to notify. SECURITY DEFINER isn't strictly required
-- here (recipients are already known, no cross-user lookup like the trade
-- triggers needed) but kept consistent with the other schedule triggers.

CREATE OR REPLACE FUNCTION public.notify_shift_edited()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.published = true AND NEW.published = true AND (
    OLD.shift_date   IS DISTINCT FROM NEW.shift_date OR
    OLD.start_time   IS DISTINCT FROM NEW.start_time OR
    OLD.end_time     IS DISTINCT FROM NEW.end_time OR
    OLD.role_label   IS DISTINCT FROM NEW.role_label OR
    OLD.assigned_to  IS DISTINCT FROM NEW.assigned_to
  ) THEN
    IF OLD.assigned_to IS NOT NULL AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      INSERT INTO notifications (user_id, message, link)
      VALUES (OLD.assigned_to, 'Your shift on ' || OLD.shift_date || ' was reassigned or removed.', '/schedule');
    END IF;
    IF NEW.assigned_to IS NOT NULL THEN
      INSERT INTO notifications (user_id, message, link)
      VALUES (
        NEW.assigned_to,
        'Your shift on ' || NEW.shift_date || ' (' || NEW.role_label || ', ' || NEW.start_time || '-' || NEW.end_time || ') was updated.',
        '/schedule'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_shift_edited ON staff_shifts;
CREATE TRIGGER trg_notify_shift_edited
  AFTER UPDATE ON staff_shifts
  FOR EACH ROW EXECUTE FUNCTION public.notify_shift_edited();

CREATE OR REPLACE FUNCTION public.notify_shift_canceled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.published = true AND OLD.assigned_to IS NOT NULL THEN
    INSERT INTO notifications (user_id, message, link)
    VALUES (OLD.assigned_to, 'Your shift on ' || OLD.shift_date || ' (' || OLD.role_label || ') was canceled.', '/schedule');
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_shift_canceled ON staff_shifts;
CREATE TRIGGER trg_notify_shift_canceled
  AFTER DELETE ON staff_shifts
  FOR EACH ROW EXECUTE FUNCTION public.notify_shift_canceled();
