import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

export default function TestimonialsListPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('testimonials')
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
        <h2 className="text-xl font-bold text-gray-800">Testimonials</h2>
        <button
          onClick={() => navigate('/testimonials/new')}
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Add Testimonial
        </button>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading…</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!loading && !error && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Stars</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Quote preview</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{t.display_order}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {t.name}
                    <div className="text-xs text-gray-400">{t.detail}</div>
                  </td>
                  <td className="px-4 py-3 text-yellow-500">{'★'.repeat(t.stars)}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{t.text}</td>
                  <td className="px-4 py-3">
                    {t.active
                      ? <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded">Active</span>
                      : <span className="bg-gray-200 text-gray-500 text-xs font-semibold px-2 py-0.5 rounded">Inactive</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => navigate(`/testimonials/${t.id}`)} className="text-blue-600 hover:underline text-sm">Edit</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No testimonials yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
