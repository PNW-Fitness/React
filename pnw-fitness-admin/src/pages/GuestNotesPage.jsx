import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

export default function GuestNotesPage() {
  const [search,        setSearch]        = useState('')
  const [results,       setResults]       = useState([])
  const [searching,     setSearching]     = useState(false)
  const [expanded,      setExpanded]      = useState(null)
  const [notes,         setNotes]         = useState({})
  const [notesLoading,  setNotesLoading]  = useState(null)
  const [noteText,      setNoteText]      = useState({})
  const [submitting,    setSubmitting]    = useState(null)
  const [myName,        setMyName]        = useState(null)
  const [submitMsg,     setSubmitMsg]     = useState({}) // { leadId: 'saved' | 'error' }

  const debounceRef = useRef(null)

  // Resolve the current user's display name for note authorship
  useEffect(() => {
    async function resolveUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('display_name, email')
        .eq('user_id', user.id)
        .maybeSingle()
      setMyName(profile?.display_name || profile?.email || user.email || 'Front Desk')
    }
    resolveUser()
  }, [])

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!search.trim()) { setResults([]); setExpanded(null); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const term = search.trim().replace(/,/g, '')
      const { data } = await supabase
        .from('lead_submissions')
        .select('id, name, email, phone, source, created_at, last_seen, visit_count')
        .or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
        .order('last_seen', { ascending: false, nullsFirst: false })
        .limit(15)
      setResults(data ?? [])
      setSearching(false)
    }, 300)
  }, [search])

  async function handleExpand(leadId) {
    if (expanded === leadId) { setExpanded(null); return }
    setExpanded(leadId)
    if (notes[leadId] !== undefined) return
    setNotesLoading(leadId)
    const { data } = await supabase
      .from('lead_notes')
      .select('id, note_text, created_at, author_name')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
    setNotes(n => ({ ...n, [leadId]: data ?? [] }))
    setNotesLoading(null)
  }

  async function handleAddNote(leadId) {
    const text = (noteText[leadId] || '').trim()
    if (!text || !myName || submitting) return
    setSubmitting(leadId)
    setSubmitMsg(m => ({ ...m, [leadId]: null }))

    const { data, error } = await supabase
      .from('lead_notes')
      .insert({ lead_id: leadId, note_text: text, author_name: myName })
      .select('id, note_text, created_at, author_name')
      .single()

    if (error) {
      setSubmitMsg(m => ({ ...m, [leadId]: 'error' }))
    } else {
      setNotes(n => ({ ...n, [leadId]: [data, ...(n[leadId] ?? [])] }))
      setNoteText(t => ({ ...t, [leadId]: '' }))
      setSubmitMsg(m => ({ ...m, [leadId]: 'saved' }))
      setTimeout(() => setSubmitMsg(m => ({ ...m, [leadId]: null })), 2000)
    }
    setSubmitting(null)
  }

  function formatDate(ts) {
    if (!ts) return null
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Guest Notes</h2>
        <p className="text-sm text-gray-500 mb-5">
          Search for a guest and leave a note visible to trainers.
        </p>

        {/* Search */}
        <div className="relative mb-6">
          <input
            type="text"
            autoFocus
            placeholder="Search guest by name, email, or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setResults([]); setExpanded(null) }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* State messages */}
        {searching && (
          <p className="text-sm text-gray-400 text-center py-6">Searching…</p>
        )}
        {!searching && search.trim() && results.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No guests found for "{search}".</p>
        )}
        {!search.trim() && (
          <p className="text-sm text-gray-400 text-center py-10">
            Type a name, email, or phone number to find a guest.
          </p>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map(lead => {
              const isOpen = expanded === lead.id
              const leadNotes = notes[lead.id] ?? []

              return (
                <div key={lead.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Guest row */}
                  <button
                    className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-gray-50 transition"
                    onClick={() => handleExpand(lead.id)}
                  >
                    {/* Avatar initial */}
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {lead.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">{lead.name}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {lead.email}
                        {lead.phone ? ` · ${lead.phone}` : ''}
                        {lead.last_seen ? ` · Last seen ${formatDate(lead.last_seen)}` : lead.created_at ? ` · Added ${formatDate(lead.created_at)}` : ''}
                      </p>
                    </div>

                    {lead.visit_count > 1 && (
                      <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full flex-shrink-0">
                        {lead.visit_count} visits
                      </span>
                    )}

                    {/* Note count badge */}
                    {notes[lead.id] !== undefined && leadNotes.length > 0 && (
                      <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full flex-shrink-0">
                        {leadNotes.length} {leadNotes.length === 1 ? 'note' : 'notes'}
                      </span>
                    )}

                    <svg
                      className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded notes panel */}
                  {isOpen && (
                    <div className="px-4 pb-5 pt-3 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                        Guest Notes
                      </p>

                      {notesLoading === lead.id ? (
                        <p className="text-xs text-gray-400 mb-3">Loading notes…</p>
                      ) : leadNotes.length === 0 ? (
                        <p className="text-xs text-gray-400 mb-3">No notes yet — be the first to add one.</p>
                      ) : (
                        <div className="space-y-3 mb-4">
                          {leadNotes.map(note => (
                            <div key={note.id} className="bg-gray-50 rounded-lg px-3 py-2">
                              <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-xs font-semibold text-gray-700">
                                  {note.author_name || 'Unknown'}
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

                      {/* Add note */}
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
                        <div className="flex flex-col gap-1 justify-end">
                          <button
                            onClick={() => handleAddNote(lead.id)}
                            disabled={!noteText[lead.id]?.trim() || submitting === lead.id}
                            className="bg-blue-700 hover:bg-blue-800 disabled:opacity-40 text-white text-xs font-medium px-4 py-2 rounded-lg transition whitespace-nowrap"
                          >
                            {submitting === lead.id ? '…' : 'Add Note'}
                          </button>
                          {submitMsg[lead.id] === 'saved' && (
                            <p className="text-xs text-green-600 text-center">Saved ✓</p>
                          )}
                          {submitMsg[lead.id] === 'error' && (
                            <p className="text-xs text-red-500 text-center">Error</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
