-- One-time cleanup: clears scheduling test data + notifications accumulated
-- while building/testing Phase 3 and the Homebase-parity features.
-- NOT a migration — a one-off script. Run once in the Supabase Dashboard →
-- SQL Editor, then delete this file (or just leave it, it's harmless to
-- re-run — it'll just find nothing left to delete).
--
-- Leaves untouched: Team Board posts, user accounts (test/test2 etc. stay,
-- per your call), Leads/Guest Notes/Vendor Log/Activity Log, Users & Roles,
-- and the schedule_color assignments in admin_profiles.

-- Trade requests (shift_trade_targets cascades automatically)
DELETE FROM public.shift_trade_requests;

-- Shifts — deleted after trades since shift_trade_requests references them.
-- The delete-notification trigger will fire for each assigned shift; those
-- get swept up by the notifications delete below.
DELETE FROM public.staff_shifts;

-- Time off + availability
DELETE FROM public.time_off_requests;
DELETE FROM public.staff_availability;

-- Blackout dates
DELETE FROM public.schedule_blackout_dates;

-- Schedule templates (schedule_template_shifts cascades automatically)
DELETE FROM public.schedule_templates;

-- Notifications — last, so it also catches anything the shift deletes above
-- just triggered.
DELETE FROM public.notifications;
