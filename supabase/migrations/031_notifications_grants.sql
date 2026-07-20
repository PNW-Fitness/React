-- Migration 031: fix missing table-level grants on public.notifications
-- Run in: Supabase Dashboard → SQL Editor
--
-- RLS policies alone aren't enough — Postgres checks the coarser GRANT
-- privileges first. 030_notifications.sql enabled RLS and added policies
-- but never granted the underlying SELECT/INSERT/UPDATE to `authenticated`,
-- so every request failed with "permission denied for table notifications"
-- (42501) before RLS was even evaluated.

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
