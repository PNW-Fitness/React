-- Migration 037: Availability rules, time-off request pipeline, and manager
-- blackout dates. Also locks the schedule at the DB level against approved
-- time off, regardless of which UI path assigns the shift (manual edit,
-- Bulk Schedule, claiming an open shift, or a trade being approved).
-- Run in: Supabase Dashboard → SQL Editor

-- ── Availability rules ───────────────────────────────────────────────────────
-- A single flexible table covers both cases from the spec: "recurring"
-- (day_of_week set, optional end_date to stop repeating) and "custom"
-- (an explicit one-off date range, day_of_week null). NULL start_time/
-- end_time means "all day."
CREATE TABLE IF NOT EXISTS public.staff_availability (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind        TEXT        NOT NULL CHECK (kind IN ('recurring', 'custom')),
  day_of_week INT         CHECK (day_of_week BETWEEN 0 AND 6),
  start_date  DATE,
  end_date    DATE,
  start_time  TIME,
  end_time    TIME,
  status      TEXT        NOT NULL DEFAULT 'unavailable' CHECK (status IN ('available', 'unavailable', 'preferred')),
  note        TEXT,
  created_by  UUID        REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_availability_user ON staff_availability(user_id);

-- ── Time-off requests ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.time_off_requests (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date  DATE        NOT NULL,
  end_date    DATE        NOT NULL,
  reason      TEXT        NOT NULL CHECK (reason IN ('sick', 'vacation', 'personal')),
  note        TEXT,
  status      TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  decided_by  UUID        REFERENCES auth.users(id),
  decided_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_time_off_user ON time_off_requests(user_id);

-- ── Blackout dates ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.schedule_blackout_dates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date  DATE        NOT NULL,
  end_date    DATE        NOT NULL,
  reason      TEXT        NOT NULL,
  created_by  UUID        REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

-- ── New permission keys ──────────────────────────────────────────────────────
INSERT INTO permissions (key, label, group_name) VALUES
  ('pages.time_off',   'View time-off & availability page', 'Time Off'),
  ('time_off.request', 'Submit time-off requests',          'Time Off'),
  ('time_off.manage',  'Approve/deny time off, set blackout dates', 'Time Off')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE p.key IN ('pages.time_off', 'time_off.request')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name IN ('Manager', 'Super Admin') AND p.key = 'time_off.manage'
ON CONFLICT DO NOTHING;

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.staff_availability      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_requests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_blackout_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read own or managed availability" ON public.staff_availability;
CREATE POLICY "Read own or managed availability"
  ON public.staff_availability FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR auth_has_permission('time_off.manage'));

DROP POLICY IF EXISTS "Insert own or managed availability" ON public.staff_availability;
CREATE POLICY "Insert own or managed availability"
  ON public.staff_availability FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = auth.uid() AND auth_has_permission('time_off.request'))
    OR auth_has_permission('time_off.manage')
  );

DROP POLICY IF EXISTS "Delete own or managed availability" ON public.staff_availability;
CREATE POLICY "Delete own or managed availability"
  ON public.staff_availability FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR auth_has_permission('time_off.manage'));

DROP POLICY IF EXISTS "Read own or all time off" ON public.time_off_requests;
CREATE POLICY "Read own or all time off"
  ON public.time_off_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR auth_has_permission('time_off.manage'));

DROP POLICY IF EXISTS "Request own time off" ON public.time_off_requests;
CREATE POLICY "Request own time off"
  ON public.time_off_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND auth_has_permission('time_off.request'));

DROP POLICY IF EXISTS "Managers decide time off" ON public.time_off_requests;
CREATE POLICY "Managers decide time off"
  ON public.time_off_requests FOR UPDATE TO authenticated
  USING      (auth_has_permission('time_off.manage'))
  WITH CHECK (auth_has_permission('time_off.manage'));

DROP POLICY IF EXISTS "Anyone with schedule access reads blackout dates" ON public.schedule_blackout_dates;
CREATE POLICY "Anyone with schedule access reads blackout dates"
  ON public.schedule_blackout_dates FOR SELECT TO authenticated
  USING (auth_has_permission('pages.schedule'));

DROP POLICY IF EXISTS "Managers set blackout dates" ON public.schedule_blackout_dates;
CREATE POLICY "Managers set blackout dates"
  ON public.schedule_blackout_dates FOR INSERT TO authenticated
  WITH CHECK (auth_has_permission('time_off.manage'));

DROP POLICY IF EXISTS "Managers remove blackout dates" ON public.schedule_blackout_dates;
CREATE POLICY "Managers remove blackout dates"
  ON public.schedule_blackout_dates FOR DELETE TO authenticated
  USING (auth_has_permission('time_off.manage'));

GRANT SELECT, INSERT, DELETE         ON public.staff_availability      TO authenticated;
GRANT SELECT, INSERT, UPDATE         ON public.time_off_requests       TO authenticated;
GRANT SELECT, INSERT, DELETE         ON public.schedule_blackout_dates TO authenticated;

-- ── Notifications: new request -> managers, decision -> requester ───────────
-- Same pattern as the shift-trade notifications in migration 034. "Notify
-- Erin and myself" is implemented as "notify everyone with time_off.manage"
-- rather than hardcoding specific user IDs — keeps this consistent with the
-- RBAC model the rest of the app uses, and covers it automatically if who
-- holds that permission ever changes.
CREATE OR REPLACE FUNCTION public.notify_time_off_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
BEGIN
  SELECT COALESCE(display_name, email) INTO v_name FROM admin_profiles WHERE user_id = NEW.user_id;

  INSERT INTO notifications (user_id, message, link)
  SELECT DISTINCT ur.user_id,
         COALESCE(v_name, 'A staff member') || ' requested ' || NEW.reason || ' time off ('
           || NEW.start_date || ' to ' || NEW.end_date || ').',
         '/time-off'
  FROM user_roles ur
  JOIN role_permissions rp ON rp.role_id = ur.role_id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE p.key = 'time_off.manage';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_time_off_request ON time_off_requests;
CREATE TRIGGER trg_notify_time_off_request
  AFTER INSERT ON time_off_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_time_off_request();

CREATE OR REPLACE FUNCTION public.notify_time_off_decided()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('approved', 'denied') AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, message, link)
    VALUES (
      NEW.user_id,
      'Your time-off request (' || NEW.start_date || ' to ' || NEW.end_date || ') was ' || NEW.status || '.',
      '/time-off'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_time_off_decided ON time_off_requests;
CREATE TRIGGER trg_notify_time_off_decided
  AFTER UPDATE ON time_off_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_time_off_decided();

-- ── Blackout enforcement on new time-off requests ───────────────────────────
CREATE OR REPLACE FUNCTION public.check_blackout_conflict()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM schedule_blackout_dates b
    WHERE NEW.start_date <= b.end_date AND NEW.end_date >= b.start_date
  ) THEN
    RAISE EXCEPTION 'Time off cannot be requested during a blackout period.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_blackout_conflict ON time_off_requests;
CREATE TRIGGER trg_check_blackout_conflict
  BEFORE INSERT ON time_off_requests
  FOR EACH ROW EXECUTE FUNCTION public.check_blackout_conflict();

-- ── Lock the schedule against approved time off ─────────────────────────────
-- Applies to every write path that sets assigned_to: manual assign/edit,
-- Bulk Schedule, claimShift, and trade approval/reassignment — all of them
-- go through a plain UPDATE/INSERT on staff_shifts, so one trigger here
-- covers all of them instead of re-checking in every UI code path.
CREATE OR REPLACE FUNCTION public.check_time_off_conflict()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL AND EXISTS (
    SELECT 1 FROM time_off_requests t
    WHERE t.user_id = NEW.assigned_to
      AND t.status = 'approved'
      AND NEW.shift_date BETWEEN t.start_date AND t.end_date
  ) THEN
    RAISE EXCEPTION 'This staff member has approved time off on %.', NEW.shift_date;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_time_off_conflict ON staff_shifts;
CREATE TRIGGER trg_check_time_off_conflict
  BEFORE INSERT OR UPDATE ON staff_shifts
  FOR EACH ROW EXECUTE FUNCTION public.check_time_off_conflict();
