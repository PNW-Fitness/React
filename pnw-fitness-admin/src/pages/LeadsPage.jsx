import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'
import { SOURCE_LABELS } from '../lib/sourceLabels'
import { useAuth } from '../lib/AuthContext'

// ── Source badge colours ──────────────────────────────────────────────────────
const SOURCE_COLORS = {
  join:                'bg-green-100 text-green-700',
  tour:                'bg-purple-100 text-purple-700',
  booking:             'bg-orange-100 text-orange-700',
  training_assessment: 'bg-yellow-100 text-yellow-700',
  nasm_partnership:    'bg-indigo-100 text-indigo-700',
  checkin_app:         'bg-teal-100 text-teal-700',
}

// ── Status ────────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ['new', 'contacted', 'converted', 'not_interested', 'closed']
const STATUS_LABELS  = {
  new:           'New',
  contacted:     'Contacted',
  converted:     'Converted',
  not_interested:'Not interested',
  closed:        'Closed',
}

function statusCls(status) {
  if (status === 'new')           return 'bg-blue-100 text-blue-700 border-blue-200'
  if (status === 'contacted')     return 'bg-amber-100 text-amber-700 border-amber-200'
  if (status === 'converted')     return 'bg-green-100 text-green-700 border-green-200'
  if (status === 'not_interested') return 'bg-red-100 text-red-700 border-red-200'
  return 'bg-gray-100 text-gray-500 border-gray-200'
}

// ── Priority colour coding ────────────────────────────────────────────────────
// details.interests is stored as a comma-separated string from the kiosk app.
function getPriorityColor(lead) {
  const vr   = lead.details?.visit_reason || ''
  const ints = lead.details?.interests    || ''
  if (vr === 'Interested in membership')                return '#E74C3C'
  if (ints.includes('Personal Training'))               return '#E67E22'
  if (vr === 'ClassPass' || vr === 'Event/Promotion')   return '#F1C40F'
  return null
}

const PRIORITY_LEGEND = [
  { color: '#E74C3C', label: 'Interested in membership' },
  { color: '#E67E22', label: 'Personal Training interest' },
  { color: '#F1C40F', label: 'ClassPass / Event' },
]

// ── Visit reasons for filter dropdown ────────────────────────────────────────
const VISIT_REASONS = [
  'Interested in membership',
  'Personal Training',
  'Day Pass',
  'ClassPass',
  'Event/Promotion',
]

// ── Summary line (collapsed row) ──────────────────────────────────────────────
function summaryLine(source, details, visitCount) {
  if (!details && source !== 'checkin_app') return null
  switch (source) {
    case 'join':    return details?.plan ? `Plan: ${details.plan}` : null
    case 'tour':    return [details?.date, details?.time, details?.group].filter(Boolean).join(' · ') || null
    case 'booking': return [details?.type, details?.date, details?.time].filter(Boolean).join(' · ') || null
    case 'training_assessment':
      return [details?.membership_status, details?.fitness_level].filter(Boolean).join(' · ') || null
    case 'nasm_partnership':
      return details?.course || null
    case 'checkin_app': {
      const parts = [
        details?.visit_reason,
        visitCount > 1 ? `${visitCount} visits` : null,
      ].filter(Boolean)
      return parts.join(' · ') || null
    }
    default: return null
  }
}

// ── Expanded detail rows ──────────────────────────────────────────────────────
const DETAIL_FIELD_LABELS = {
  plan: 'Plan', date: 'Date', time: 'Time', group: 'Group size', notes: 'Notes',
  type: 'Booking type', contact_method: 'Preferred contact',
  membership_status: 'Membership status', goals: 'Goals',
  fitness_level: 'Fitness level', availability: 'Availability',
  medical_notes: 'Medical / joint notes', mailing_address: 'Mailing address',
  course: 'Course', questions: 'Questions',
  visit_reason: 'Visit reason', interests: 'Interests',
  how_heard: 'How heard', zip_code: 'Zip code',
}

const DETAIL_ORDER = {
  join:                ['plan'],
  tour:                ['date', 'time', 'group', 'notes'],
  booking:             ['type', 'date', 'time', 'notes'],
  training_assessment: ['contact_method', 'membership_status', 'goals', 'fitness_level', 'availability', 'medical_notes'],
  nasm_partnership:    ['mailing_address', 'course', 'questions'],
  checkin_app:         ['visit_reason', 'interests', 'how_heard', 'zip_code'],
}

function detailRows(source, details) {
  if (!details) return []
  const order = DETAIL_ORDER[source] ?? Object.keys(details)
  return order
    .map(k => [DETAIL_FIELD_LABELS[k] ?? k, details[k]])
    .filter(([, v]) => v)
}

// ── Pagination ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 25

// ── Component ─────────────────────────────────────────────────────────────────
export default function LeadsPage() {
  // Filters
  const [filterSource,      setFilterSource]      = useState('all')
  const [filterStatus,      setFilterStatus]      = useState('all')
  const [filterVisitReason, setFilterVisitReason] = useState('all')
  const [search,            setSearch]            = useState('')
  const [debouncedSearch,   setDebouncedSearch]   = useState('')
  const [dateFrom,          setDateFrom]          = useState('')
  const [dateTo,            setDateTo]            = useState('')

  // Pagination
  const [page,       setPage]       = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  // Data
  const [leads,   setLeads]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // Status update
  const [updating, setUpdating] = useState(null)

  // Expand / notes
  const [expanded,       setExpanded]       = useState(null)
  const [notes,          setNotes]          = useState({})      // { leadId: Note[] }
  const [notesLoading,   setNotesLoading]   = useState(null)
  const [noteText,       setNoteText]       = useState({})      // { leadId: string }
  const [noteSubmitting, setNoteSubmitting] = useState(null)

  // Current user's display name (for notes) and id (for "my leads" filter)
  const [myName,       setMyName]       = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)

  // Trainer list (for assign dropdown and filter)
  const [trainers, setTrainers] = useState([])

  // Filter by assigned trainer
  const [filterAssigned, setFilterAssigned] = useState('all')

  const { role } = useAuth()
  const canAssign = role === 'admin' || role === 'fitness_manager'

  // Resolve current user's name + id
  useEffect(() => {
    async function resolveUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)
      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('display_name, email')
        .eq('user_id', user.id)
        .maybeSingle()
      setMyName(profile?.display_name || profile?.email || user.email || null)
    }
    resolveUser()
  }, [])

  // Load all trainer-role users for the assign dropdown + filter
  useEffect(() => {
    supabase
      .from('admin_profiles')
      .select('user_id, display_name, email')
      .eq('role', 'trainer')
      .order('display_name')
      .then(({ data }) => setTrainers(data ?? []))
  }, [])

  // Debounce search: also resets page so filter change is clean
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(0)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  // Main data fetch — re-runs whenever any filter or page changes
  const fetchLeads = useCallback(async () => {
    setLoading(true)
    setError(null)

    // Sanitise search term — strip commas which break PostgREST .or() syntax
    const term = debouncedSearch.trim().replace(/,/g, '')

    let q = supabase
      .from('lead_submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (filterSource      !== 'all') q = q.eq('source', filterSource)
    if (filterStatus      !== 'all') q = q.eq('status', filterStatus)
    // Filter on the JSON details field using PostgREST text extraction
    if (filterVisitReason !== 'all') q = q.eq('details->>visit_reason', filterVisitReason)

    if (term) {
      q = q.or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
    }

    if (dateFrom) q = q.gte('created_at', dateFrom)
    if (dateTo)   q = q.lte('created_at', `${dateTo}T23:59:59.999Z`)

    if (filterAssigned === 'unassigned') q = q.is('assigned_to', null)
    else if (filterAssigned !== 'all')   q = q.eq('assigned_to', filterAssigned)

    const { data, error: err, count } = await q

    if (err) {
      setError(err.message)
    } else {
      setLeads(data ?? [])
      setTotalCount(count ?? 0)
    }
    setLoading(false)
  }, [page, debouncedSearch, dateFrom, dateTo, filterSource, filterStatus, filterVisitReason, filterAssigned])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function updateStatus(leadId, newStatus) {
    setUpdating(leadId)
    const { error: err } = await supabase
      .from('lead_submissions')
      .update({ status: newStatus })
      .eq('id', leadId)
    if (!err) setLeads(l => l.map(x => x.id === leadId ? { ...x, status: newStatus } : x))
    setUpdating(null)
  }

  async function handleAssign(leadId, userId) {
    const val = userId || null
    const { error: err } = await supabase
      .from('lead_submissions')
      .update({ assigned_to: val })
      .eq('id', leadId)
    if (!err) setLeads(l => l.map(x => x.id === leadId ? { ...x, assigned_to: val } : x))
  }

  function trainerName(userId) {
    if (!userId) return 'Unassigned'
    const t = trainers.find(t => t.user_id === userId)
    return t?.display_name || t?.email || 'Unknown'
  }

  async function handleExpand(leadId) {
    if (expanded === leadId) { setExpanded(null); return }
    setExpanded(leadId)
    if (notes[leadId] !== undefined) return   // already loaded
    setNotesLoading(leadId)
    const { data } = await supabase
      .from('lead_notes')
      .select('id, note_text, created_at, author_name, staff(name, color)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
    setNotes(n => ({ ...n, [leadId]: data ?? [] }))
    setNotesLoading(null)
  }

  async function handleAddNote(leadId) {
    const text = (noteText[leadId] || '').trim()
    if (!text || !myName || noteSubmitting) return
    setNoteSubmitting(leadId)
    const { data, error: err } = await supabase
      .from('lead_notes')
      .insert({ lead_id: leadId, note_text: text, author_name: myName })
      .select('id, note_text, created_at, author_name, staff(name, color)')
      .single()
    if (!err && data) {
      setNotes(n => ({ ...n, [leadId]: [data, ...(n[leadId] ?? [])] }))
      setNoteText(t => ({ ...t, [leadId]: '' }))
    }
    setNoteSubmitting(null)
  }

  function clearFilters() {
    setSearch('')
    setDebouncedSearch('')
    setDateFrom('')
    setDateTo('')
    setFilterSource('all')
    setFilterStatus('all')
    setFilterVisitReason('all')
    setFilterAssigned('all')
    setPage(0)
  }

  const anyFilter = search || filterSource !== 'all' || filterStatus !== 'all'
    || filterVisitReason !== 'all' || dateFrom || dateTo || filterAssigned !== 'all'

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const rangeStart = totalCount === 0 ? 0 : page * PAGE_SIZE + 1
  const rangeEnd   = Math.min((page + 1) * PAGE_SIZE, totalCount)

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Leads</h2>
        {!loading && totalCount > 0 && (
          <span className="text-sm text-gray-400">
            Showing {rangeStart}–{rangeEnd} of {totalCount}
          </span>
        )}
      </div>

      {/* Priority legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-4 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
        <span className="font-semibold text-gray-600">Priority:</span>
        {PRIORITY_LEGEND.map(({ color, label }) => (
          <span key={color} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color }} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm flex-shrink-0 bg-transparent border border-gray-300" />
          Standard
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <input
          type="text"
          placeholder="Search by name, email, or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {search && (
          <button
            onClick={() => { setSearch(''); setDebouncedSearch(''); setPage(0) }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500">Source</label>
          <select
            value={filterSource}
            onChange={e => { setFilterSource(e.target.value); setPage(0) }}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            {Object.entries(SOURCE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500">Status</label>
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(0) }}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500">Visit reason</label>
          <select
            value={filterVisitReason}
            onChange={e => { setFilterVisitReason(e.target.value); setPage(0) }}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            {VISIT_REASONS.map(vr => (
              <option key={vr} value={vr}>{vr}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(0) }}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(0) }}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Trainer filter — admin/fitness_manager see full dropdown; trainers get "My leads" toggle */}
        {canAssign ? (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Trainer</label>
            <select
              value={filterAssigned}
              onChange={e => { setFilterAssigned(e.target.value); setPage(0) }}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="unassigned">Unassigned</option>
              {trainers.map(t => (
                <option key={t.user_id} value={t.user_id}>
                  {t.display_name || t.email}
                </option>
              ))}
            </select>
          </div>
        ) : role === 'trainer' && currentUserId ? (
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-600">
            <input
              type="checkbox"
              checked={filterAssigned === currentUserId}
              onChange={e => { setFilterAssigned(e.target.checked ? currentUserId : 'all'); setPage(0) }}
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            My leads only
          </label>
        ) : null}

        {anyFilter && (
          <button
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 transition"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-lg mb-4">{error}</p>
      )}

      {/* Lead list */}
      {loading ? (
        <p className="text-gray-400 text-sm">Loading leads…</p>
      ) : leads.length === 0 ? (
        <p className="text-gray-400 text-sm">No leads match the current filters.</p>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="divide-y divide-gray-100">
              {leads.map(lead => {
                const isNew        = lead.status === 'new'
                const isExpanded   = expanded === lead.id
                const summary      = summaryLine(lead.source, lead.details, lead.visit_count)
                const rows         = detailRows(lead.source, lead.details)
                const srcLabel     = SOURCE_LABELS[lead.source] ?? lead.source
                const srcColor     = SOURCE_COLORS[lead.source] ?? 'bg-gray-100 text-gray-600'
                const priColor     = getPriorityColor(lead)
                const leadNotes    = notes[lead.id] ?? []

                return (
                  <div
                    key={lead.id}
                    style={{
                      borderLeft: priColor
                        ? `4px solid ${priColor}`
                        : '4px solid transparent',
                    }}
                  >
                    {/* ── Collapsed row ── */}
                    <div className={`flex items-center gap-3 px-4 py-3 ${isNew ? 'bg-blue-50/40' : ''}`}>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${srcColor}`}>
                        {srcLabel}
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

                      {lead.assigned_to && (
                        <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex-shrink-0 hidden lg:block">
                          {trainerName(lead.assigned_to)}
                        </span>
                      )}

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
                        onClick={() => handleExpand(lead.id)}
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

                    {/* ── Expanded panel ── */}
                    {isExpanded && (
                      <div className="px-4 pb-5 pt-3 border-t border-gray-100 bg-white">
                        <div className="flex flex-wrap gap-8">
                          {/* Contact block */}
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{srcLabel}</p>
                            <p className="text-sm font-medium text-gray-800">{lead.name}</p>
                            <a href={`mailto:${lead.email}`} className="text-sm text-blue-600 hover:underline block">{lead.email}</a>
                            {lead.phone && <p className="text-sm text-gray-700">{lead.phone}</p>}
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(lead.created_at).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric',
                                hour: 'numeric', minute: '2-digit',
                              })}
                            </p>
                            {lead.source === 'checkin_app' && (
                              <div className="mt-2 space-y-0.5">
                                <p className="text-xs text-gray-500">
                                  <span className="font-medium">Visits:</span> {lead.visit_count ?? 1}
                                </p>
                                {lead.last_seen && (
                                  <p className="text-xs text-gray-500">
                                    <span className="font-medium">Last seen:</span>{' '}
                                    {new Date(lead.last_seen).toLocaleDateString('en-US', {
                                      month: 'short', day: 'numeric', year: 'numeric',
                                    })}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Details block */}
                          {rows.length > 0 && (
                            <div className="flex-1 min-w-[160px]">
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Details</p>
                              <dl className="space-y-1">
                                {rows.map(([label, value]) => (
                                  <div key={label} className="flex gap-2 text-sm">
                                    <dt className="font-medium text-gray-500 flex-shrink-0">{label}:</dt>
                                    <dd className="text-gray-800">{value}</dd>
                                  </div>
                                ))}
                              </dl>
                            </div>
                          )}
                        </div>

                        {/* ── Trainer assignment ── */}
                        <div className="mt-5 pt-4 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                            Assigned Trainer
                          </p>
                          {canAssign ? (
                            <select
                              value={lead.assigned_to || ''}
                              onChange={e => handleAssign(lead.id, e.target.value)}
                              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Unassigned</option>
                              {trainers.map(t => (
                                <option key={t.user_id} value={t.user_id}>
                                  {t.display_name || t.email}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="text-sm text-gray-700">{trainerName(lead.assigned_to)}</p>
                          )}
                        </div>

                        {/* ── Trainer notes ── */}
                        <div className="mt-5 pt-4 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                            Trainer Notes
                          </p>

                          {notesLoading === lead.id ? (
                            <p className="text-xs text-gray-400">Loading notes…</p>
                          ) : leadNotes.length === 0 ? (
                            <p className="text-xs text-gray-400 mb-3">No notes yet.</p>
                          ) : (
                            <div className="space-y-3 mb-4">
                              {leadNotes.map(note => (
                                <div key={note.id}>
                                  <div className="flex items-baseline gap-2 mb-0.5">
                                    <span
                                      className="text-xs font-semibold"
                                      style={{ color: note.staff?.color || '#6b7280' }}
                                    >
                                      {note.author_name ?? note.staff?.name ?? 'Unknown'}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {new Date(note.created_at).toLocaleString('en-US', {
                                        month: 'short', day: 'numeric', year: 'numeric',
                                        hour: 'numeric', minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note_text}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {myName && (
                            <div className="flex gap-2 mt-2">
                              <textarea
                                rows={2}
                                value={noteText[lead.id] || ''}
                                onChange={e => setNoteText(t => ({ ...t, [lead.id]: e.target.value }))}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddNote(lead.id)
                                }}
                                placeholder="Add a note… (Ctrl+Enter to submit)"
                                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                onClick={() => handleAddNote(lead.id)}
                                disabled={!noteText[lead.id]?.trim() || noteSubmitting === lead.id}
                                className="bg-blue-700 hover:bg-blue-800 disabled:opacity-40 text-white text-xs font-medium px-3 py-2 rounded-lg transition self-end whitespace-nowrap"
                              >
                                {noteSubmitting === lead.id ? '…' : 'Add Note'}
                              </button>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-5">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
                className="text-sm px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-500 tabular-nums">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
                className="text-sm px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
