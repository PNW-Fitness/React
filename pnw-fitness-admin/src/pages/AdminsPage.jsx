import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

const ROLES = [
  { value: 'admin',           label: 'Admin'           },
  { value: 'fitness_manager', label: 'Fitness Manager' },
  { value: 'trainer',         label: 'Trainer'         },
  { value: 'staff',           label: 'Staff'           },
]

const ROLE_BADGE = {
  admin:           'bg-blue-100 text-blue-700',
  fitness_manager: 'bg-green-100 text-green-700',
  trainer:         'bg-purple-100 text-purple-700',
  staff:           'bg-gray-100 text-gray-600',
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState([])
  const [currentUserId, setCurrentUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('staff')
  const [inviting, setInviting] = useState(false)
  const [inviteMessage, setInviteMessage] = useState({ type: '', text: '' })
  const [inviteLink, setInviteLink] = useState(null)
  const [copied, setCopied] = useState(false)
  const [resetTarget, setResetTarget] = useState(null)
  const [resetMessage, setResetMessage] = useState({ type: '', text: '' })
  const [changingRole, setChangingRole] = useState(null) // user_id being updated

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
      body: {
        email: inviteEmail.trim(),
        redirectTo: `${window.location.origin}/accept-invite`,
      },
    })

    if (fnErr) {
      setInviting(false)
      // Try to surface the real error message from the function response body.
      let msg = fnErr.message
      try {
        const body = await fnErr.context?.json?.()
        if (body?.error) msg = body.error
      } catch {}
      setInviteMessage({ type: 'error', text: msg })
      return
    }

    // Apply the selected role — edge function creates the row with default 'staff'.
    if (inviteRole !== 'staff') {
      await supabase
        .from('admin_profiles')
        .update({ role: inviteRole })
        .eq('email', inviteEmail.trim())
    }

    setInviting(false)

    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    if (parsed?.inviteLink) {
      setInviteLink(parsed.inviteLink)
      setInviteMessage({
        type: 'success',
        text: `Access granted for ${inviteEmail.trim()} as ${inviteRole}. Send them the link below to set their password:`,
      })
    } else {
      setInviteMessage({
        type: 'success',
        text: `Access granted for ${inviteEmail.trim()} as ${inviteRole}. They already have an account and can sign in now.`,
      })
    }
    setInviteEmail('')
    setInviteRole('staff')
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

  async function handleRoleChange(admin, newRole) {
    setChangingRole(admin.user_id)
    const { error: err } = await supabase
      .from('admin_profiles')
      .update({ role: newRole })
      .eq('user_id', admin.user_id)
    setChangingRole(null)
    if (err) {
      setError(`Failed to update role: ${err.message}`)
    } else {
      setAdmins(a => a.map(x => x.user_id === admin.user_id ? { ...x, role: newRole } : x))
    }
  }

  async function handleRemove(admin) {
    if (!window.confirm(`Remove access for ${admin.email}?`)) return

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
      <h2 className="text-xl font-bold text-gray-800 mb-6">Users &amp; Roles</h2>

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

      {loading && <p className="text-gray-500 text-sm mb-6">Loading…</p>}
      {error && <p className="text-red-600 text-sm mb-6">{error}</p>}

      {!loading && !error && (
        <div className="bg-white rounded-xl shadow overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Display name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
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
                  <td className="px-4 py-3">
                    {a.user_id === currentUserId ? (
                      // Can't change your own role
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${ROLE_BADGE[a.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {a.role ?? 'admin'}
                      </span>
                    ) : (
                      <select
                        value={a.role ?? 'staff'}
                        disabled={changingRole === a.user_id}
                        onChange={e => handleRoleChange(a, e.target.value)}
                        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
                      >
                        {ROLES.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    )}
                  </td>
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
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">No users yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Role legend */}
      <div className="bg-white rounded-xl shadow p-4 mb-8 flex flex-wrap gap-4 text-xs text-gray-600">
        <span className="font-semibold text-gray-700 self-center">Roles:</span>
        <span><span className="font-semibold text-blue-700">Admin</span> — full access to all pages</span>
        <span><span className="font-semibold text-green-700">Fitness Manager</span> — leads page + assign trainers to leads</span>
        <span><span className="font-semibold text-purple-700">Trainer</span> — leads page + add notes</span>
        <span><span className="font-semibold text-gray-700">Staff</span> — content management (staff, pricing, FAQ, etc.)</span>
      </div>

      {/* Invite form */}
      <div className="bg-white rounded-xl shadow p-6 max-w-md">
        <h3 className="font-semibold text-gray-700 mb-1">Invite a new user</h3>
        <p className="text-xs text-gray-400 mb-4">
          Generates an invite link you can send via text or email. No rate limits.
        </p>

        <form onSubmit={handleInvite} className="space-y-3">
          <input
            type="email"
            required
            placeholder="user@example.com"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

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
