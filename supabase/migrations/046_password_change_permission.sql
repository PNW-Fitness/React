-- Migration 046: profile.change_password permission
-- Lets a Super Admin turn off self-service password changes for specific
-- roles — e.g. a shared/community login used by multiple people, where any
-- one of them changing the password would lock everyone else out.
-- Granted to every existing role by default so nothing changes for anyone
-- until a Super Admin deliberately revokes it via Roles & Permissions.
-- Run via: supabase db push (CLI, linked project)

INSERT INTO permissions (key, label, group_name) VALUES
  ('profile.change_password', 'Change Own Password', 'Profile')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM   roles r, permissions p
WHERE  p.key = 'profile.change_password'
ON CONFLICT DO NOTHING;
