-- Migration 045: 'closed' shift status
-- A manager can close an open, unassigned shift that turns out not to be
-- needed (e.g. no Manager-on-duty required that day) without deleting it
-- outright. Closed shifts stay visible on the admin calendar/grid (so
-- there's a record, and it can be reopened later) but are never shown to
-- employees as an open/claimable shift on Schedule or Marketplace — both
-- already filter on status = 'open' specifically, so a closed shift is
-- automatically excluded there with no further changes needed.
-- Run via: supabase db push (CLI, linked project)

ALTER TABLE public.staff_shifts DROP CONSTRAINT IF EXISTS staff_shifts_status_check;
ALTER TABLE public.staff_shifts ADD CONSTRAINT staff_shifts_status_check
  CHECK (status IN ('scheduled', 'open', 'trade_pending', 'completed', 'no_show', 'closed'));
