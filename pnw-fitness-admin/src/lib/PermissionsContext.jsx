import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'

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
          setPermissions(keys)
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
