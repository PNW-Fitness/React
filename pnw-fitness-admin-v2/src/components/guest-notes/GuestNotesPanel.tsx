import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { usePermissions } from "../../lib/PermissionsContext";
import Input from "../form/input/InputField";
import TrialPassControl from "../common/TrialPassControl";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  created_at: string;
  last_seen: string | null;
  visit_count: number;
  details: { visit_reason?: string } | null;
  trial_pass: boolean;
  trial_end_date: string | null;
}

interface LeadNote {
  id: string;
  note_text: string;
  created_at: string;
  author_name: string | null;
}

function formatTime(ts: string | null) {
  if (!ts) return null;
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDate(ts: string | null) {
  if (!ts) return null;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function GuestNotesPanel() {
  const [todayLeads, setTodayLeads] = useState<Lead[]>([]);
  const [todayLoading, setTodayLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [searching, setSearching] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, LeadNote[]>>({});
  const [notesLoading, setNotesLoading] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [myName, setMyName] = useState<string | null>(null);
  const [submitMsg, setSubmitMsg] = useState<Record<string, "saved" | "error" | null>>({});
  const [loggingVisit, setLoggingVisit] = useState<string | null>(null);

  const { can } = usePermissions();
  const canManageTrialPass = can("leads.trial_pass.manage");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Keeps today's list and search results consistent after a write, since
  // a guest can appear in either (or both) depending on what's active.
  function patchLead(id: string, patch: Partial<Lead>) {
    setTodayLeads((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    setSearchResults((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  async function handleTrialPassChange(leadId: string, trialPass: boolean, trialEndDate: string | null) {
    const { error } = await supabase
      .from("lead_submissions")
      .update({ trial_pass: trialPass, trial_end_date: trialEndDate })
      .eq("id", leadId);
    if (!error) patchLead(leadId, { trial_pass: trialPass, trial_end_date: trialEndDate });
  }

  // Resolve the current user's display name for note authorship
  useEffect(() => {
    async function resolveUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("admin_profiles")
        .select("display_name, email")
        .eq("user_id", user.id)
        .maybeSingle();
      setMyName(profile?.display_name || profile?.email || user.email || "Front Desk");
    }
    resolveUser();
  }, []);

  async function fetchToday() {
    setTodayLoading(true);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("lead_submissions")
      .select("id, name, email, phone, source, created_at, last_seen, visit_count, details, trial_pass, trial_end_date")
      .gte("last_seen", todayStart.toISOString())
      .or("is_test.eq.false,is_test.is.null")
      .order("last_seen", { ascending: false });

    setTodayLeads(data ?? []);
    setTodayLoading(false);
  }

  // Load today's check-ins on mount
  useEffect(() => {
    fetchToday();
  }, []);

  // Debounced search — only runs when search has content
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const term = search.trim().replace(/,/g, "");
      const { data } = await supabase
        .from("lead_submissions")
        .select("id, name, email, phone, source, created_at, last_seen, visit_count, details, trial_pass, trial_end_date")
        .or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
        .or("is_test.eq.false,is_test.is.null")
        .order("last_seen", { ascending: false, nullsFirst: false })
        .limit(15);
      setSearchResults(data ?? []);
      setSearching(false);
    }, 300);
  }, [search]);

  async function handleLogVisit(lead: Lead) {
    setLoggingVisit(lead.id);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("lead_submissions")
      .update({ visit_count: (lead.visit_count ?? 1) + 1, last_seen: now })
      .eq("id", lead.id);
    setLoggingVisit(null);
    if (!error) {
      setExpanded(null);
      fetchToday();
    }
  }

  async function handleExpand(leadId: string) {
    if (expanded === leadId) {
      setExpanded(null);
      return;
    }
    setExpanded(leadId);
    if (notes[leadId] !== undefined) return;
    setNotesLoading(leadId);
    const { data } = await supabase
      .from("lead_notes")
      .select("id, note_text, created_at, author_name")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    setNotes((n) => ({ ...n, [leadId]: data ?? [] }));
    setNotesLoading(null);
  }

  async function handleAddNote(leadId: string) {
    const text = (noteText[leadId] || "").trim();
    if (!text || !myName || submitting) return;
    setSubmitting(leadId);
    setSubmitMsg((m) => ({ ...m, [leadId]: null }));

    const { data, error } = await supabase
      .from("lead_notes")
      .insert({ lead_id: leadId, note_text: text, author_name: myName })
      .select("id, note_text, created_at, author_name")
      .single();

    if (error) {
      setSubmitMsg((m) => ({ ...m, [leadId]: "error" }));
    } else {
      setNotes((n) => ({ ...n, [leadId]: [data, ...(n[leadId] ?? [])] }));
      setNoteText((t) => ({ ...t, [leadId]: "" }));
      setSubmitMsg((m) => ({ ...m, [leadId]: "saved" }));
      setTimeout(() => setSubmitMsg((m) => ({ ...m, [leadId]: null })), 2000);
    }
    setSubmitting(null);
  }

  const isSearching = search.trim().length > 0;
  const displayList = isSearching ? searchResults : todayLeads;

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-baseline justify-between mb-1">
        {!isSearching && !todayLoading && (
          <span className="text-sm text-gray-400">
            {todayLeads.length} {todayLeads.length === 1 ? "guest" : "guests"} today
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        {isSearching ? "Search results" : todayLabel}
      </p>

      {/* Search */}
      <div className="relative mb-5">
        <Input
          type="text"
          placeholder="Search all guests by name, email, or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
        {search && (
          <button
            onClick={() => {
              setSearch("");
              setSearchResults([]);
              setExpanded(null);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Loading / empty states */}
      {!isSearching && todayLoading && (
        <p className="text-sm text-gray-400 text-center py-8">Loading today's check-ins…</p>
      )}
      {!isSearching && !todayLoading && todayLeads.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🏋️</p>
          <p className="text-sm font-medium">No check-ins yet today</p>
          <p className="text-xs mt-1">Guests will appear here as they check in.</p>
        </div>
      )}
      {isSearching && searching && (
        <p className="text-sm text-gray-400 text-center py-8">Searching…</p>
      )}
      {isSearching && !searching && searchResults.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">No guests found for "{search}".</p>
      )}

      {/* Guest list */}
      {displayList.length > 0 && (
        <div className="space-y-2">
          {displayList.map((lead) => {
            const isOpen = expanded === lead.id;
            const leadNotes = notes[lead.id] ?? [];
            const checkinTime = lead.last_seen ? formatTime(lead.last_seen) : null;
            const checkinDate = lead.last_seen ? formatDate(lead.last_seen) : null;

            return (
              <div
                key={lead.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <button
                  className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/[0.02] transition"
                  onClick={() => handleExpand(lead.id)}
                >
                  {/* Initials avatar — TailAdmin's Avatar component requires an
                      image src and has no initials mode, so a plain circle is
                      used here instead (see build notes). */}
                  <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 font-bold text-sm flex items-center justify-center flex-shrink-0 uppercase">
                    {lead.name?.charAt(0) || "?"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-white/90 text-sm">{lead.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {lead.phone || lead.email || "—"}
                      {lead.visit_count > 1 ? ` · ${lead.visit_count} visits` : ""}
                    </p>
                    {lead.details?.visit_reason && (
                      <p className="text-xs text-brand-600 dark:text-brand-400 truncate mt-0.5">
                        {lead.details.visit_reason}
                      </p>
                    )}
                  </div>

                  {/* Check-in time (today view) or date (search view) */}
                  <div className="text-right flex-shrink-0">
                    {!isSearching && checkinTime && (
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{checkinTime}</p>
                    )}
                    {isSearching && checkinDate && (
                      <p className="text-xs text-gray-400">{checkinDate}</p>
                    )}
                    {notes[lead.id] !== undefined && leadNotes.length > 0 && (
                      <span className="text-xs text-warning-600 dark:text-warning-400">
                        {leadNotes.length} {leadNotes.length === 1 ? "note" : "notes"}
                      </span>
                    )}
                  </div>

                  <svg
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded notes panel */}
                {isOpen && (
                  <div className="px-4 pb-5 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Trial Pass</p>
                      <TrialPassControl
                        leadId={lead.id}
                        trialPass={lead.trial_pass}
                        trialEndDate={lead.trial_end_date}
                        canManage={canManageTrialPass}
                        onChange={(trialPass, trialEndDate) => handleTrialPassChange(lead.id, trialPass, trialEndDate)}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Notes</p>
                        {lead.details?.visit_reason && (
                          <span className="text-xs bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300 px-2 py-0.5 rounded-full">
                            {lead.details.visit_reason}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleLogVisit(lead)}
                        disabled={loggingVisit === lead.id}
                        className="text-xs font-medium bg-success-600 hover:bg-success-700 disabled:opacity-50 text-white px-3 py-1 rounded-lg transition flex-shrink-0"
                      >
                        {loggingVisit === lead.id ? "…" : "+ Log Visit"}
                      </button>
                    </div>

                    {notesLoading === lead.id ? (
                      <p className="text-xs text-gray-400 mb-3">Loading…</p>
                    ) : leadNotes.length === 0 ? (
                      <p className="text-xs text-gray-400 mb-3">No notes yet.</p>
                    ) : (
                      <div className="space-y-3 mb-4">
                        {leadNotes.map((note) => (
                          <div key={note.id} className="bg-gray-50 dark:bg-white/[0.03] rounded-lg px-3 py-2">
                            <div className="flex items-baseline gap-2 mb-0.5">
                              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {note.author_name || "Unknown"}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(note.created_at).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {note.note_text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 mt-2">
                      <textarea
                        rows={2}
                        value={noteText[lead.id] || ""}
                        onChange={(e) => setNoteText((t) => ({ ...t, [lead.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAddNote(lead.id);
                        }}
                        placeholder="Add a note… (Ctrl+Enter to submit)"
                        className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white/90 resize-none shadow-theme-xs focus:outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:focus:border-brand-800"
                      />
                      <div className="flex flex-col gap-1 justify-end">
                        <button
                          onClick={() => handleAddNote(lead.id)}
                          disabled={!noteText[lead.id]?.trim() || submitting === lead.id}
                          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-xs font-medium px-4 py-2 rounded-lg transition whitespace-nowrap"
                        >
                          {submitting === lead.id ? "…" : "Add Note"}
                        </button>
                        {submitMsg[lead.id] === "saved" && (
                          <p className="text-xs text-success-600 dark:text-success-400 text-center">Saved ✓</p>
                        )}
                        {submitMsg[lead.id] === "error" && (
                          <p className="text-xs text-error-500 text-center">Error</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
