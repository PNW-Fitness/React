import { useNavigate, NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'
import { usePermissions } from '../lib/PermissionsContext'

const ROLE_NAV = [
  { to: '/',              label: 'Staff',          roles: ['admin', 'staff']                      },
  { to: '/pricing',       label: 'Pricing',        roles: ['admin', 'staff']                      },
  { to: '/testimonials',  label: 'Testimonials',   roles: ['admin', 'staff']                      },
  { to: '/faq',           label: 'FAQ',            roles: ['admin', 'staff']                      },
  { to: '/holidays',      label: 'Holiday Hours',  roles: ['admin', 'staff']                      },
  { to: '/announcements', label: 'Announcements',  roles: ['admin', 'staff']                      },
  { to: '/leads',         label: 'Leads',          roles: ['admin', 'fitness_manager', 'trainer'] },
  { to: '/guest-notes',   label: 'Guest Notes',    roles: ['admin', 'front_desk']                 },
  { to: '/activity',      label: 'Activity Log',   roles: ['admin']                               },
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
    ...ROLE_NAV.filter(item => !role || item.roles.includes(role)),
    ...(can('roles.manage') && can('users.manage')
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
