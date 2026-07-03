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

// ── Main component ─────────────────────────────────────────────────────────────
export default function UsersRolesPage() {
  const [tab, setTab] = useState('users') // 'users' | 'roles'

  return (
    <Layout>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Users &amp; Roles</h2>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {['users', 'roles'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'users' ? 'Users' : 'Roles & Permissions'}
          </button>
        ))}
      </div>

      {tab === 'users' ? <UsersTab /> : <RolesTab />}
    </Layout>
  )
}

// ── Users tab ─────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users,   setUsers]   = useState([])
  const [roles,   setRoles]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [saving,  setSaving]  = useState(null) // user_id being saved

  const load = useCallback(async () => {
    setLoading(true)
    const [
      { data: profiles, error: e1 },
      { data: userRolesList, error: e2 },
      { data: roleList, error: e3 },
    ] = await Promise.all([
      supabase.from('admin_profiles').select('user_id, email, display_name, role, is_active').order('created_at'),
      supabase.from('user_roles').select('user_id, role_id, roles(id, name)'),
      supabase.from('roles').select('id, name').order('name'),
    ])
    if (e1 || e2 || e3) setError((e1 || e2 || e3).message)
    else {
      // Merge user_roles into profiles client-side — no direct FK between the two tables.
      const urMap = Object.fromEntries((userRolesList ?? []).map(ur => [ur.user_id, ur]))
      setUsers((profiles ?? []).map(p => ({ ...p, user_roles: urMap[p.user_id] ?? null })))
      setRoles(roleList ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function countSuperAdmins() {
    const superAdmin = roles.find(r => r.name === 'Super Admin')
    if (!superAdmin) return 0
    const { count } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', superAdmin.id)
    return count ?? 0
  }

  async function handleRoleChange(user, newRoleId) {
    setError('')
    const superAdmin = roles.find(r => r.name === 'Super Admin')
    const currentRoleId = user.user_roles?.role_id

    // Guard: cannot demote the last Super Admin
    if (superAdmin && currentRoleId === superAdmin.id && newRoleId !== superAdmin.id) {
      const count = await countSuperAdmins()
      if (count <= 1) {
        setError('Cannot demote the last Super Admin. Assign another Super Admin first.')
        return
      }
    }

    setSaving(user.user_id)
    const { error: err } = await supabase
      .from('user_roles')
      .upsert({ user_id: user.user_id, role_id: newRoleId }, { onConflict: 'user_id' })
    if (err) setError(err.message)
    else await load()
    setSaving(null)
  }

  async function handleToggleActive(user) {
    setError('')
    const superAdmin = roles.find(r => r.name === 'Super Admin')
    const currentRoleId = user.user_roles?.role_id

    // Guard: cannot deactivate last Super Admin
    if (user.is_active && superAdmin && currentRoleId === superAdmin.id) {
      const count = await countSuperAdmins()
      if (count <= 1) {
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

  if (loading) return <p className="text-sm text-gray-400">Loading users…</p>

  return (
    <div>
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Legacy role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">RBAC role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(user => {
              const rbacRole = user.user_roles?.roles
              const isSaving = saving === user.user_id
              return (
                <tr key={user.user_id} className={!user.is_active ? 'opacity-50' : ''}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{user.display_name || '—'}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{user.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={rbacRole?.id ?? ''}
                      disabled={isSaving}
                      onChange={e => handleRoleChange(user, e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <option value="">— not assigned —</option>
                      {roles.map(r => (
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
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggleActive(user)}
                      disabled={isSaving}
                      className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 transition disabled:opacity-50"
                    >
                      {isSaving ? '…' : user.is_active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Roles tab ─────────────────────────────────────────────────────────────────
function RolesTab() {
  const [roles,       setRoles]       = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [expanded,    setExpanded]    = useState(null) // role id
  const [toggling,    setToggling]    = useState(null) // 'roleId:permId'
  // New role form
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
    else {
      setRoles(r ?? [])
      setPermissions(p ?? [])
    }
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
      // Optimistic local update
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
    // Check if any users are assigned to this role
    const { count } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', role.id)
    if (count > 0) {
      setError(`Cannot delete "${role.name}" — ${count} user(s) are assigned to it. Reassign them first.`)
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
    else {
      setNewName('')
      setNewDesc('')
      setShowNewRole(false)
      await load()
    }
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
        const enabledIds = new Set((role.role_permissions ?? []).map(rp => rp.permission_id))
        const isSuperAdmin = role.name === 'Super Admin'
        const isOpen = expanded === role.id

        return (
          <div key={role.id} className="bg-white rounded-xl shadow overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : role.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition"
            >
              <div>
                <p className="font-semibold text-gray-800">{role.name}</p>
                {role.description && (
                  <p className="text-xs text-gray-400 mt-0.5">{role.description}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                  {enabledIds.size} / {permissions.length} permissions
                </span>
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
                        const on  = enabledIds.has(perm.id)
                        const key = `${role.id}:${perm.id}`
                        const busy = toggling === key
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

                {!isSuperAdmin && (
                  <div className="pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleDeleteRole(role)}
                      className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-3 py-1.5 transition"
                    >
                      Delete role
                    </button>
                  </div>
                )}
                {isSuperAdmin && (
                  <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                    Super Admin role cannot be edited or deleted.
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Add new role */}
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
