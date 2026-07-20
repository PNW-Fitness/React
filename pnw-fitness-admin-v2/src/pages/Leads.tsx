import { useState, useEffect, useCallback } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { usePermissions } from "../lib/PermissionsContext";
import { Lead, PAGE_SIZE, PRIORITY_LEGEND } from "../lib/leadsHelpers";
import LeadsFilterBar from "../components/leads/LeadsFilterBar";
import NewLeadForm, { NewLeadFormState } from "../components/leads/NewLeadForm";
import LeadRow, { LeadNote, Trainer } from "../components/leads/LeadRow";
import { EditFormState } from "../components/leads/LeadEditForm";

const EMPTY_NEW: NewLeadFormState = {
  name: "",
  email: "",
  phone: "",
  source: "checkin_app",
  status: "new",
  visit_reason: "",
  how_heard: "",
  zip_code: "",
  first_seen: "",
};

export default function Leads() {
  // Filters
  const [filterSource, setFilterSource] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterVisitReason, setFilterVisitReason] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Status update
  const [updating, setUpdating] = useState<string | null>(null);

  // Inline edit
  const [editingLead, setEditingLead] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    name: "", email: "", phone: "", source: "checkin_app", status: "new",
    visit_count: 1, first_seen: "", visit_reason: "", how_heard: "", interests: "", zip_code: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // New lead form
  const [showNewLead, setShowNewLead] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState<NewLeadFormState>(EMPTY_NEW);
  const [newLeadSaving, setNewLeadSaving] = useState(false);
  const [newLeadError, setNewLeadError] = useState<string | null>(null);

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Expand / notes
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, LeadNote[]>>({});
  const [notesLoading, setNotesLoading] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<Record<string, string>>({});
  const [noteSubmitting, setNoteSubmitting] = useState<string | null>(null);

  // Current user's display name (for notes) and id (for "my leads" filter)
  const [myName, setMyName] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Trainer list (for assign dropdown and filter)
  const [trainers, setTrainers] = useState<Trainer[]>([]);

  // Filter by assigned trainer
  const [filterAssigned, setFilterAssigned] = useState("all");

  // Hide test entries by default
  const [hideTest, setHideTest] = useState(true);

  const { role } = useAuth();
  const { can } = usePermissions();
  const canAssign = can("leads.edit_status");
  const canEditStatus = can("leads.edit_status");
  const canAddNotes = can("leads.notes.add");
  const canDelete = role === "admin";
  const canMarkTest = role === "admin";
  const canEditDetails = can("leads.edit_details");
  const canCreateLead = can("leads.create");

  // Resolve current user's name + id
  useEffect(() => {
    async function resolveUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);
      const { data: profile } = await supabase
        .from("admin_profiles")
        .select("display_name, email")
        .eq("user_id", user.id)
        .maybeSingle();
      setMyName(profile?.display_name || profile?.email || user.email || null);
    }
    resolveUser();
  }, []);

  // Load all users with the RBAC "Trainer" role for the assign dropdown + filter
  useEffect(() => {
    async function loadTrainers() {
      const { data: trainerRoles } = await supabase
        .from("user_roles")
        .select("user_id, roles!inner(name)")
        .eq("roles.name", "Trainer");
      const ids = (trainerRoles ?? []).map((r) => r.user_id);
      if (ids.length === 0) {
        setTrainers([]);
        return;
      }
      const { data: profiles } = await supabase
        .from("admin_profiles")
        .select("user_id, display_name, email")
        .in("user_id", ids)
        .order("display_name");
      setTrainers(profiles ?? []);
    }
    loadTrainers();
  }, []);

  // Debounce search: also resets page so filter change is clean
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Main data fetch — re-runs whenever any filter or page changes
  const fetchLeads = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      // Wait until role is resolved. For trainers, also wait for their user ID
      // so we never accidentally show them the full unfiltered list.
      if (role === undefined) return;
      if (role === "trainer" && !currentUserId) return;

      if (!silent) setLoading(true);
      setError(null);

      // Sanitise search term — strip commas which break PostgREST .or() syntax
      const term = debouncedSearch.trim().replace(/,/g, "");

      let q = supabase
        .from("lead_submissions")
        .select("*, lead_notes!left(id)", { count: "exact" })
        .order("last_seen", { ascending: false, nullsFirst: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (hideTest) {
        q = q.or("is_test.eq.false,is_test.is.null");
      } else {
        q = q.eq("is_test", true);
      }

      if (filterSource !== "all") q = q.eq("source", filterSource);
      if (filterStatus !== "all") q = q.eq("status", filterStatus);
      if (filterVisitReason !== "all") q = q.eq("details->>visit_reason", filterVisitReason);

      if (term) {
        q = q.or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
      }

      if (dateFrom) q = q.gte("created_at", dateFrom);
      if (dateTo) q = q.lte("created_at", `${dateTo}T23:59:59.999Z`);

      // Trainers are locked to their own assigned leads — not a UI option.
      // Admins and fitness managers use the optional filterAssigned dropdown.
      if (role === "trainer") {
        q = q.eq("assigned_to", currentUserId);
      } else {
        if (filterAssigned === "unassigned") q = q.is("assigned_to", null);
        else if (filterAssigned !== "all") q = q.eq("assigned_to", filterAssigned);
      }

      const { data, error: err, count } = await q;

      if (err) {
        setError(err.message);
      } else {
        setLeads(data ?? []);
        setTotalCount(count ?? 0);
        setLastUpdated(new Date());
      }
      setLoading(false);
    },
    [page, debouncedSearch, dateFrom, dateTo, filterSource, filterStatus, filterVisitReason, filterAssigned, hideTest, role, currentUserId]
  );

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Auto-refresh every 30 seconds without showing the loading spinner
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeads({ silent: true });
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function updateStatus(leadId: string, newStatus: string) {
    setUpdating(leadId);
    const { error: err } = await supabase.from("lead_submissions").update({ status: newStatus }).eq("id", leadId);
    if (!err) setLeads((l) => l.map((x) => (x.id === leadId ? { ...x, status: newStatus } : x)));
    setUpdating(null);
  }

  async function handleLogVisit(lead: Lead) {
    const now = new Date().toISOString();
    const { error: err } = await supabase
      .from("lead_submissions")
      .update({ visit_count: (lead.visit_count ?? 1) + 1, last_seen: now })
      .eq("id", lead.id);
    if (!err) {
      // Re-fetch so the updated lead bubbles to the top of the list (sorted by last_seen DESC)
      setExpanded(null);
      fetchLeads({ silent: true });
    }
  }

  async function handleAssign(leadId: string, userId: string) {
    const val = userId || null;
    const { error: err } = await supabase.from("lead_submissions").update({ assigned_to: val }).eq("id", leadId);
    if (!err) {
      setLeads((l) => l.map((x) => (x.id === leadId ? { ...x, assigned_to: val } : x)));
      if (val) {
        const lead = leads.find((x) => x.id === leadId);
        const { error: notifyErr } = await supabase.from("notifications").insert({
          user_id: val,
          lead_id: leadId,
          message: `You were assigned a new lead: ${lead?.name ?? "a guest"}`,
        });
        if (notifyErr) console.error("Failed to create assignment notification:", notifyErr.message);
      }
    }
  }

  function trainerName(userId: string | null) {
    if (!userId) return "Unassigned";
    const t = trainers.find((t) => t.user_id === userId);
    return t?.display_name || t?.email || "Unknown";
  }

  async function handleExpand(leadId: string) {
    if (expanded === leadId) {
      setExpanded(null);
      setEditingLead(null);
      return;
    }
    setExpanded(leadId);
    if (notes[leadId] !== undefined) return; // already loaded
    setNotesLoading(leadId);
    const { data } = await supabase
      .from("lead_notes")
      .select("id, note_text, created_at, author_name, staff(name, color)")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    setNotes((n) => ({ ...n, [leadId]: (data ?? []) as unknown as LeadNote[] }));
    setNotesLoading(null);
  }

  function handleStartEdit(lead: Lead) {
    setEditingLead(lead.id);
    setEditError(null);
    setEditForm({
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      source: lead.source || "checkin_app",
      status: lead.status || "new",
      visit_count: lead.visit_count ?? 1,
      first_seen: lead.first_seen ? lead.first_seen.slice(0, 16) : "",
      visit_reason: lead.details?.visit_reason || "",
      how_heard: lead.details?.how_heard || "",
      interests: lead.details?.interests || "",
      zip_code: lead.details?.zip_code || "",
    });
  }

  async function handleEditSave(lead: Lead) {
    setEditSaving(true);
    setEditError(null);
    const details = {
      ...(lead.details || {}),
      visit_reason: editForm.visit_reason,
      how_heard: editForm.how_heard,
      interests: editForm.interests,
      zip_code: editForm.zip_code,
    };
    const updates = {
      name: editForm.name.trim(),
      email: editForm.email.trim() || null,
      phone: editForm.phone.trim() || null,
      source: editForm.source,
      status: editForm.status,
      visit_count: parseInt(String(editForm.visit_count)) || 1,
      first_seen: editForm.first_seen ? new Date(editForm.first_seen).toISOString() : lead.first_seen,
      details,
    };
    const { error: err } = await supabase.from("lead_submissions").update(updates).eq("id", lead.id);
    if (err) {
      setEditError(err.message);
    } else {
      setLeads((l) => l.map((x) => (x.id === lead.id ? { ...x, ...updates } : x)));
      setEditingLead(null);
    }
    setEditSaving(false);
  }

  async function handleNewLeadSave() {
    if (!newLeadForm.name.trim()) {
      setNewLeadError("Name is required.");
      return;
    }
    if (!newLeadForm.email.trim() && !newLeadForm.phone.trim()) {
      setNewLeadError("At least one contact method (email or phone) is required.");
      return;
    }
    setNewLeadSaving(true);
    setNewLeadError(null);
    const ts = newLeadForm.first_seen ? new Date(newLeadForm.first_seen).toISOString() : new Date().toISOString();
    const details =
      newLeadForm.source === "checkin_app"
        ? {
            visit_reason: newLeadForm.visit_reason,
            how_heard: newLeadForm.how_heard,
            zip_code: newLeadForm.zip_code,
          }
        : {};
    const { error: err } = await supabase.from("lead_submissions").insert({
      name: newLeadForm.name.trim(),
      email: newLeadForm.email.trim() || null,
      phone: newLeadForm.phone.trim() || null,
      source: newLeadForm.source,
      status: newLeadForm.status,
      details,
      visit_count: 1,
      first_seen: ts,
      last_seen: ts,
      created_at: ts,
    });
    if (err) {
      setNewLeadError(err.message);
    } else {
      setShowNewLead(false);
      setNewLeadForm(EMPTY_NEW);
      setPage(0);
      fetchLeads();
    }
    setNewLeadSaving(false);
  }

  async function handleAddNote(leadId: string) {
    const text = (noteText[leadId] || "").trim();
    if (!text || !myName || noteSubmitting) return;
    setNoteSubmitting(leadId);
    const { data, error: err } = await supabase
      .from("lead_notes")
      .insert({ lead_id: leadId, note_text: text, author_name: myName })
      .select("id, note_text, created_at, author_name, staff(name, color)")
      .single();
    if (!err && data) {
      const newNote = data as unknown as LeadNote;
      setNotes((n) => ({ ...n, [leadId]: [newNote, ...(n[leadId] ?? [])] }));
      setNoteText((t) => ({ ...t, [leadId]: "" }));
      setLeads((l) =>
        l.map((x) => (x.id === leadId ? { ...x, lead_notes: [...(x.lead_notes ?? []), { id: data.id }] } : x))
      );
    }
    setNoteSubmitting(null);
  }

  async function handleToggleTest(lead: Lead) {
    const next = !lead.is_test;
    const { error: err } = await supabase.from("lead_submissions").update({ is_test: next }).eq("id", lead.id);
    if (!err) {
      if (hideTest && next) {
        setLeads((l) => l.filter((x) => x.id !== lead.id));
        setTotalCount((c) => c - 1);
        setExpanded(null);
      } else {
        setLeads((l) => l.map((x) => (x.id === lead.id ? { ...x, is_test: next } : x)));
      }
    }
  }

  async function handleDelete(leadId: string) {
    const { error: err } = await supabase.from("lead_submissions").delete().eq("id", leadId);
    if (!err) {
      setLeads((l) => l.filter((x) => x.id !== leadId));
      setExpanded(null);
      setConfirmDelete(null);
      setTotalCount((c) => c - 1);
    }
  }

  function clearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setDateFrom("");
    setDateTo("");
    setFilterSource("all");
    setFilterStatus("all");
    setFilterVisitReason("all");
    setFilterAssigned("all");
    setHideTest(true);
    setPage(0);
  }

  const anyFilter = Boolean(
    search || filterSource !== "all" || filterStatus !== "all" || filterVisitReason !== "all" || dateFrom || dateTo || filterAssigned !== "all" || !hideTest
  );

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const rangeStart = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd = Math.min((page + 1) * PAGE_SIZE, totalCount);

  return (
    <div>
      <PageMeta title="Leads | PNW Fitness Admin" description="" />
      <PageBreadcrumb pageTitle="Leads" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400" title={lastUpdated.toLocaleTimeString()}>
              Updated {lastUpdated.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
          )}
          {!loading && totalCount > 0 && (
            <span className="text-sm text-gray-400">
              Showing {rangeStart}–{rangeEnd} of {totalCount}
            </span>
          )}
        </div>
        {canCreateLead && (
          <Button
            size="sm"
            onClick={() => {
              setShowNewLead((v) => !v);
              setNewLeadError(null);
            }}
          >
            {showNewLead ? "Cancel" : "+ Add Lead"}
          </Button>
        )}
      </div>

      {showNewLead && canCreateLead && (
        <NewLeadForm
          form={newLeadForm}
          onChange={setNewLeadForm}
          onSave={handleNewLeadSave}
          onCancel={() => {
            setShowNewLead(false);
            setNewLeadError(null);
          }}
          saving={newLeadSaving}
          error={newLeadError}
        />
      )}

      {/* Priority legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-800">
        <span className="font-semibold text-gray-600 dark:text-gray-300">Priority:</span>
        {PRIORITY_LEGEND.map(({ color, label }) => (
          <span key={color} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color }} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm flex-shrink-0 bg-transparent border border-gray-300 dark:border-gray-700" />
          Standard
        </span>
      </div>

      <LeadsFilterBar
        search={search}
        onSearchChange={(v) => setSearch(v)}
        filterSource={filterSource}
        onFilterSourceChange={(v) => { setFilterSource(v); setPage(0); }}
        filterStatus={filterStatus}
        onFilterStatusChange={(v) => { setFilterStatus(v); setPage(0); }}
        filterVisitReason={filterVisitReason}
        onFilterVisitReasonChange={(v) => { setFilterVisitReason(v); setPage(0); }}
        dateFrom={dateFrom}
        onDateFromChange={(v) => { setDateFrom(v); setPage(0); }}
        dateTo={dateTo}
        onDateToChange={(v) => { setDateTo(v); setPage(0); }}
        canAssign={canAssign}
        filterAssigned={filterAssigned}
        onFilterAssignedChange={(v) => { setFilterAssigned(v); setPage(0); }}
        trainers={trainers}
        canMarkTest={canMarkTest}
        hideTest={hideTest}
        onHideTestChange={(v) => { setHideTest(v); setPage(0); }}
        anyFilter={anyFilter}
        onClearFilters={clearFilters}
      />

      {error && (
        <p className="text-error-600 dark:text-error-400 text-sm bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/30 px-4 py-3 rounded-lg mb-4">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading leads…</p>
      ) : leads.length === 0 ? (
        <p className="text-gray-400 text-sm">No leads match the current filters.</p>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {leads.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  isExpanded={expanded === lead.id}
                  onToggleExpand={() => handleExpand(lead.id)}
                  trainerName={trainerName}
                  trainers={trainers}
                  canAssign={canAssign}
                  canEditStatus={canEditStatus}
                  canAddNotes={canAddNotes}
                  canDelete={canDelete}
                  canMarkTest={canMarkTest}
                  canEditDetails={canEditDetails}
                  myName={myName}
                  updating={updating === lead.id}
                  onUpdateStatus={(status) => updateStatus(lead.id, status)}
                  onLogVisit={() => handleLogVisit(lead)}
                  onAssign={(userId) => handleAssign(lead.id, userId)}
                  isEditing={editingLead === lead.id}
                  editForm={editForm}
                  onEditFormChange={setEditForm}
                  onStartEdit={() => handleStartEdit(lead)}
                  onEditSave={() => handleEditSave(lead)}
                  onEditCancel={() => setEditingLead(null)}
                  editSaving={editSaving}
                  editError={editError}
                  notes={notes[lead.id] ?? []}
                  notesLoading={notesLoading === lead.id}
                  noteText={noteText[lead.id] || ""}
                  onNoteTextChange={(text) => setNoteText((t) => ({ ...t, [lead.id]: text }))}
                  onAddNote={() => handleAddNote(lead.id)}
                  noteSubmitting={noteSubmitting === lead.id}
                  onToggleTest={() => handleToggleTest(lead)}
                  confirmDelete={confirmDelete === lead.id}
                  onConfirmDeleteToggle={(confirm) => setConfirmDelete(confirm ? lead.id : null)}
                  onDelete={() => handleDelete(lead.id)}
                />
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-5">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                className="text-sm px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                className="text-sm px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
