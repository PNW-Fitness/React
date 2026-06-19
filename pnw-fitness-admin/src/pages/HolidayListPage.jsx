import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const STATUS_BADGE = {
  closed:  'bg-red-100 text-red-700',
  regular: 'bg-green-100 text-green-700',
  custom:  'bg-blue-100 text-blue-700',
}

function formatMins(m) {
  if (m == null) return '—'
  const h = Math.floor(m / 60)
  const min = m % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const dh = h > 12 ? h - 12 : h === 0 ? 12 : h
  return min === 0 ? `${dh}:00 ${ampm}` : `${dh}:${String(min).padStart(2,'0')} ${ampm}`
}

export default function HolidayListPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('holiday_hours')
      .select('*')
      .order('year').order('month').order('day')
      .then(({ data, error: err }) => {
        if (err) setError(err.message)
        else setItems(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Holiday Hours</h2>
        <button
          onClick={() => navigate('/holidays/new')}
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Add Holiday
        </button>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading…</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!loading && !error && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Label</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Hours</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(h => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                    {MONTH_NAMES[h.month - 1]} {h.day}, {h.year}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{h.label}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${STATUS_BADGE[h.status]}`}>
                      {h.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {h.status === 'closed' ? 'Closed all day'
                      : h.status === 'regular' ? 'Normal hours'
                      : `${formatMins(h.open_at_minutes)} – ${formatMins(h.close_at_minutes)}`}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => navigate(`/holidays/${h.id}`)} className="text-blue-600 hover:underline text-sm">Edit</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No holidays yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
