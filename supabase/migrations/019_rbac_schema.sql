-- ── New RBAC tables ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT NOT NULL UNIQUE,
  label      TEXT NOT NULL,
  group_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- One role per user. INSERT here is the ONLY permitted change to existing users.
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id)
);

-- ── Soft-deactivation flag on admin_profiles ──────────────────────────────────
-- Does NOT touch auth.users — this is an app-level flag only.
ALTER TABLE admin_profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- ── Permission helper function (SECURITY DEFINER bypasses RLS) ───────────────
CREATE OR REPLACE FUNCTION auth_has_permission(permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   user_roles ur
    JOIN   role_permissions rp ON rp.role_id       = ur.role_id
    JOIN   permissions       p  ON p.id             = rp.permission_id
    WHERE  ur.user_id = auth.uid()
    AND    p.key      = permission_key
  );
$$;

GRANT EXECUTE ON FUNCTION auth_has_permission(TEXT) TO authenticated;

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles       ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read all four tables (needed for the permission hook
-- and for building the role/permission UI).
CREATE POLICY "Authenticated users can read roles"
  ON roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read permissions"
  ON permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read role_permissions"
  ON role_permissions FOR SELECT TO authenticated USING (true);

-- user_roles: read own row OR if you have users.manage permission.
CREATE POLICY "Users can read their own role or managers read all"
  ON user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR auth_has_permission('users.manage'));

-- Modification policies — roles and role_permissions require roles.manage
CREATE POLICY "Role managers can insert roles"
  ON roles FOR INSERT TO authenticated
  WITH CHECK (auth_has_permission('roles.manage'));

CREATE POLICY "Role managers can update roles"
  ON roles FOR UPDATE TO authenticated
  USING     (auth_has_permission('roles.manage'))
  WITH CHECK (auth_has_permission('roles.manage'));

CREATE POLICY "Role managers can delete roles"
  ON roles FOR DELETE TO authenticated
  USING (auth_has_permission('roles.manage'));

CREATE POLICY "Role managers can insert role_permissions"
  ON role_permissions FOR INSERT TO authenticated
  WITH CHECK (auth_has_permission('roles.manage'));

CREATE POLICY "Role managers can delete role_permissions"
  ON role_permissions FOR DELETE TO authenticated
  USING (auth_has_permission('roles.manage'));

-- user_roles modifications require users.manage
CREATE POLICY "User managers can insert user_roles"
  ON user_roles FOR INSERT TO authenticated
  WITH CHECK (auth_has_permission('users.manage'));

CREATE POLICY "User managers can update user_roles"
  ON user_roles FOR UPDATE TO authenticated
  USING     (auth_has_permission('users.manage'))
  WITH CHECK (auth_has_permission('users.manage'));

CREATE POLICY "User managers can delete user_roles"
  ON user_roles FOR DELETE TO authenticated
  USING (auth_has_permission('users.manage'));
