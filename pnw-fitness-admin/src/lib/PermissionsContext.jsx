import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'

// ── Fallback: map old admin_profiles.role strings → permission keys ───────────
// Used for users who don't yet have a row in the new user_roles table.
const ALL_PERMS = [
  'leads.view', 'leads.edit_status', 'leads.notes.view', 'leads.notes.add',
  'checkin.queue.view', 'checkin.queue.manage',
  'schedule.view', 'schedule.manage',
  'users.view', 'users.manage', 'roles.manage',
  'reports.view',
]

const LEGACY_ROLE_PERMS = {
  admin:           ALL_PERMS,
  fitness_manager: ALL_PERMS.filter(k => k !== 'roles.manage' && k !== 'users.manage'),
  trainer:         ['leads.view', 'leads.notes.view', 'leads.notes.add', 'schedule.view'],
  front_desk:      ['checkin.queue.view', 'checkin.queue.manage', 'leads.view'],
  staff:           [], // content-only; no RBAC-tracked permissions
}

// ── Context ───────────────────────────────────────────────────────────────────
const PermissionsContext = createContext({
  permissions:      [],
  rbacRoleName:     null,   // new system role name (e.g. 'Super Admin'), or null
  permissionsReady: false,
  can: () => false,
})

export function PermissionsProvider({ children }) {
  const { session, role } = useAuth()
  const [permissions,      setPermissions]      = useState([])
  const [rbacRoleName,     setRbacRoleName]     = useState(null)
  const [permissionsReady, setPermissionsReady] = useState(false)

  useEffect(() => {
    // Wait until both session AND role are resolved by AuthContext.
    if (session === undefined || role === undefined) return

    if (!session) {
      setPermissions([])
      setRbacRoleName(null)
      setPermissionsReady(true)
      return
    }

    setPermissionsReady(false)

    supabase
      .from('user_roles')
      .select('roles(name, role_permissions(permissions(key)))')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.roles) {
          // New RBAC system: extract permission keys from the nested join.
          const keys = (data.roles.role_permissions ?? [])
            .map(rp => rp.permissions?.key)
            .filter(Boolean)
          setRbacRoleName(data.roles.name)
          setPermissions(keys)
        } else {
          // No user_roles row yet — fall back to the legacy role string.
          setRbacRoleName(null)
          setPermissions(LEGACY_ROLE_PERMS[role] ?? [])
        }
        setPermissionsReady(true)
      })
      .catch(() => {
        // On error fall back to legacy so the user isn't locked out.
        setRbacRoleName(null)
        setPermissions(LEGACY_ROLE_PERMS[role] ?? [])
        setPermissionsReady(true)
      })
  }, [session, role])

  function can(key) {
    return permissions.includes(key)
  }

  return (
    <PermissionsContext.Provider value={{ permissions, rbacRoleName, permissionsReady, can }}>
      {children}
    </PermissionsContext.Provider>
  )
}

export const usePermissions = () => useContext(PermissionsContext)
