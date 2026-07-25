-- Migration 043: fix missing table-level grants on public.push_subscriptions
-- Run via: supabase db push (CLI, linked project)
--
-- Same class of bug as 031_notifications_grants.sql: RLS policies alone
-- aren't enough, Postgres checks the coarser GRANT privileges first.
-- 042_push_subscriptions.sql enabled RLS and added a policy but never
-- granted the underlying privileges, so both the client upsert-on-subscribe
-- flow (as `authenticated`) and the send-push Edge Function's admin client
-- (as `service_role`) failed with "permission denied for table
-- push_subscriptions" (42501) before RLS was even evaluated.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO service_role;
