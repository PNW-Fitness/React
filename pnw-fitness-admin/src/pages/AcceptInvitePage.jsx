import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

// Parse the hash once at module load so React StrictMode's double-effect
// invocation can't race against clearing the URL hash.
// Handles both type=invite (new user) and type=recovery (password reset).
const INVITE_HASH = (() => {
  const p = new URLSearchParams(window.location.hash.slice(1))
  return {
    access_token: p.get('access_token') || '',
    refresh_token: p.get('refresh_token') || '',
    type: p.get('type') || '',
  }
})()

// SUPABASE DASHBOARD REMINDER (cannot be done from code):
//   Authentication → URL Configuration
//   • Set Site URL to your Vercel deploy URL, e.g. https://pnw-fitness-admin.vercel.app
//   • Add https://pnw-fitness-admin.vercel.app/** to Redirect URLs
//
// Without those settings, invite emails will point to the wrong address
// and this page will never receive the hash tokens.
//
// After deploying, re-send the pending invites from:
//   Authentication → Users → (pending user) → Re-send invite

export default function AcceptInvitePage() {
  const navigate = useNavigate()

  // 'checking' | 'invalid' | 'form' | 'success'
  const [state, setState] = useState('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Guard against StrictMode's double effect invocation
  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    // Remove tokens from the address bar / browser history immediately
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname)
    }

    async function init() {
      const { access_token, refresh_token, type } = INVITE_HASH

      if (!access_token || (type !== 'invite' && type !== 'recovery')) {
        setState('invalid')
        return
      }

      // supabase-js processes the URL hash asynchronously during client
      // initialization (GoTrueClient.initialize). By the time this effect runs,
      // the session is typically already established and the original refresh
      // token has been rotated — calling setSession() with it would fail.
      // Check for the existing session first.
      const { data: { session: existing } } = await supabase.auth.getSession()
      if (existing) {
        setState('form')
        return
      }

      // Fallback: supabase-js hasn't processed the hash yet.
      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      })

      if (sessionError) {
        setState('invalid')
        return
      }

      setState('form')
    }

    init()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setState('success')
    // Sign out so the redirect lands on a clean, unauthenticated login page
    await supabase.auth.signOut()
    setTimeout(() => navigate('/login', { replace: true }), 2000)
  }

  if (state === 'checking') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Verifying invite link…</p>
      </div>
    )
  }

  if (state === 'invalid') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-md w-full max-w-sm p-8 text-center space-y-3">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-bold text-gray-800">Invalid invite link</h1>
          <p className="text-sm text-gray-500">
            This invite link is invalid or has already been used. Please contact
            your administrator to receive a new invite.
          </p>
        </div>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-md w-full max-w-sm p-8 text-center space-y-3">
          <div className="text-4xl font-bold text-green-600">✓</div>
          <h1 className="text-xl font-bold text-gray-800">Password set!</h1>
          <p className="text-sm text-gray-500">Redirecting to login…</p>
        </div>
      </div>
    )
  }

  const isRecovery = INVITE_HASH.type === 'recovery'

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          {isRecovery ? 'Reset Your Password' : 'Welcome to PNW Fitness Admin'}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {isRecovery
            ? 'Choose a new password for your account.'
            : 'Create a password to activate your account.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition text-sm"
          >
            {loading ? 'Setting password…' : 'Set Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
