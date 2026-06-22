-- ── Announcements table ──────────────────────────────────────
CREATE TABLE public.announcements (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  message       TEXT        NOT NULL,
  active        BOOLEAN     NOT NULL DEFAULT true,
  display_order INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Public site (anon) sees only active; admins see everything
CREATE POLICY "Select announcements"
  ON public.announcements FOR SELECT
  USING (active = true OR public.is_staff_admin());

CREATE POLICY "Admins can insert announcements"
  ON public.announcements FOR INSERT
  WITH CHECK (public.is_staff_admin());

CREATE POLICY "Admins can update announcements"
  ON public.announcements FOR UPDATE
  USING (public.is_staff_admin())
  WITH CHECK (public.is_staff_admin());

CREATE POLICY "Admins can delete announcements"
  ON public.announcements FOR DELETE
  USING (public.is_staff_admin());

GRANT SELECT ON public.announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;

-- Seed with the current hardcoded banner text
INSERT INTO public.announcements (message, active, display_order)
VALUES (
  'Summer Special — Short-term day, week & month passes now available in person. Visit us to learn more!',
  true,
  1
);
