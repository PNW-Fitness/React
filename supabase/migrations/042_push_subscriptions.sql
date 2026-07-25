-- Migration 042: push_subscriptions table + centralized push-notification trigger
-- Run via: supabase db push (CLI, linked project)
--
-- Single general mechanism per the Phase 6 Design Addendum Section 5 —
-- ANY insert into public.notifications fires a push, regardless of which
-- feature created it (schedule, trade, time off, team board, ...).

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    TEXT        NOT NULL UNIQUE,
  p256dh      TEXT        NOT NULL,
  auth        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions(user_id);

-- RLS: a device subscription is only ever managed by the user it belongs to.
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users manage their own push subscriptions"
  ON public.push_subscriptions FOR ALL
  TO authenticated
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- The trigger authenticates to send-push with a purpose-built shared
-- secret (Vault key 'push_trigger_secret'), not the full service-role
-- key — narrower blast radius if it ever leaked, since it only grants
-- "call this one Edge Function," not full-database access. The Edge
-- Function checks the same value (as secret PUSH_TRIGGER_SECRET) via
-- the X-Trigger-Secret header before doing anything. Project URL is
-- public, but is also read from Vault ('project_url') so nothing
-- environment-specific is hardcoded in this file.
CREATE OR REPLACE FUNCTION public.trigger_push_on_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_url TEXT;
  v_trigger_secret TEXT;
BEGIN
  SELECT decrypted_secret INTO v_project_url FROM vault.decrypted_secrets WHERE name = 'project_url';
  SELECT decrypted_secret INTO v_trigger_secret FROM vault.decrypted_secrets WHERE name = 'push_trigger_secret';

  IF v_project_url IS NULL OR v_trigger_secret IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := v_project_url || '/functions/v1/send-push',
    body := jsonb_build_object('user_id', NEW.user_id, 'title', 'PNW Fitness', 'body', NEW.message, 'link', NEW.link),
    headers := jsonb_build_object('X-Trigger-Secret', v_trigger_secret, 'Content-Type', 'application/json')
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_push_on_notification ON public.notifications;
CREATE TRIGGER trg_push_on_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.trigger_push_on_notification();
