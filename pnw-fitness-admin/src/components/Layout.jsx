import { useNavigate, NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'
import { usePermissions } from '../lib/PermissionsContext'

const ROLE_NAV = [
  { to: '/',              label: 'Staff',          roles: ['admin', 'staff'],                       permKey: 'pages.staff'        },
  { to: '/pricing',       label: 'Pricing',        roles: ['admin', 'staff'],                       permKey: 'pages.pricing'      },
  { to: '/testimonials',  label: 'Testimonials',   roles: ['admin', 'staff'],                       permKey: 'pages.testimonials' },
  { to: '/faq',           label: 'FAQ',            roles: ['admin', 'staff'],                       permKey: 'pages.faq'          },
  { to: '/holidays',      label: 'Holiday Hours',  roles: ['admin', 'staff'],                       permKey: 'pages.holiday_hours'},
  { to: '/announcements', label: 'Announcements',  roles: ['admin', 'staff'],                       permKey: 'pages.announcements'},
  { to: '/leads',         label: 'Leads',          roles: ['admin', 'fitness_manager', 'trainer'],  permKey: 'pages.leads'        },
  { to: '/guest-notes',   label: 'Guest Notes',    roles: ['admin', 'front_desk'],                              permKey: 'pages.guest_notes'  },
  { to: '/vendor-log',    label: 'Vendor Log',     roles: ['admin', 'front_desk', 'fitness_manager'],           permKey: 'pages.vendor_log'   },
  { to: '/activity',      label: 'Activity Log',   roles: ['admin'],                                            permKey: 'pages.activity_log' },
]

export default function Layout({ children }) {
  const navigate = useNavigate()
  const { role } = useAuth()
  const { can } = usePermissions()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const visibleNav = [
    ...ROLE_NAV.filter(item =>
      can(item.permKey) || (!role || item.roles.includes(role))
    ),
    ...((can('pages.users_roles') || (can('roles.manage') && can('users.manage')))
      ? [{ to: '/users-roles', label: 'Users & Roles' }]
      : []),
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── Sidebar ── */}
      <aside className="w-52 flex-shrink-0 bg-blue-700 flex flex-col">
        <div className="px-5 py-5">
          <span className="text-white font-bold text-base leading-tight">PNW Fitness Admin</span>
        </div>

        <nav className="flex-1 px-3 pb-4 flex flex-col gap-0.5">
          {visibleNav.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-white text-blue-700'
                    : 'text-blue-100 hover:text-white hover:bg-blue-600'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-5">
          <button
            onClick={handleSignOut}
            className="w-full text-sm text-blue-200 hover:text-white hover:bg-blue-600 px-3 py-2 rounded-lg transition-colors text-left"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 px-8 py-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
