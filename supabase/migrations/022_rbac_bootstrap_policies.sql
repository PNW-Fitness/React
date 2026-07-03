-- Fix the bootstrap deadlock: the original INSERT/UPDATE/DELETE policies on
-- user_roles only allowed users who already had a user_roles entry with the
-- users.manage permission — meaning no one could ever insert the first row.
--
-- The fix: also accept the legacy is_admin_role() check (admin_profiles.role = 'admin')
-- so that existing admins can seed the table through the UI.
-- Once everyone is migrated to RBAC, the is_admin_role() fallback is harmless.

DROP POLICY IF EXISTS "User managers can insert user_roles" ON user_roles;
DROP POLICY IF EXISTS "User managers can update user_roles" ON user_roles;
DROP POLICY IF EXISTS "User managers can delete user_roles" ON user_roles;

CREATE POLICY "User managers can insert user_roles"
  ON user_roles FOR INSERT TO authenticated
  WITH CHECK (auth_has_permission('users.manage') OR is_admin_role());

CREATE POLICY "User managers can update user_roles"
  ON user_roles FOR UPDATE TO authenticated
  USING     (auth_has_permission('users.manage') OR is_admin_role())
  WITH CHECK (auth_has_permission('users.manage') OR is_admin_role());

CREATE POLICY "User managers can delete user_roles"
  ON user_roles FOR DELETE TO authenticated
  USING (auth_has_permission('users.manage') OR is_admin_role());

-- Apply the same fix to roles and role_permissions so that legacy admins
-- can also create/edit roles before their Super Admin entry exists.
DROP POLICY IF EXISTS "Role managers can insert roles" ON roles;
DROP POLICY IF EXISTS "Role managers can update roles" ON roles;
DROP POLICY IF EXISTS "Role managers can delete roles" ON roles;
DROP POLICY IF EXISTS "Role managers can insert role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "Role managers can delete role_permissions" ON role_permissions;

CREATE POLICY "Role managers can insert roles"
  ON roles FOR INSERT TO authenticated
  WITH CHECK (auth_has_permission('roles.manage') OR is_admin_role());

CREATE POLICY "Role managers can update roles"
  ON roles FOR UPDATE TO authenticated
  USING     (auth_has_permission('roles.manage') OR is_admin_role())
  WITH CHECK (auth_has_permission('roles.manage') OR is_admin_role());

CREATE POLICY "Role managers can delete roles"
  ON roles FOR DELETE TO authenticated
  USING (auth_has_permission('roles.manage') OR is_admin_role());

CREATE POLICY "Role managers can insert role_permissions"
  ON role_permissions FOR INSERT TO authenticated
  WITH CHECK (auth_has_permission('roles.manage') OR is_admin_role());

CREATE POLICY "Role managers can delete role_permissions"
  ON role_permissions FOR DELETE TO authenticated
  USING (auth_has_permission('roles.manage') OR is_admin_role());
