-- Migration 038: schedule templates — save a week's shifts (day-of-week +
-- role + time + who's assigned) as a reusable named preset, then apply it
-- to any future week to instantly populate it as drafts.
-- Run in: Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.schedule_templates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  created_by  UUID        REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.schedule_template_shifts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES schedule_templates(id) ON DELETE CASCADE,
  day_of_week INT  NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  role_label  TEXT NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  assigned_to UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_template_shifts_template ON schedule_template_shifts(template_id);

ALTER TABLE public.schedule_templates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_template_shifts ENABLE ROW LEVEL SECURITY;

-- Reuses schedule.manage (from migration 033) rather than a new permission
-- key — managing templates is squarely a scheduling-manager action already
-- covered by that key.
DROP POLICY IF EXISTS "Schedule managers read templates"   ON public.schedule_templates;
DROP POLICY IF EXISTS "Schedule managers insert templates" ON public.schedule_templates;
DROP POLICY IF EXISTS "Schedule managers delete templates" ON public.schedule_templates;

CREATE POLICY "Schedule managers read templates"
  ON public.schedule_templates FOR SELECT TO authenticated
  USING (auth_has_permission('schedule.manage'));

CREATE POLICY "Schedule managers insert templates"
  ON public.schedule_templates FOR INSERT TO authenticated
  WITH CHECK (auth_has_permission('schedule.manage'));

CREATE POLICY "Schedule managers delete templates"
  ON public.schedule_templates FOR DELETE TO authenticated
  USING (auth_has_permission('schedule.manage'));

DROP POLICY IF EXISTS "Schedule managers read template shifts"   ON public.schedule_template_shifts;
DROP POLICY IF EXISTS "Schedule managers insert template shifts" ON public.schedule_template_shifts;
DROP POLICY IF EXISTS "Schedule managers delete template shifts" ON public.schedule_template_shifts;

CREATE POLICY "Schedule managers read template shifts"
  ON public.schedule_template_shifts FOR SELECT TO authenticated
  USING (auth_has_permission('schedule.manage'));

CREATE POLICY "Schedule managers insert template shifts"
  ON public.schedule_template_shifts FOR INSERT TO authenticated
  WITH CHECK (auth_has_permission('schedule.manage'));

CREATE POLICY "Schedule managers delete template shifts"
  ON public.schedule_template_shifts FOR DELETE TO authenticated
  USING (auth_has_permission('schedule.manage'));

GRANT SELECT, INSERT, DELETE ON public.schedule_templates       TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.schedule_template_shifts TO authenticated;
