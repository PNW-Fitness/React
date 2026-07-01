import { useNavigate, NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'

const NAV = [
  { to: '/',              label: 'Staff',          roles: ['admin', 'staff']            },
  { to: '/pricing',       label: 'Pricing',        roles: ['admin', 'staff']            },
  { to: '/testimonials',  label: 'Testimonials',   roles: ['admin', 'staff']            },
  { to: '/faq',           label: 'FAQ',            roles: ['admin', 'staff']            },
  { to: '/holidays',      label: 'Holiday Hours',  roles: ['admin', 'staff']            },
  { to: '/announcements', label: 'Announcements',  roles: ['admin', 'staff']            },
  { to: '/leads',         label: 'Leads',          roles: ['admin', 'fitness_manager', 'trainer'] },
  { to: '/guest-notes',   label: 'Guest Notes',    roles: ['admin', 'front_desk']       },
  { to: '/admins',        label: 'Admins',         roles: ['admin']                     },
  { to: '/activity',      label: 'Activity Log',   roles: ['admin']                     },
]

export default function Layout({ children }) {
  const navigate = useNavigate()
  const { role } = useAuth()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const visibleNav = NAV.filter(item => !role || item.roles.includes(role))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-700 text-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-lg font-semibold tracking-wide">PNW Fitness Admin</span>
          <button
            onClick={handleSignOut}
            className="text-sm bg-blue-900 hover:bg-blue-800 px-3 py-1.5 rounded transition"
          >
            Sign out
          </button>
        </div>
        <nav className="max-w-5xl mx-auto px-4 pb-0 flex gap-1 overflow-x-auto">
          {visibleNav.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `text-sm font-medium px-3 py-2 rounded-t whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-gray-50 text-blue-700'
                    : 'text-blue-100 hover:text-white hover:bg-blue-600'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
