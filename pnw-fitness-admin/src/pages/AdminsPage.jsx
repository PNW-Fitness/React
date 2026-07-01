import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

const ROLES = [
  { value: 'admin',           label: 'Admin'           },
  { value: 'fitness_manager', label: 'Fitness Manager' },
  { value: 'trainer',         label: 'Trainer'         },
  { value: 'staff',           label: 'Staff'           },
  { value: 'front_desk',      label: 'Front Desk'      },
]

const ROLE_BADGE = {
  admin:           'bg-blue-100 text-blue-700',
  fitness_manager: 'bg-green-100 text-green-700',
  trainer:         'bg-purple-100 text-purple-700',
  staff:           'bg-gray-100 text-gray-600',
  front_desk:      'bg-orange-100 text-orange-700',
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState([])
  const [currentUserId, setCurrentUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Invite / create form
  const [createMode, setCreateMode]   = useState('invite') // 'invite' | 'create'
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole]   = useState('staff')
  const [inviting, setInviting]       = useState(false)
  const [inviteMessage, setInviteMessage] = useState({ type: '', text: '' })
  const [inviteLink, setInviteLink]   = useState(null)
  const [copied, setCopied]           = useState(false)
  // Direct create
  const [createEmail, setCreateEmail]       = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createConfirm, setCreateConfirm]   = useState('')
  const [createRole, setCreateRole]         = useState('staff')
  const [creating, setCreating]             = useState(false)
  const [createMessage, setCreateMessage]   = useState({ type: '', text: '' })
  const [resetTarget, setResetTarget] = useState(null)
  const [resetMessage, setResetMessage] = useState({ type: '', text: '' })
  const [changingRole, setChangingRole]     = useState(null) // user_id being updated
  const [setPasswordTarget, setSetPasswordTarget] = useState(null) // { user_id, email }
  const [newPassword, setNewPassword]       = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [setPasswordLoading, setSetPasswordLoading] = useState(false)
  const [setPasswordError, setSetPasswordError]     = useState('')
  const [setPasswordSuccess, setSetPasswordSuccess] = useState('')

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

  async function handleCreate(e) {
    e.preventDefault()
    setCreateMessage({ type: '', text: '' })

    if (createPassword.length < 6) {
      setCreateMessage({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }
    if (createPassword !== createConfirm) {
      setCreateMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }

    setCreating(true)
    const { error: fnErr } = await supabase.functions.invoke('create-admin-user', {
      body: { email: createEmail.trim(), password: createPassword, role: createRole },
    })
    setCreating(false)

    if (fnErr) {
      let msg = fnErr.message
      try {
        const body = await fnErr.context?.json?.()
        if (body?.error) msg = body.error
      } catch {}
      setCreateMessage({ type: 'error', text: msg })
      return
    }

    setCreateMessage({
      type: 'success',
      text: `Account created for ${createEmail.trim()} as ${createRole}. They can sign in immediately.`,
    })
    setCreateEmail('')
    setCreatePassword('')
    setCreateConfirm('')
    setCreateRole('staff')
    load()
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

  function openSetPassword(admin) {
    setSetPasswordTarget(admin)
    setNewPassword('')
    setConfirmPassword('')
    setSetPasswordError('')
    setSetPasswordSuccess('')
  }

  function closeSetPassword() {
    setSetPasswordTarget(null)
    setNewPassword('')
    setConfirmPassword('')
    setSetPasswordError('')
    setSetPasswordSuccess('')
  }

  async function handleSetPassword(e) {
    e.preventDefault()
    setSetPasswordError('')
    setSetPasswordSuccess('')

    if (newPassword.length < 6) {
      setSetPasswordError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setSetPasswordError('Passwords do not match.')
      return
    }

    setSetPasswordLoading(true)
    const { error: fnErr } = await supabase.functions.invoke('set-user-password', {
      body: { userId: setPasswordTarget.user_id, password: newPassword },
    })
    setSetPasswordLoading(false)

    if (fnErr) {
      let msg = fnErr.message
      try {
        const body = await fnErr.context?.json?.()
        if (body?.error) msg = body.error
      } catch {}
      setSetPasswordError(msg)
      return
    }

    setSetPasswordSuccess(`Password updated for ${setPasswordTarget.email}.`)
    setNewPassword('')
    setConfirmPassword('')
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
                      onClick={() => openSetPassword(a)}
                      className="text-green-600 hover:underline text-sm"
                    >
                      Set password
                    </button>
                    <button
                      onClick={() => handleResetPassword(a)}
                      disabled={resetTarget === a.email}
                      className="text-blue-500 hover:underline text-sm disabled:opacity-40"
                    >
                      {resetTarget === a.email ? 'Sending…' : 'Email reset'}
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
        <span><span className="font-semibold text-orange-700">Front Desk</span> — guest lookup + add notes only (shared kiosk account)</span>
      </div>

      {/* Add user section */}
      <div className="bg-white rounded-xl shadow p-6 max-w-md">
        <h3 className="font-semibold text-gray-700 mb-3">Add a new user</h3>

        {/* Mode toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-5 text-sm font-medium">
          <button
            type="button"
            onClick={() => { setCreateMode('invite'); setInviteMessage({ type: '', text: '' }); setInviteLink(null) }}
            className={`flex-1 py-2 transition ${createMode === 'invite' ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Generate invite link
          </button>
          <button
            type="button"
            onClick={() => { setCreateMode('create'); setCreateMessage({ type: '', text: '' }) }}
            className={`flex-1 py-2 transition ${createMode === 'create' ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Set username &amp; password
          </button>
        </div>

        {/* ── Invite link form ── */}
        {createMode === 'invite' && (
          <form onSubmit={handleInvite} className="space-y-3">
            <p className="text-xs text-gray-400 -mt-1 mb-2">
              Generates a one-time link you can send to the user.
            </p>
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
              {inviting ? 'Generating…' : 'Generate invite link'}
            </button>
          </form>
        )}

        {/* ── Direct create form ── */}
        {createMode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-3">
            <p className="text-xs text-gray-400 -mt-1 mb-2">
              Creates the account immediately — no link needed. Use for shared accounts like Front Desk.
            </p>
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={createEmail}
              onChange={e => setCreateEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={createPassword}
                onChange={e => setCreatePassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Confirm password</label>
              <input
                type="password"
                required
                value={createConfirm}
                onChange={e => setCreateConfirm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
              <select
                value={createRole}
                onChange={e => setCreateRole(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {createMessage.text && (
              <p className={`text-sm px-3 py-2 rounded border ${
                createMessage.type === 'error'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-green-50 text-green-700 border-green-200'
              }`}>
                {createMessage.text}
              </p>
            )}

            <button
              type="submit"
              disabled={creating}
              className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition"
            >
              {creating ? 'Creating…' : 'Create account'}
            </button>
          </form>
        )}
      </div>
      {/* Set password modal */}
      {setPasswordTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-800 mb-1">Set password</h3>
            <p className="text-sm text-gray-500 mb-4">
              Directly set a new password for <span className="font-medium text-gray-700">{setPasswordTarget.email}</span>.
            </p>

            <form onSubmit={handleSetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">New password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Confirm password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {setPasswordError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                  {setPasswordError}
                </p>
              )}
              {setPasswordSuccess && (
                <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                  {setPasswordSuccess}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={setPasswordLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition"
                >
                  {setPasswordLoading ? 'Saving…' : 'Set password'}
                </button>
                <button
                  type="button"
                  onClick={closeSetPassword}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
