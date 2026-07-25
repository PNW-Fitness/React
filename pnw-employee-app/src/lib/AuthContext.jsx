import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

const AuthContext = createContext({ session: undefined, role: undefined })

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [role, setRole] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session === undefined) return
    if (!session) { setRole(null); return }
    supabase.rpc('get_my_role').then(({ data }) => setRole(data ?? null))
  }, [session])

  return (
    <AuthContext.Provider value={{ session, role }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
