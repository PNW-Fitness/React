import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function formatTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function VendorLogPage() {
  const [vendors,      setVendors]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [fetchError,   setFetchError]   = useState(null)
  const [selectedDate, setSelectedDate] = useState(todayStr)

  async function fetchVendors(dateStr) {
    setLoading(true)
    setFetchError(null)
    const start = new Date(dateStr + 'T00:00:00')
    const end   = new Date(dateStr + 'T23:59:59.999')

    const { data, error } = await supabase
      .from('vendor_submissions')
      .select('*')
      .gte('submitted_at', start.toISOString())
      .lte('submitted_at', end.toISOString())
      .order('submitted_at', { ascending: false })

    if (error) setFetchError(`${error.message} (${error.code})`)
    setVendors(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchVendors(selectedDate)

    if (selectedDate !== todayStr()) return

    const channel = supabase
      .channel(`vendor_log_admin_${selectedDate}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vendor_submissions' }, payload => {
        setVendors(prev => [payload.new, ...prev])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [selectedDate])

  const isToday   = selectedDate === todayStr()
  const dateLabel = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-gray-800">Vendor Log</h2>
          <input
            type="date"
            value={selectedDate}
            max={todayStr()}
            onChange={e => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="text-sm text-gray-500 mb-5">
          {isToday ? 'Today — ' : ''}{dateLabel}
        </p>

        {loading && (
          <p className="text-sm text-gray-400 text-center py-8">Loading…</p>
        )}

        {!loading && fetchError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">
            <p className="font-semibold mb-1">Failed to load vendor log</p>
            <p className="font-mono text-xs">{fetchError}</p>
          </div>
        )}

        {!loading && !fetchError && vendors.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">🏢</p>
            <p className="text-sm font-medium">No vendors signed in {isToday ? 'today' : 'that day'}</p>
            <p className="text-xs mt-1">Vendor sign-ins appear here as they check in on the kiosk.</p>
          </div>
        )}

        {!loading && !fetchError && vendors.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {vendors.length} {vendors.length === 1 ? 'vendor' : 'vendors'}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Time In</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Name</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Company</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Phone</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Reason for Visit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vendors.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatTime(v.submitted_at)}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{v.name}</td>
                      <td className="px-4 py-3 text-gray-600">{v.company}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{v.phone || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{v.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </Layout>
  )
}
