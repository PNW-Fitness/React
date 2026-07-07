import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

// ── Helpers ───────────────────────────────────────────────────────────────────
function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key]
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {})
}

const LEGACY_ROLES = [
  { value: 'admin',           label: 'Admin'           },
  { value: 'fitness_manager', label: 'Fitness Manager' },
  { value: 'trainer',         label: 'Trainer'         },
  { value: 'front_desk',      label: 'Front Desk'      },
  { value: 'staff',           label: 'Staff'           },
]

// ── Page shell ────────────────────────────────────────────────────────────────
export default function UsersRolesPage() {
  const [tab, setTab] = useState('users')

  return (
    <Layout>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Users &amp; Roles</h2>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { key: 'users', label: 'Users'               },
          { key: 'roles', label: 'Roles & Permissions' },
          { key: 'add',   label: 'Add User'            },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'roles' && <RolesTab />}
      {tab === 'add'   && <AddUserTab />}
    </Layout>
  )
}

// ── Users tab ─────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users,         setUsers]         = useState([])
  const [rbacRoles,     setRbacRoles]     = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [currentUserId, setCurrentUserId] = useState(null)

  const [saving,         setSaving]         = useState(null) // user_id
  const [changingLegacy, setChangingLegacy] = useState(null) // user_id

  const [resetTarget,  setResetTarget]  = useState(null)
  const [resetMessage, setResetMessage] = useState({ type: '', text: '' })

  // Set-password modal
  const [pwTarget,   setPwTarget]   = useState(null)
  const [newPw,      setNewPw]      = useState('')
  const [confirmPw,  setConfirmPw]  = useState('')
  const [pwLoading,  setPwLoading]  = useState(false)
  const [pwError,    setPwError]    = useState('')
  const [pwSuccess,  setPwSuccess]  = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id ?? null)

    const [
      { data: profiles,      error: e1 },
      { data: userRolesList, error: e2 },
      { data: roleList,      error: e3 },
    ] = await Promise.all([
      supabase
        .from('admin_profiles')
        .select('user_id, email, display_name, role, is_active, created_at')
        .order('created_at'),
      supabase.from('user_roles').select('user_id, role_id, roles(id, name)'),
      supabase.from('roles').select('id, name').order('name'),
    ])

    if (e1 || e2 || e3) {
      setError((e1 || e2 || e3).message)
    } else {
      const urMap = Object.fromEntries((userRolesList ?? []).map(ur => [ur.user_id, ur]))
      setUsers((profiles ?? []).map(p => ({ ...p, userRole: urMap[p.user_id] ?? null })))
      setRbacRoles(roleList ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function countSuperAdmins() {
    const sa = rbacRoles.find(r => r.name === 'Super Admin')
    if (!sa) return 0
    const { count } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', sa.id)
    return count ?? 0
  }

  async function handleRbacChange(user, newRoleId) {
    setError('')
    const sa = rbacRoles.find(r => r.name === 'Super Admin')
    const currentRoleId = user.userRole?.role_id

    if (sa && currentRoleId === sa.id && newRoleId !== sa.id) {
      if ((await countSuperAdmins()) <= 1) {
        setError('Cannot demote the last Super Admin. Assign another Super Admin first.')
        return
      }
    }

    setSaving(user.user_id)
    let err
    if (!newRoleId) {
      ;({ error: err } = await supabase.from('user_roles').delete().eq('user_id', user.user_id))
    } else {
      ;({ error: err } = await supabase
        .from('user_roles')
        .upsert({ user_id: user.user_id, role_id: newRoleId }, { onConflict: 'user_id' }))
    }
    if (err) setError(err.message)
    else await load()
    setSaving(null)
  }

  async function handleLegacyChange(user, newRole) {
    setChangingLegacy(user.user_id)
    const { error: err } = await supabase
      .from('admin_profiles')
      .update({ role: newRole })
      .eq('user_id', user.user_id)
    if (err) setError(err.message)
    else setUsers(u => u.map(x => x.user_id === user.user_id ? { ...x, role: newRole } : x))
    setChangingLegacy(null)
  }

  async function handleToggleActive(user) {
    setError('')
    const sa = rbacRoles.find(r => r.name === 'Super Admin')
    if (user.is_active && sa && user.userRole?.role_id === sa.id) {
      if ((await countSuperAdmins()) <= 1) {
        setError('Cannot deactivate the last Super Admin.')
        return
      }
    }
    setSaving(user.user_id)
    const { error: err } = await supabase
      .from('admin_profiles')
      .update({ is_active: !user.is_active })
      .eq('user_id', user.user_id)
    if (err) setError(err.message)
    else await load()
    setSaving(null)
  }

  async function handleEmailReset(user) {
    setResetMessage({ type: '', text: '' })
    setResetTarget(user.user_id)
    const { error: err } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setResetTarget(null)
    if (err) {
      setResetMessage({ type: 'error', text: `Failed to send reset email: ${err.message}` })
    } else {
      setResetMessage({ type: 'success', text: `Password reset email sent to ${user.email}.` })
    }
  }

  function openSetPw(user) {
    setPwTarget(user)
    setNewPw('')
    setConfirmPw('')
    setPwError('')
    setPwSuccess('')
  }

  async function handleSetPassword(e) {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')
    if (newPw.length < 6)    { setPwError('Password must be at least 6 characters.'); return }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return }

    setPwLoading(true)
    const { error: fnErr } = await supabase.functions.invoke('set-user-password', {
      body: { userId: pwTarget.user_id, password: newPw },
    })
    setPwLoading(false)

    if (fnErr) {
      let msg = fnErr.message
      try { const body = await fnErr.context?.json?.(); if (body?.error) msg = body.error } catch {}
      setPwError(msg)
      return
    }
    setPwSuccess(`Password updated for ${pwTarget.email}.`)
    setNewPw('')
    setConfirmPw('')
  }

  async function handleRemove(user) {
    if (!window.confirm(
      `Remove ${user.email} from the admin panel?\n\nThis deletes their profile but does NOT delete their Supabase auth account.`
    )) return
    setError('')
    const { error: e1 } = await supabase.from('staff_admins').delete().eq('user_id', user.user_id)
    if (e1) { setError(e1.message); return }
    const { error: e2 } = await supabase.from('admin_profiles').delete().eq('user_id', user.user_id)
    if (e2) { setError(e2.message); return }
    setUsers(u => u.filter(x => x.user_id !== user.user_id))
  }

  if (loading) return <p className="text-sm text-gray-400">Loading users…</p>

  return (
    <div>
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
      )}
      {resetMessage.text && (
        <p className={`mb-4 text-sm px-4 py-3 rounded-lg border ${
          resetMessage.type === 'error'
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-green-50 text-green-700 border-green-200'
        }`}>{resetMessage.text}</p>
      )}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[750px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Legacy role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">RBAC role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(user => {
              const isSelf   = user.user_id === currentUserId
              const isBusy   = saving === user.user_id || changingLegacy === user.user_id
              const rbacRole = user.userRole?.roles

              return (
                <tr key={user.user_id} className={!user.is_active ? 'opacity-50' : ''}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">
                      {user.display_name || '—'}
                      {isSelf && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded">You</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </td>

                  <td className="px-4 py-3">
                    {isSelf ? (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{user.role}</span>
                    ) : (
                      <select
                        value={user.role ?? 'staff'}
                        disabled={isBusy}
                        onChange={e => handleLegacyChange(user, e.target.value)}
                        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
                      >
                        {LEGACY_ROLES.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <select
                      value={rbacRole?.id ?? ''}
                      disabled={isBusy}
                      onChange={e => handleRbacChange(user, e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <option value="">— none —</option>
                      {rbacRoles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3 flex-wrap text-xs">
                      <button
                        onClick={() => openSetPw(user)}
                        className="text-green-600 hover:text-green-800 hover:underline"
                      >
                        Set password
                      </button>
                      <button
                        onClick={() => handleEmailReset(user)}
                        disabled={resetTarget === user.user_id}
                        className="text-blue-500 hover:text-blue-700 hover:underline disabled:opacity-40"
                      >
                        {resetTarget === user.user_id ? 'Sending…' : 'Email reset'}
                      </button>
                      {!isSelf && (
                        <button
                          onClick={() => handleToggleActive(user)}
                          disabled={isBusy}
                          className="text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg px-2 py-1 transition disabled:opacity-50"
                        >
                          {isBusy ? '…' : user.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      )}
                      {isSelf ? (
                        <span className="text-gray-300">Can't remove yourself</span>
                      ) : (
                        <button
                          onClick={() => handleRemove(user)}
                          className="text-red-500 hover:text-red-700 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">No users yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Set password modal */}
      {pwTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-800 mb-1">Set password</h3>
            <p className="text-sm text-gray-500 mb-4">
              Set a new password for <span className="font-medium text-gray-700">{pwTarget.email}</span>.
            </p>
            <form onSubmit={handleSetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">New password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Confirm password</label>
                <input
                  type="password"
                  required
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              {pwError   && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{pwError}</p>}
              {pwSuccess && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{pwSuccess}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition"
                >
                  {pwLoading ? 'Saving…' : 'Set password'}
                </button>
                <button
                  type="button"
                  onClick={() => setPwTarget(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Roles & Permissions tab ───────────────────────────────────────────────────
function RolesTab() {
  const [roles,       setRoles]       = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [expanded,    setExpanded]    = useState(null)
  const [toggling,    setToggling]    = useState(null)
  const [showNewRole, setShowNewRole] = useState(false)
  const [newName,     setNewName]     = useState('')
  const [newDesc,     setNewDesc]     = useState('')
  const [creating,    setCreating]    = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: r, error: e1 }, { data: p, error: e2 }] = await Promise.all([
      supabase
        .from('roles')
        .select('id, name, description, role_permissions(permission_id)')
        .order('name'),
      supabase
        .from('permissions')
        .select('id, key, label, group_name')
        .order('group_name, label'),
    ])
    if (e1 || e2) setError((e1 || e2).message)
    else { setRoles(r ?? []); setPermissions(p ?? []) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function togglePermission(roleId, permId, currentlyOn) {
    const key = `${roleId}:${permId}`
    setToggling(key)
    setError('')
    let err
    if (currentlyOn) {
      ;({ error: err } = await supabase
        .from('role_permissions')
        .delete()
        .match({ role_id: roleId, permission_id: permId }))
    } else {
      ;({ error: err } = await supabase
        .from('role_permissions')
        .insert({ role_id: roleId, permission_id: permId }))
    }
    if (err) {
      setError(err.message)
    } else {
      setRoles(prev => prev.map(r => {
        if (r.id !== roleId) return r
        const rps = r.role_permissions ?? []
        return {
          ...r,
          role_permissions: currentlyOn
            ? rps.filter(rp => rp.permission_id !== permId)
            : [...rps, { permission_id: permId }],
        }
      }))
    }
    setToggling(null)
  }

  async function handleDeleteRole(role) {
    setError('')
    const { count } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', role.id)
    if (count > 0) {
      setError(`Cannot delete "${role.name}" — ${count} user(s) assigned. Reassign them first.`)
      return
    }
    const { error: err } = await supabase.from('roles').delete().eq('id', role.id)
    if (err) setError(err.message)
    else { setExpanded(null); await load() }
  }

  async function handleCreateRole(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setError('')
    const { error: err } = await supabase
      .from('roles')
      .insert({ name: newName.trim(), description: newDesc.trim() || null })
    if (err) setError(err.message)
    else { setNewName(''); setNewDesc(''); setShowNewRole(false); await load() }
    setCreating(false)
  }

  if (loading) return <p className="text-sm text-gray-400">Loading roles…</p>

  const permsByGroup = groupBy(permissions, 'group_name')

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
      )}

      {roles.map(role => {
        const enabledIds  = new Set((role.role_permissions ?? []).map(rp => rp.permission_id))
        const isSuperAdmin = role.name === 'Super Admin'
        const isOpen       = expanded === role.id

        return (
          <div key={role.id} className="bg-white rounded-xl shadow overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : role.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition"
            >
              <div>
                <p className="font-semibold text-gray-800">{role.name}</p>
                {role.description && <p className="text-xs text-gray-400 mt-0.5">{role.description}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{enabledIds.size} / {permissions.length} permissions</span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 px-5 py-4 space-y-5">
                {Object.entries(permsByGroup).map(([group, perms]) => (
                  <div key={group}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{group}</p>
                    <div className="space-y-2">
                      {perms.map(perm => {
                        const on   = enabledIds.has(perm.id)
                        const busy = toggling === `${role.id}:${perm.id}`
                        return (
                          <label
                            key={perm.id}
                            className={`flex items-center gap-3 cursor-pointer ${isSuperAdmin ? 'opacity-60 pointer-events-none' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              disabled={isSuperAdmin || busy}
                              onChange={() => togglePermission(role.id, perm.id, on)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{perm.label}</span>
                            {busy && <span className="text-xs text-gray-400 ml-auto">Saving…</span>}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}

                {isSuperAdmin ? (
                  <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                    Super Admin role cannot be edited or deleted.
                  </p>
                ) : (
                  <div className="pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleDeleteRole(role)}
                      className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-3 py-1.5 transition"
                    >
                      Delete role
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {showNewRole ? (
        <form onSubmit={handleCreateRole} className="bg-white rounded-xl shadow px-5 py-4 space-y-3">
          <p className="font-semibold text-gray-700 text-sm">New role</p>
          <input
            type="text"
            placeholder="Role name *"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="bg-blue-700 hover:bg-blue-800 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              {creating ? 'Creating…' : 'Create role'}
            </button>
            <button
              type="button"
              onClick={() => { setShowNewRole(false); setNewName(''); setNewDesc('') }}
              className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg px-4 py-2 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowNewRole(true)}
          className="w-full text-sm text-blue-600 hover:text-blue-800 border border-dashed border-blue-300 hover:border-blue-400 rounded-xl py-3 transition"
        >
          + Add new role
        </button>
      )}
    </div>
  )
}

// ── Add User tab ──────────────────────────────────────────────────────────────
function AddUserTab() {
  const [mode, setMode] = useState('invite') // 'invite' | 'create'

  // Invite link
  const [inviteEmail,   setInviteEmail]   = useState('')
  const [inviteRole,    setInviteRole]    = useState('staff')
  const [inviting,      setInviting]      = useState(false)
  const [inviteMsg,     setInviteMsg]     = useState({ type: '', text: '' })
  const [inviteLink,    setInviteLink]    = useState(null)
  const [copied,        setCopied]        = useState(false)

  // Direct create
  const [username,      setUsername]      = useState('')
  const [password,      setPassword]      = useState('')
  const [confirmPw,     setConfirmPw]     = useState('')
  const [createRole,    setCreateRole]    = useState('staff')
  const [creating,      setCreating]      = useState(false)
  const [createMsg,     setCreateMsg]     = useState({ type: '', text: '' })

  async function handleInvite(e) {
    e.preventDefault()
    setInviteMsg({ type: '', text: '' })
    setInviteLink(null)
    setCopied(false)
    setInviting(true)

    const { data, error: fnErr } = await supabase.functions.invoke('invite-admin', {
      body: { email: inviteEmail.trim(), redirectTo: `${window.location.origin}/accept-invite` },
    })

    if (fnErr) {
      let msg = fnErr.message
      try { const body = await fnErr.context?.json?.(); if (body?.error) msg = body.error } catch {}
      setInviteMsg({ type: 'error', text: msg })
      setInviting(false)
      return
    }

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
      setInviteMsg({
        type: 'success',
        text: `Access granted for ${inviteEmail.trim()} as ${inviteRole}. Send them the link below to set their password:`,
      })
    } else {
      setInviteMsg({
        type: 'success',
        text: `Access granted for ${inviteEmail.trim()} as ${inviteRole}. They already have an account and can sign in now.`,
      })
    }
    setInviteEmail('')
    setInviteRole('staff')
  }

  async function handleCopyLink() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleCreate(e) {
    e.preventDefault()
    setCreateMsg({ type: '', text: '' })
    if (password.length < 6) {
      setCreateMsg({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }
    if (password !== confirmPw) {
      setCreateMsg({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    setCreating(true)
    const { error: fnErr } = await supabase.functions.invoke('create-admin-user', {
      body: { username: username.trim(), password, role: createRole },
    })
    setCreating(false)
    if (fnErr) {
      let msg = fnErr.message
      try {
        const body = typeof fnErr.context?.json === 'function' ? await fnErr.context.json() : null
        if (body?.error) msg = body.error
      } catch {}
      if (msg.toLowerCase().includes('failed to send') || msg.toLowerCase().includes('not found')) {
        msg = 'Account creation service is not deployed yet. See the deployment instructions above.'
      }
      setCreateMsg({ type: 'error', text: msg })
      return
    }
    setCreateMsg({
      type: 'success',
      text: `Account created for "${username.trim()}" as ${createRole}. They can sign in immediately.`,
    })
    setUsername('')
    setPassword('')
    setConfirmPw('')
    setCreateRole('staff')
  }

  return (
    <div className="max-w-md">
      {/* Mode toggle */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-5 text-sm font-medium">
        <button
          type="button"
          onClick={() => { setMode('invite'); setInviteMsg({ type: '', text: '' }); setInviteLink(null) }}
          className={`flex-1 py-2 transition ${mode === 'invite' ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          Generate invite link
        </button>
        <button
          type="button"
          onClick={() => { setMode('create'); setCreateMsg({ type: '', text: '' }) }}
          className={`flex-1 py-2 transition ${mode === 'create' ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          Set username &amp; password
        </button>
      </div>

      {/* Invite link form */}
      {mode === 'invite' && (
        <form onSubmit={handleInvite} className="space-y-3">
          <p className="text-xs text-gray-400 mb-2">
            Generates a one-time link you can send to the user to set their password.
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
              {LEGACY_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {inviteMsg.text && (
            <p className={`text-sm px-3 py-2 rounded border ${
              inviteMsg.type === 'error'
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-green-50 text-green-700 border-green-200'
            }`}>{inviteMsg.text}</p>
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

      {/* Direct create form */}
      {mode === 'create' && (
        <form onSubmit={handleCreate} className="space-y-3">
          <p className="text-xs text-gray-400 mb-2">
            Creates a staff account immediately with a username and password. Works for Front Desk, Staff, Trainers, and any other role — no email address needed.
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
            <input
              type="text"
              required
              placeholder="e.g. frontdesk or john"
              value={username}
              onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">No @ needed. They'll sign in with this username.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="At least 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Confirm password</label>
            <input
              type="password"
              required
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
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
              {LEGACY_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {createMsg.text && (
            <p className={`text-sm px-3 py-2 rounded border ${
              createMsg.type === 'error'
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-green-50 text-green-700 border-green-200'
            }`}>{createMsg.text}</p>
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
  )
}
