import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

export default function AnnouncementsListPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('announcements')
      .select('*')
      .order('display_order')
      .then(({ data, error: err }) => {
        if (err) setError(err.message)
        else setItems(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Announcements</h2>
        <button
          onClick={() => navigate('/announcements/new')}
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Add Announcement
        </button>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading…</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!loading && !error && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-12">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Message</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-24">Status</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{a.display_order}</td>
                  <td className="px-4 py-3 text-gray-800">
                    <span className="line-clamp-2">{a.message}</span>
                  </td>
                  <td className="px-4 py-3">
                    {a.active
                      ? <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded">Active</span>
                      : <span className="bg-gray-200 text-gray-500 text-xs font-semibold px-2 py-0.5 rounded">Inactive</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => navigate(`/announcements/${a.id}`)} className="text-blue-600 hover:underline text-sm">Edit</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No announcements yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
