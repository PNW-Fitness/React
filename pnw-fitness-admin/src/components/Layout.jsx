import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const NAV = [
  { to: '/',             label: 'Staff'         },
  { to: '/pricing',      label: 'Pricing'       },
  { to: '/testimonials', label: 'Testimonials'  },
  { to: '/faq',          label: 'FAQ'           },
  { to: '/holidays',     label: 'Holiday Hours' },
  { to: '/admins',       label: 'Admins',        adminOnly: true },
  { to: '/activity',     label: 'Activity Log',  adminOnly: true },
]

export default function Layout({ children }) {
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.rpc('is_staff_admin').then(({ data }) => setIsAdmin(!!data))
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const visibleNav = NAV.filter(item => !item.adminOnly || isAdmin)

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
