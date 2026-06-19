import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

export default function PricingListPage() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('pricing_plans')
      .select('*')
      .order('display_order')
      .then(({ data, error: err }) => {
        if (err) setError(err.message)
        else setPlans(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Pricing Plans</h2>
        <button
          onClick={() => navigate('/pricing/new')}
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Add Plan
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
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Monthly</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Yearly</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Badge</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plans.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{p.display_order}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {p.name}
                    <div className="text-xs text-gray-400">{p.tagline}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">${p.monthly_price}/mo</td>
                  <td className="px-4 py-3 text-gray-500">{p.yearly_price ? `$${p.yearly_price}/yr` : '—'}</td>
                  <td className="px-4 py-3">
                    {p.badge_text
                      ? <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded">{p.badge_text}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {p.active
                      ? <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded">Active</span>
                      : <span className="bg-gray-200 text-gray-500 text-xs font-semibold px-2 py-0.5 rounded">Inactive</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => navigate(`/pricing/${p.id}`)} className="text-blue-600 hover:underline text-sm">Edit</button>
                  </td>
                </tr>
              ))}
              {plans.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">No plans yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
