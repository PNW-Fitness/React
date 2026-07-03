-- ── Permissions ───────────────────────────────────────────────────────────────
INSERT INTO permissions (key, label, group_name) VALUES
  ('leads.view',           'View Leads',                 'Leads'),
  ('leads.edit_status',    'Update Lead Status',         'Leads'),
  ('leads.notes.view',     'View Notes on Leads',        'Leads'),
  ('leads.notes.add',      'Add Notes to Leads',         'Leads'),
  ('checkin.queue.view',   'View Check-In Queue',        'Check-In'),
  ('checkin.queue.manage', 'Finalize Check-Ins',         'Check-In'),
  ('schedule.view',        'View Staff Schedule',        'Schedule'),
  ('schedule.manage',      'Manage Shifts & Staff',      'Schedule'),
  ('users.view',           'View Staff User List',       'Users & Roles'),
  ('users.manage',         'Invite / Assign Roles',      'Users & Roles'),
  ('roles.manage',         'Manage Roles & Permissions', 'Users & Roles'),
  ('reports.view',         'View Reports',               'Reports')
ON CONFLICT (key) DO NOTHING;

-- ── Default roles ─────────────────────────────────────────────────────────────
INSERT INTO roles (name, description) VALUES
  ('Super Admin', 'Full access to everything, including role and user management'),
  ('Manager',     'Full operational access — cannot manage roles or user permissions'),
  ('Trainer',     'View and annotate assigned leads; view schedule'),
  ('Front Desk',  'Process check-ins; view leads list')
ON CONFLICT (name) DO NOTHING;

-- ── Role → permission assignments ─────────────────────────────────────────────

-- Super Admin: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM   roles r, permissions p
WHERE  r.name = 'Super Admin'
ON CONFLICT DO NOTHING;

-- Manager: everything except roles.manage and users.manage
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM   roles r
JOIN   permissions p ON p.key NOT IN ('roles.manage', 'users.manage')
WHERE  r.name = 'Manager'
ON CONFLICT DO NOTHING;

-- Trainer: leads (view + notes) + schedule view
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM   roles r
JOIN   permissions p ON p.key IN (
         'leads.view', 'leads.notes.view', 'leads.notes.add', 'schedule.view'
       )
WHERE  r.name = 'Trainer'
ON CONFLICT DO NOTHING;

-- Front Desk: check-in queue + leads view
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM   roles r
JOIN   permissions p ON p.key IN (
         'checkin.queue.view', 'checkin.queue.manage', 'leads.view'
       )
WHERE  r.name = 'Front Desk'
ON CONFLICT DO NOTHING;
