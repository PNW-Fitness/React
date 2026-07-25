-- Migration 041: page permission for the new staff home dashboard
-- (/my-dashboard) — next shift, today's notes, quick actions.
-- Run in: Supabase Dashboard → SQL Editor

INSERT INTO permissions (key, label, group_name) VALUES
  ('pages.dashboard', 'View My Dashboard (home screen)', 'Dashboard')
ON CONFLICT (key) DO NOTHING;

-- Every role — this is meant to be everyone's landing screen, not a
-- manager-gated feature.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE p.key = 'pages.dashboard'
ON CONFLICT DO NOTHING;
