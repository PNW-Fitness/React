-- Migration 039: true swap-for-swap trades + multi-recipient offers.
--
-- Redesigns the trade lifecycle to match the spec precisely: Employee A
-- offers up a shift, targeting zero or more specific coworkers (zero =
-- drop straight to the manager's approval queue, matching "post it for
-- anyone to grab"). Any ONE targeted coworker can then accept — either a
-- plain take-over, or countering with one of their OWN shifts to make it a
-- real two-way swap (that choice is the accepter's, made when they accept,
-- not the requester's). Either way the shift doesn't move until a manager
-- approves the accepted trade.
-- Run in: Supabase Dashboard → SQL Editor

ALTER TABLE public.shift_trade_requests ADD COLUMN IF NOT EXISTS accepted_by UUID REFERENCES auth.users(id);
ALTER TABLE public.shift_trade_requests ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
-- The shift the accepter is offering back in exchange, if they chose to
-- counter rather than just take it over outright.
ALTER TABLE public.shift_trade_requests ADD COLUMN IF NOT EXISTS offered_shift_id UUID REFERENCES staff_shifts(id);

ALTER TABLE public.shift_trade_requests DROP CONSTRAINT IF EXISTS shift_trade_requests_status_check;
ALTER TABLE public.shift_trade_requests ADD CONSTRAINT shift_trade_requests_status_check
  CHECK (status IN ('pending', 'accepted', 'approved', 'denied', 'claimed', 'cancelled'));

-- Multi-recipient targets, replacing the old single requested_to column.
CREATE TABLE IF NOT EXISTS public.shift_trade_targets (
  trade_id UUID NOT NULL REFERENCES shift_trade_requests(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (trade_id, user_id)
);

-- Carry forward any existing single-target rows before dropping the column.
INSERT INTO public.shift_trade_targets (trade_id, user_id)
SELECT id, requested_to FROM public.shift_trade_requests WHERE requested_to IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE public.shift_trade_requests DROP COLUMN IF EXISTS requested_to;

ALTER TABLE public.shift_trade_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Schedule viewers can read trade targets" ON public.shift_trade_targets;
CREATE POLICY "Schedule viewers can read trade targets"
  ON public.shift_trade_targets FOR SELECT TO authenticated
  USING (auth_has_permission('pages.schedule'));

DROP POLICY IF EXISTS "Requesters can insert trade targets" ON public.shift_trade_targets;
CREATE POLICY "Requesters can insert trade targets"
  ON public.shift_trade_targets FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM shift_trade_requests t WHERE t.id = trade_id AND t.requested_by = auth.uid())
  );

GRANT SELECT, INSERT ON public.shift_trade_targets TO authenticated;

-- A targeted coworker needs to be able to accept (set accepted_by/status)
-- even though they're not the requester and aren't shift_trade.manage.
-- Same "RLS as a broad boundary, precise business rules enforced by the
-- narrow application-layer write" pattern used by claimShift/approveTrade —
-- the acceptTrade() function only ever sets accepted_by/offered_shift_id/
-- status on its own row, it doesn't expose arbitrary field writes.
DROP POLICY IF EXISTS "Targeted users can accept trades" ON public.shift_trade_requests;
CREATE POLICY "Targeted users can accept trades"
  ON public.shift_trade_requests FOR UPDATE TO authenticated
  USING (
    auth_has_permission('shift_trade.manage')
    OR EXISTS (SELECT 1 FROM shift_trade_targets tt WHERE tt.trade_id = id AND tt.user_id = auth.uid())
  )
  WITH CHECK (
    auth_has_permission('shift_trade.manage')
    OR EXISTS (SELECT 1 FROM shift_trade_targets tt WHERE tt.trade_id = id AND tt.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Trade managers can update trade requests" ON public.shift_trade_requests;
