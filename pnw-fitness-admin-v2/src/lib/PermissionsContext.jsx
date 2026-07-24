import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'

// Full permission list — Super Admin always receives these regardless of Supabase state.
const ALL_PERMS = [
  'leads.view', 'leads.create', 'leads.edit_status', 'leads.edit_details',
  'leads.notes.view', 'leads.notes.add',
  'checkin.queue.view', 'checkin.queue.manage',
  'schedule.view', 'schedule.manage',
  'users.view', 'users.manage', 'roles.manage',
  'reports.view',
  'pages.staff', 'pages.pricing', 'pages.testimonials', 'pages.faq',
  'pages.holiday_hours', 'pages.announcements',
  'pages.leads', 'pages.guest_notes', 'pages.vendor_log',
  'pages.activity_log', 'pages.users_roles',
  'vendor_log.notes.add',
  // Phase 2
  'leads.assign', 'pages.banned_guests', 'bans.view', 'bans.manage',
  'leads.trial_pass.manage',
  // Phase 3
  'pages.schedule', 'shift_trade.request', 'shift_trade.manage',
  'pages.team_board', 'team_board.post',
]

const PermissionsContext = createContext({
  permissions:      [],
  rbacRoleName:     null,
  permissionsReady: false,
  can: () => false,
})

export function PermissionsProvider({ children }) {
  const { session, role } = useAuth()
  const [permissions,      setPermissions]      = useState([])
  const [rbacRoleName,     setRbacRoleName]     = useState(null)
  const [permissionsReady, setPermissionsReady] = useState(false)

  useEffect(() => {
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
          const keys = (data.roles.role_permissions ?? [])
            .map(rp => rp.permissions?.key)
            .filter(Boolean)
          setRbacRoleName(data.roles.name)
          // Super Admin always gets everything — consistent with the non-editable UI treatment.
          setPermissions(data.roles.name === 'Super Admin' ? ALL_PERMS : keys)
        } else {
          setRbacRoleName(null)
          setPermissions([])
        }
        setPermissionsReady(true)
      })
      .catch(() => {
        setRbacRoleName(null)
        setPermissions([])
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
