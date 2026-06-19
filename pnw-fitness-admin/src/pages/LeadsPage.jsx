import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

const SOURCE_LABELS = { join: 'Join', tour: 'Tour', booking: 'Booking' }
const SOURCE_COLORS = {
  join:    'bg-green-100 text-green-700',
  tour:    'bg-purple-100 text-purple-700',
  booking: 'bg-orange-100 text-orange-700',
}
const STATUS_OPTIONS = ['new', 'contacted', 'closed']
const STATUS_LABELS  = { new: 'New', contacted: 'Contacted', closed: 'Closed' }

function statusCls(status) {
  if (status === 'new')       return 'bg-blue-100 text-blue-700 border-blue-200'
  if (status === 'contacted') return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-gray-100 text-gray-500 border-gray-200'
}

// One-line summary shown in the collapsed row
function summaryLine(source, details) {
  if (!details) return null
  if (source === 'join')    return details.plan ? `Plan: ${details.plan}` : null
  if (source === 'tour')    return [details.date, details.time, details.group].filter(Boolean).join(' · ') || null
  if (source === 'booking') return [details.type, details.date, details.time].filter(Boolean).join(' · ') || null
  return null
}

// Detail rows for the expanded panel
function detailRows(source, details) {
  if (!details) return []
  if (source === 'join')    return [['Plan', details.plan]].filter(([, v]) => v)
  if (source === 'tour')    return [['Date', details.date], ['Time', details.time], ['Group size', details.group], ['Notes', details.notes]].filter(([, v]) => v)
  if (source === 'booking') return [['Type', details.type], ['Date', details.date], ['Time', details.time], ['Notes', details.notes]].filter(([, v]) => v)
  return Object.entries(details).filter(([, v]) => v)
}

export default function LeadsPage() {
  const [leads, setLeads]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [expanded, setExpanded]   = useState(null)
  const [filterSource, setFilterSource] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [updating, setUpdating]   = useState(null)

  useEffect(() => {
    supabase
      .from('lead_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(err.message)
        else setLeads(data ?? [])
        setLoading(false)
      })
  }, [])

  async function updateStatus(leadId, newStatus) {
    setUpdating(leadId)
    const { error: err } = await supabase
      .from('lead_submissions')
      .update({ status: newStatus })
      .eq('id', leadId)
    if (!err) setLeads(l => l.map(x => x.id === leadId ? { ...x, status: newStatus } : x))
    setUpdating(null)
  }

  const filtered = leads.filter(l =>
    (filterSource === 'all' || l.source === filterSource) &&
    (filterStatus === 'all' || l.status === filterStatus)
  )
  const newCount = leads.filter(l => l.status === 'new').length

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-800">Leads</h2>
          {newCount > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {newCount} new
            </span>
          )}
        </div>
        <span className="text-sm text-gray-400">{filtered.length} of {leads.length}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-5">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500">Source</label>
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="join">Join</option>
            <option value="tour">Tour</option>
            <option value="booking">Booking</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500">Status</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-lg mb-4">{error}</p>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading leads…</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-sm">No leads match the current filters.</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filtered.map(lead => {
              const isNew      = lead.status === 'new'
              const isExpanded = expanded === lead.id
              const summary    = summaryLine(lead.source, lead.details)
              const rows       = detailRows(lead.source, lead.details)

              return (
                <div key={lead.id} className={isNew ? 'bg-blue-50/40' : undefined}>
                  {/* Collapsed row */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${SOURCE_COLORS[lead.source] ?? 'bg-gray-100 text-gray-600'}`}>
                      {SOURCE_LABELS[lead.source] ?? lead.source}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate flex items-center gap-1.5 ${isNew ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {isNew && <span className="inline-block w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                        {lead.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {lead.email}{summary ? ` · ${summary}` : ''}
                      </p>
                    </div>

                    <span className="text-xs text-gray-500 flex-shrink-0 hidden sm:block w-24 text-right">
                      {lead.phone || '—'}
                    </span>

                    <span className="text-xs text-gray-400 flex-shrink-0 hidden md:block w-28 text-right">
                      {new Date(lead.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>

                    <select
                      value={lead.status}
                      disabled={updating === lead.id}
                      onChange={e => updateStatus(lead.id, e.target.value)}
                      className={`text-xs font-medium border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0 cursor-pointer disabled:opacity-50 ${statusCls(lead.status)}`}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => setExpanded(isExpanded ? null : lead.id)}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0 transition"
                      aria-label={isExpanded ? 'Collapse' : 'Expand details'}
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-white">
                      <div className="flex flex-wrap gap-8">
                        {/* Contact block */}
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Contact</p>
                          <p className="text-sm font-medium text-gray-800">{lead.name}</p>
                          <a href={`mailto:${lead.email}`} className="text-sm text-blue-600 hover:underline block">{lead.email}</a>
                          {lead.phone && <p className="text-sm text-gray-700">{lead.phone}</p>}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(lead.created_at).toLocaleString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                              hour: 'numeric', minute: '2-digit',
                            })}
                          </p>
                        </div>

                        {/* Details block */}
                        {rows.length > 0 && (
                          <div className="flex-1 min-w-[160px]">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Details</p>
                            <dl className="space-y-1">
                              {rows.map(([label, value]) => (
                                <div key={label} className="flex gap-2 text-sm">
                                  <dt className="font-medium text-gray-500 capitalize flex-shrink-0">{label}:</dt>
                                  <dd className="text-gray-800">{value}</dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Layout>
  )
}
