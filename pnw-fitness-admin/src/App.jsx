import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './lib/AuthContext'
import { usePermissions } from './lib/PermissionsContext'
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
import ActivityLogPage from './pages/ActivityLogPage'
import LeadsPage from './pages/LeadsPage'
import AnnouncementsListPage from './pages/AnnouncementsListPage'
import AnnouncementsEditPage from './pages/AnnouncementsEditPage'
import AcceptInvitePage from './pages/AcceptInvitePage'
import GuestNotesPage from './pages/GuestNotesPage'
import VendorLogPage from './pages/VendorLogPage'
import UsersRolesPage from './pages/UsersRolesPage'

const INACTIVITY_MS = 30 * 60 * 1000

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Loading…
    </div>
  )
}

function NoAccess() {
  const { session } = useAuth()
  const { can, permissionsReady } = usePermissions()

  if (!session) return <Navigate to="/login" replace />

  // Permissions still loading — hold here rather than showing the error screen.
  if (!permissionsReady) return <Loading />

  // Landed here due to a race condition: permissions are now ready and the user
  // has access somewhere, so route them there.
  if (can('pages.staff'))       return <Navigate to="/" replace />
  if (can('pages.leads'))       return <Navigate to="/leads" replace />
  if (can('pages.guest_notes')) return <Navigate to="/guest-notes" replace />
  if (can('pages.vendor_log'))  return <Navigate to="/vendor-log" replace />

  // Genuinely no pages assigned yet.
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="font-medium text-gray-700">No pages are assigned to your account.</p>
        <p className="text-sm text-gray-400 mt-1">Contact an admin to assign you an RBAC role.</p>
        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-blue-600 hover:underline"
          >
            Retry
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-gray-400 hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

// Sends signed-in users to their first accessible page.
function DefaultRedirect() {
  const { session, role } = useAuth()
  const { can, permissionsReady } = usePermissions()
  if (session === undefined || (session && (role === undefined || !permissionsReady))) return <Loading />
  if (!session) return <Navigate to="/login" replace />
  if (can('pages.staff'))       return <Navigate to="/" replace />
  if (can('pages.leads'))       return <Navigate to="/leads" replace />
  if (can('pages.guest_notes')) return <Navigate to="/guest-notes" replace />
  if (can('pages.vendor_log'))  return <Navigate to="/vendor-log" replace />
  return <Navigate to="/no-access" replace />
}

// Gate for permission-based pages. Redirects to first accessible page if denied.
function PermissionRoute({ requiredPerms, children }) {
  const { session, role } = useAuth()
  const { can, permissionsReady } = usePermissions()
  if (session === undefined || (session && (role === undefined || !permissionsReady))) return <Loading />
  if (!session) return <Navigate to="/login" replace />
  if (!requiredPerms.every(p => can(p))) {
    if (can('pages.staff'))       return <Navigate to="/" replace />
    if (can('pages.leads'))       return <Navigate to="/leads" replace />
    if (can('pages.guest_notes')) return <Navigate to="/guest-notes" replace />
    if (can('pages.vendor_log'))  return <Navigate to="/vendor-log" replace />
    return <Navigate to="/no-access" replace />
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

  function perm(el, permKey) {
    return <PermissionRoute requiredPerms={[permKey]}>{el}</PermissionRoute>
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/accept-invite"  element={<AcceptInvitePage />} />
        <Route path="/reset-password" element={<AcceptInvitePage />} />
        <Route path="/no-access"      element={<NoAccess />} />

        {/* Content management */}
        <Route path="/"                    element={perm(<StaffListPage />,        'pages.staff'        )} />
        <Route path="/staff/new"           element={perm(<StaffEditPage />,         'pages.staff'        )} />
        <Route path="/staff/:id"           element={perm(<StaffEditPage />,         'pages.staff'        )} />
        <Route path="/pricing"             element={perm(<PricingListPage />,       'pages.pricing'      )} />
        <Route path="/pricing/new"         element={perm(<PricingEditPage />,       'pages.pricing'      )} />
        <Route path="/pricing/:id"         element={perm(<PricingEditPage />,       'pages.pricing'      )} />
        <Route path="/testimonials"        element={perm(<TestimonialsListPage />,  'pages.testimonials' )} />
        <Route path="/testimonials/new"    element={perm(<TestimonialsEditPage />,  'pages.testimonials' )} />
        <Route path="/testimonials/:id"    element={perm(<TestimonialsEditPage />,  'pages.testimonials' )} />
        <Route path="/faq"                 element={perm(<FaqListPage />,           'pages.faq'          )} />
        <Route path="/faq/new"             element={perm(<FaqEditPage />,           'pages.faq'          )} />
        <Route path="/faq/:id"             element={perm(<FaqEditPage />,           'pages.faq'          )} />
        <Route path="/holidays"            element={perm(<HolidayListPage />,       'pages.holiday_hours')} />
        <Route path="/holidays/new"        element={perm(<HolidayEditPage />,       'pages.holiday_hours')} />
        <Route path="/holidays/:id"        element={perm(<HolidayEditPage />,       'pages.holiday_hours')} />
        <Route path="/announcements"       element={perm(<AnnouncementsListPage />, 'pages.announcements')} />
        <Route path="/announcements/new"   element={perm(<AnnouncementsEditPage />, 'pages.announcements')} />
        <Route path="/announcements/:id"   element={perm(<AnnouncementsEditPage />, 'pages.announcements')} />

        {/* Operational pages */}
        <Route path="/leads"       element={perm(<LeadsPage />,      'pages.leads'       )} />
        <Route path="/guest-notes" element={perm(<GuestNotesPage />, 'pages.guest_notes' )} />
        <Route path="/vendor-log"  element={perm(<VendorLogPage />,  'pages.vendor_log'  )} />
        <Route path="/activity"    element={perm(<ActivityLogPage />, 'pages.activity_log')} />

        {/* Users & Roles */}
        <Route path="/admins"      element={<Navigate to="/users-roles" replace />} />
        <Route path="/users-roles" element={perm(<UsersRolesPage />, 'pages.users_roles')} />

        <Route path="*" element={<DefaultRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}
