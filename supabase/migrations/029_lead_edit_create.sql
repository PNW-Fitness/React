-- Migration 029: allow super admins to fully edit leads and create them manually.
-- Run in: Supabase Dashboard → SQL Editor

-- ── New permissions ───────────────────────────────────────────────────────────
INSERT INTO permissions (key, label, group_name) VALUES
  ('leads.edit_details', 'Edit Lead Details',  'Leads'),
  ('leads.create',       'Create Lead Manually','Leads')
ON CONFLICT (key) DO NOTHING;

-- Super Admin gets both
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM   roles r, permissions p
WHERE  r.name = 'Super Admin'
  AND  p.key IN ('leads.edit_details', 'leads.create')
ON CONFLICT DO NOTHING;

-- ── Allow authenticated admins to INSERT lead_submissions directly ────────────
GRANT INSERT ON public.lead_submissions TO authenticated;

DROP POLICY IF EXISTS "Admins can insert lead_submissions" ON public.lead_submissions;
CREATE POLICY "Admins can insert lead_submissions"
  ON public.lead_submissions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff_admin());
