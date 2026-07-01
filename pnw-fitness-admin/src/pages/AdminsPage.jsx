import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

export default function AdminsPage() {
  const [admins, setAdmins] = useState([])
  const [currentUserId, setCurrentUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteMessage, setInviteMessage] = useState({ type: '', text: '' })
  const [inviteLink, setInviteLink] = useState(null)
  const [copied, setCopied] = useState(false)
  const [resetTarget, setResetTarget] = useState(null) // email being reset
  const [resetMessage, setResetMessage] = useState({ type: '', text: '' })

  async function load() {
    const [{ data: profile }, { data: list, error: err }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('admin_profiles').select('*').order('created_at'),
    ])
    setCurrentUserId(profile?.user?.id ?? null)
    if (err) setError(err.message)
    else setAdmins(list ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleInvite(e) {
    e.preventDefault()
    setInviteMessage({ type: '', text: '' })
    setInviteLink(null)
    setCopied(false)
    setInviting(true)

    const { data, error: fnErr } = await supabase.functions.invoke('invite-admin', {
      body: { email: inviteEmail.trim() },
    })

    setInviting(false)
    if (fnErr) {
      setInviteMessage({ type: 'error', text: fnErr.message })
      return
    }

    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    if (parsed?.inviteLink) {
      setInviteLink(parsed.inviteLink)
      setInviteMessage({ type: 'success', text: `Access granted for ${inviteEmail.trim()}. Send them the link below to set their password:` })
    } else {
      setInviteMessage({ type: 'success', text: `Access granted for ${inviteEmail.trim()}. They already have an account and can sign in now.` })
    }
    setInviteEmail('')
    load()
  }

  async function handleCopyLink() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleResetPassword(admin) {
    setResetMessage({ type: '', text: '' })
    setResetTarget(admin.email)
    const redirectTo = `${window.location.origin}/reset-password`
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(admin.email, { redirectTo })
    setResetTarget(null)
    if (resetErr) {
      setResetMessage({ type: 'error', text: `Failed to send reset email: ${resetErr.message}` })
    } else {
      setResetMessage({ type: 'success', text: `Password reset email sent to ${admin.email}.` })
    }
  }

  async function handleRemove(admin) {
    if (!window.confirm(`Remove admin access for ${admin.email}?`)) return

    // Delete from both tables — admin_profiles cascades via FK, but we delete
    // staff_admins explicitly to revoke access immediately
    const { error: saErr } = await supabase
      .from('staff_admins')
      .delete()
      .eq('user_id', admin.user_id)

    if (saErr) { setError(saErr.message); return }

    const { error: apErr } = await supabase
      .from('admin_profiles')
      .delete()
      .eq('user_id', admin.user_id)

    if (apErr) { setError(apErr.message); return }

    setAdmins(a => a.filter(x => x.user_id !== admin.user_id))
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <Layout>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Manage Admins</h2>

      {/* Password reset feedback */}
      {resetMessage.text && (
        <p className={`text-sm px-3 py-2 rounded border mb-4 ${
          resetMessage.type === 'error'
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-green-50 text-green-700 border-green-200'
        }`}>
          {resetMessage.text}
        </p>
      )}

      {/* Current admins list */}
      {loading && <p className="text-gray-500 text-sm mb-6">Loading…</p>}
      {error && <p className="text-red-600 text-sm mb-6">{error}</p>}

      {!loading && !error && (
        <div className="bg-white rounded-xl shadow overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Display name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Added</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {admins.map(a => (
                <tr key={a.user_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {a.email}
                    {a.user_id === currentUserId && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded">You</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{a.display_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(a.created_at)}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button
                      onClick={() => handleResetPassword(a)}
                      disabled={resetTarget === a.email}
                      className="text-blue-500 hover:underline text-sm disabled:opacity-40"
                    >
                      {resetTarget === a.email ? 'Sending…' : 'Reset password'}
                    </button>
                    {a.user_id === currentUserId ? (
                      <span className="text-xs text-gray-300">Cannot remove yourself</span>
                    ) : (
                      <button
                        onClick={() => handleRemove(a)}
                        className="text-red-500 hover:underline text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400">No admins yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite form */}
      <div className="bg-white rounded-xl shadow p-6 max-w-md">
        <h3 className="font-semibold text-gray-700 mb-1">Invite a new admin</h3>
        <p className="text-xs text-gray-400 mb-4">
          Generates an invite link you can send via text or email. No rate limits.
        </p>

        <form onSubmit={handleInvite} className="space-y-3">
          <input
            type="email"
            required
            placeholder="admin@example.com"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {inviteMessage.text && (
            <p className={`text-sm px-3 py-2 rounded border ${
              inviteMessage.type === 'error'
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-green-50 text-green-700 border-green-200'
            }`}>
              {inviteMessage.text}
            </p>
          )}

          {inviteLink && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
              <p className="text-xs text-gray-500 break-all font-mono">{inviteLink}</p>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded transition"
              >
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={inviting}
            className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition"
          >
            {inviting ? 'Generating link…' : 'Generate invite link'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
