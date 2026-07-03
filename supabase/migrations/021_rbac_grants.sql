-- Table-level grants for the new RBAC tables.
-- RLS policies handle row-level filtering; these grants allow the
-- authenticated role to reach the tables in the first place.

GRANT SELECT ON roles            TO authenticated;
GRANT SELECT ON permissions      TO authenticated;
GRANT SELECT ON role_permissions TO authenticated;
GRANT SELECT ON user_roles       TO authenticated;

-- Modification grants — RLS policies enforce who can actually write.
GRANT INSERT, UPDATE, DELETE ON roles            TO authenticated;
GRANT INSERT, UPDATE, DELETE ON role_permissions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON user_roles       TO authenticated;
