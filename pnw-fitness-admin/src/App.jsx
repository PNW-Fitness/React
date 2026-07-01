import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './lib/AuthContext'
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
import AcceptInvitePage from './pages/AcceptInvitePage'

const INACTIVITY_MS = 30 * 60 * 1000

// Role groups — used to control which routes each role can access.
const CONTENT_ROLES = ['admin', 'staff']    // content management pages
const LEADS_ROLES   = ['admin', 'fitness_manager', 'trainer']  // leads + notes + assign
const ADMIN_ROLES   = ['admin']             // user/role management, activity log

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Loading…
    </div>
  )
}

// Sends the user to their role's default landing page.
function DefaultRedirect() {
  const { session, role } = useAuth()
  if (session === undefined || (session && role === undefined)) return <Loading />
  if (!session) return <Navigate to="/login" replace />
  return <Navigate to={['trainer', 'fitness_manager'].includes(role) ? '/leads' : '/'} replace />
}

// Gate for role-restricted pages. Redirects unauthorized users to their default.
function ProtectedRoute({ allowedRoles, children }) {
  const { session, role } = useAuth()
  if (session === undefined || (session && role === undefined)) return <Loading />
  if (!session) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={['trainer', 'fitness_manager'].includes(role) ? '/leads' : '/'} replace />
  }
  return children
}

export default function App() {
  const { session } = useAuth()

  // Inactivity timeout — signs the user out after 30 minutes of no interaction.
  useEffect(() => {
    if (!session) return

    let timer

    function resetTimer() {
      clearTimeout(timer)
      timer = setTimeout(async () => {
        await supabase.auth.signOut()
        window.location.replace('/login?timeout=1')
      }, INACTIVITY_MS)
    }

    const EVENTS = ['mousemove', 'keydown', 'click', 'touchstart']
    EVENTS.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }))
    resetTimer()

    return () => {
      clearTimeout(timer)
      EVENTS.forEach(ev => window.removeEventListener(ev, resetTimer))
    }
  }, [session])

  function protect(el, allowedRoles) {
    return <ProtectedRoute allowedRoles={allowedRoles}>{el}</ProtectedRoute>
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/accept-invite"  element={<AcceptInvitePage />} />
        <Route path="/reset-password" element={<AcceptInvitePage />} />

        {/* Content management: admin + staff */}
        <Route path="/"                    element={protect(<StaffListPage />,        CONTENT_ROLES)} />
        <Route path="/staff/new"           element={protect(<StaffEditPage />,         CONTENT_ROLES)} />
        <Route path="/staff/:id"           element={protect(<StaffEditPage />,         CONTENT_ROLES)} />
        <Route path="/pricing"             element={protect(<PricingListPage />,       CONTENT_ROLES)} />
        <Route path="/pricing/new"         element={protect(<PricingEditPage />,       CONTENT_ROLES)} />
        <Route path="/pricing/:id"         element={protect(<PricingEditPage />,       CONTENT_ROLES)} />
        <Route path="/testimonials"        element={protect(<TestimonialsListPage />,  CONTENT_ROLES)} />
        <Route path="/testimonials/new"    element={protect(<TestimonialsEditPage />,  CONTENT_ROLES)} />
        <Route path="/testimonials/:id"    element={protect(<TestimonialsEditPage />,  CONTENT_ROLES)} />
        <Route path="/faq"                 element={protect(<FaqListPage />,           CONTENT_ROLES)} />
        <Route path="/faq/new"             element={protect(<FaqEditPage />,           CONTENT_ROLES)} />
        <Route path="/faq/:id"             element={protect(<FaqEditPage />,           CONTENT_ROLES)} />
        <Route path="/holidays"            element={protect(<HolidayListPage />,       CONTENT_ROLES)} />
        <Route path="/holidays/new"        element={protect(<HolidayEditPage />,       CONTENT_ROLES)} />
        <Route path="/holidays/:id"        element={protect(<HolidayEditPage />,       CONTENT_ROLES)} />
        <Route path="/announcements"       element={protect(<AnnouncementsListPage />, CONTENT_ROLES)} />
        <Route path="/announcements/new"   element={protect(<AnnouncementsEditPage />, CONTENT_ROLES)} />
        <Route path="/announcements/:id"   element={protect(<AnnouncementsEditPage />, CONTENT_ROLES)} />

        {/* Leads: admin + trainer */}
        <Route path="/leads"               element={protect(<LeadsPage />,             LEADS_ROLES)} />

        {/* Admin only */}
        <Route path="/admins"              element={protect(<AdminsPage />,            ADMIN_ROLES)} />
        <Route path="/activity"            element={protect(<ActivityLogPage />,       ADMIN_ROLES)} />

        <Route path="*" element={<DefaultRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}
