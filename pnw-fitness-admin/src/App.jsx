import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import LoginPage from './pages/LoginPage'
import StaffListPage from './pages/StaffListPage'
import StaffEditPage from './pages/StaffEditPage'

function ProtectedRoute({ session, children }) {
  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading...
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage session={session} />} />
        <Route
          path="/"
          element={
            <ProtectedRoute session={session}>
              <StaffListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/new"
          element={
            <ProtectedRoute session={session}>
              <StaffEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/:id"
          element={
            <ProtectedRoute session={session}>
              <StaffEditPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
