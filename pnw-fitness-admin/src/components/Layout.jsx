import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Layout({ children }) {
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

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
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
