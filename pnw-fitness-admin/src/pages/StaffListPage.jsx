import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

const ROLE_LABELS = {
  personal_trainer: 'PT',
  group_instructor: 'GI',
}

export default function StaffListPage() {
  const navigate = useNavigate()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data, error: err } = await supabase
        .from('staff')
        .select('*, staff_roles(*)')
        .order('name')
      if (err) { setError(err.message); setLoading(false); return }
      setStaff(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Staff</h2>
        <button
          onClick={() => navigate('/staff/new')}
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Add Staff Member
        </button>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading…</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!loading && !error && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Cert / Specialty</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Roles</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.map(member => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{member.name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {[member.cert, member.specialty].filter(Boolean).join(' · ')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {(member.staff_roles ?? []).map(r => (
                        <span
                          key={r.id}
                          className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded"
                        >
                          {ROLE_LABELS[r.role] ?? r.role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {member.active ? (
                      <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded">
                        Active
                      </span>
                    ) : (
                      <span className="bg-gray-200 text-gray-500 text-xs font-semibold px-2 py-0.5 rounded">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => navigate(`/staff/${member.id}`)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    No staff members yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
