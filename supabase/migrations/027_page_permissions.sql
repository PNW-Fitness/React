-- Migration 027: page-level permissions for the admin panel navigation.
-- Each nav item gets a permission key (pages.*) that can be toggled per RBAC
-- role in the Users & Roles → Roles & Permissions tab.
-- Run in: Supabase Dashboard → SQL Editor

-- ── Add page permission keys ───────────────────────────────────────────────────
INSERT INTO permissions (key, label, group_name) VALUES
  ('pages.staff',        'Staff page',           'Pages'),
  ('pages.pricing',      'Pricing page',         'Pages'),
  ('pages.testimonials', 'Testimonials page',    'Pages'),
  ('pages.faq',          'FAQ page',             'Pages'),
  ('pages.holiday_hours','Holiday Hours page',   'Pages'),
  ('pages.announcements','Announcements page',   'Pages'),
  ('pages.leads',        'Leads page',           'Pages'),
  ('pages.guest_notes',  'Guest Notes page',     'Pages'),
  ('pages.activity_log', 'Activity Log page',    'Pages'),
  ('pages.users_roles',  'Users & Roles page',   'Pages')
ON CONFLICT (key) DO NOTHING;

-- ── Super Admin: all page permissions ─────────────────────────────────────────
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM   roles r, permissions p
WHERE  r.name = 'Super Admin'
  AND  p.group_name = 'Pages'
ON CONFLICT DO NOTHING;

-- ── Manager: all pages except Users & Roles ───────────────────────────────────
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM   roles r
JOIN   permissions p ON p.group_name = 'Pages' AND p.key <> 'pages.users_roles'
WHERE  r.name = 'Manager'
ON CONFLICT DO NOTHING;

-- ── Trainer: Leads page only ──────────────────────────────────────────────────
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM   roles r
JOIN   permissions p ON p.key = 'pages.leads'
WHERE  r.name = 'Trainer'
ON CONFLICT DO NOTHING;

-- ── Front Desk: Guest Notes page only ────────────────────────────────────────
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM   roles r
JOIN   permissions p ON p.key = 'pages.guest_notes'
WHERE  r.name = 'Front Desk'
ON CONFLICT DO NOTHING;
