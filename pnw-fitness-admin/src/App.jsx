import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import LoginPage from './pages/LoginPage'
import StaffListPage from './pages/StaffListPage'
import StaffEditPage from './pages/StaffEditPage'
import PricingListPage from './pages/PricingListPage'
import PricingEditPage from './pages/PricingEditPage'
import TestimonialsListPage from './pages/TestimonialsListPage'
import TestimonialsEditPage from './pages/TestimonialsEditPage'
import FaqListPage from './pages/FaqListPage'
import FaqEditPage from './pages/FaqEditPage'
import HolidayListPage from './pages/HolidayListPage'
import HolidayEditPage from './pages/HolidayEditPage'
import AdminsPage from './pages/AdminsPage'
import ActivityLogPage from './pages/ActivityLogPage'
import LeadsPage from './pages/LeadsPage'
import AnnouncementsListPage from './pages/AnnouncementsListPage'
import AnnouncementsEditPage from './pages/AnnouncementsEditPage'

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

  function protect(el) {
    return <ProtectedRoute session={session}>{el}</ProtectedRoute>
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"                element={<LoginPage session={session} />} />
        <Route path="/"                     element={protect(<StaffListPage />)} />
        <Route path="/staff/new"            element={protect(<StaffEditPage />)} />
        <Route path="/staff/:id"            element={protect(<StaffEditPage />)} />
        <Route path="/pricing"              element={protect(<PricingListPage />)} />
        <Route path="/pricing/new"          element={protect(<PricingEditPage />)} />
        <Route path="/pricing/:id"          element={protect(<PricingEditPage />)} />
        <Route path="/testimonials"         element={protect(<TestimonialsListPage />)} />
        <Route path="/testimonials/new"     element={protect(<TestimonialsEditPage />)} />
        <Route path="/testimonials/:id"     element={protect(<TestimonialsEditPage />)} />
        <Route path="/faq"                  element={protect(<FaqListPage />)} />
        <Route path="/faq/new"              element={protect(<FaqEditPage />)} />
        <Route path="/faq/:id"              element={protect(<FaqEditPage />)} />
        <Route path="/holidays"             element={protect(<HolidayListPage />)} />
        <Route path="/holidays/new"         element={protect(<HolidayEditPage />)} />
        <Route path="/holidays/:id"         element={protect(<HolidayEditPage />)} />
        <Route path="/leads"                element={protect(<LeadsPage />)} />
        <Route path="/admins"               element={protect(<AdminsPage />)} />
        <Route path="/activity"             element={protect(<ActivityLogPage />)} />
        <Route path="/announcements"        element={protect(<AnnouncementsListPage />)} />
        <Route path="/announcements/new"    element={protect(<AnnouncementsEditPage />)} />
        <Route path="/announcements/:id"    element={protect(<AnnouncementsEditPage />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
