import { SOURCE_LABELS } from "../../lib/sourceLabels";
import {
  Lead,
  SOURCE_COLORS,
  STATUS_OPTIONS,
  STATUS_LABELS,
  statusCls,
  statusSelectCls,
  getPriorityColor,
  summaryLine,
  detailRows,
  SELECT_CLS,
} from "../../lib/leadsHelpers";
import LeadEditForm, { EditFormState } from "./LeadEditForm";
import TrialPassControl from "../common/TrialPassControl";

export interface LeadNote {
  id: string;
  note_text: string;
  created_at: string;
  author_name: string | null;
  staff?: { name: string; color: string } | null;
}

export interface Trainer {
  user_id: string;
  display_name: string | null;
  email: string;
}

interface LeadRowProps {
  lead: Lead;
  isExpanded: boolean;
  onToggleExpand: () => void;
  trainerName: (userId: string | null) => string;
  trainers: Trainer[];

  canAssign: boolean;
  canEditStatus: boolean;
  canAddNotes: boolean;
  canDelete: boolean;
  canMarkTest: boolean;
  canEditDetails: boolean;
  canManageTrialPass: boolean;
  onTrialPassChange: (trialPass: boolean, trialEndDate: string | null) => void;
  myName: string | null;

  updating: boolean;
  onUpdateStatus: (newStatus: string) => void;
  onLogVisit: () => void;
  onAssign: (userId: string) => void;

  isEditing: boolean;
  editForm: EditFormState;
  onEditFormChange: (form: EditFormState) => void;
  onStartEdit: () => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  editSaving: boolean;
  editError: string | null;

  notes: LeadNote[];
  notesLoading: boolean;
  noteText: string;
  onNoteTextChange: (text: string) => void;
  onAddNote: () => void;
  noteSubmitting: boolean;

  onToggleTest: () => void;

  confirmDelete: boolean;
  onConfirmDeleteToggle: (confirm: boolean) => void;
  onDelete: () => void;
}

export default function LeadRow({
  lead,
  isExpanded,
  onToggleExpand,
  trainerName,
  trainers,
  canAssign,
  canEditStatus,
  canAddNotes,
  canDelete,
  canMarkTest,
  canEditDetails,
  canManageTrialPass,
  onTrialPassChange,
  myName,
  updating,
  onUpdateStatus,
  onLogVisit,
  onAssign,
  isEditing,
  editForm,
  onEditFormChange,
  onStartEdit,
  onEditSave,
  onEditCancel,
  editSaving,
  editError,
  notes,
  notesLoading,
  noteText,
  onNoteTextChange,
  onAddNote,
  noteSubmitting,
  onToggleTest,
  confirmDelete,
  onConfirmDeleteToggle,
  onDelete,
}: LeadRowProps) {
  const isNew = lead.status === "new";
  const summary = summaryLine(lead.source, lead.details, lead.visit_count);
  const rows = detailRows(lead.source, lead.details);
  const srcLabel = SOURCE_LABELS[lead.source as keyof typeof SOURCE_LABELS] ?? lead.source;
  const srcColor = SOURCE_COLORS[lead.source] ?? "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400";
  const priColor = getPriorityColor(lead);
  const noteCount = lead.lead_notes?.length ?? 0;

  return (
    <div style={{ borderLeft: priColor ? `4px solid ${priColor}` : "4px solid transparent" }}>
      {/* Collapsed row */}
      <div
        className={`flex items-center gap-3 px-4 py-3 min-w-0 ${isNew ? "bg-blue-light-50/40 dark:bg-blue-light-500/5" : ""}`}
      >
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${srcColor}`}>{srcLabel}</span>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm truncate flex items-center gap-1.5 ${
              isNew ? "font-semibold text-gray-900 dark:text-white/90" : "font-medium text-gray-700 dark:text-gray-300"
            }`}
          >
            {isNew && <span className="inline-block w-2 h-2 bg-blue-light-500 rounded-full flex-shrink-0" />}
            {lead.name}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {lead.email}
            {summary ? ` · ${summary}` : ""}
          </p>
        </div>

        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 hidden sm:block w-24 text-right">
          {lead.phone || "—"}
        </span>

        {lead.assigned_to && (
          <span className="text-xs text-success-700 bg-success-50 border border-success-200 dark:bg-success-500/10 dark:border-success-500/30 dark:text-success-400 px-2 py-0.5 rounded-full flex-shrink-0 hidden xl:block">
            {trainerName(lead.assigned_to)}
          </span>
        )}

        <span className="text-xs text-gray-400 flex-shrink-0 hidden lg:block w-28 text-right">
          {new Date(lead.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>

        {noteCount > 0 && (
          <span
            className="text-xs text-warning-600 dark:text-warning-400 font-medium flex-shrink-0 flex items-center gap-0.5"
            title={`${noteCount} note${noteCount === 1 ? "" : "s"}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            {noteCount}
          </span>
        )}

        {canEditStatus ? (
          <select
            value={lead.status}
            disabled={updating}
            onChange={(e) => onUpdateStatus(e.target.value)}
            className={`text-xs font-medium border rounded-lg px-2 py-1 focus:outline-hidden focus:ring-2 focus:ring-brand-500 flex-shrink-0 cursor-pointer disabled:opacity-50 ${statusSelectCls(lead.status)}`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        ) : (
          <span className={`text-xs font-medium border rounded-lg px-2 py-1 flex-shrink-0 ${statusCls(lead.status)}`}>
            {STATUS_LABELS[lead.status] ?? lead.status}
          </span>
        )}

        <button
          onClick={onToggleExpand}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 transition"
          aria-label={isExpanded ? "Collapse" : "Expand details"}
        >
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="px-4 pb-5 pt-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-white/[0.02]">
          {isEditing ? (
            <LeadEditForm
              form={editForm}
              onChange={onEditFormChange}
              onSave={onEditSave}
              onCancel={onEditCancel}
              saving={editSaving}
              error={editError}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
              {/* Contact block */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{srcLabel}</p>
                  {canEditDetails && (
                    <button
                      onClick={onStartEdit}
                      className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-800 border border-brand-200 dark:border-brand-500/30 hover:border-brand-400 px-2 py-0.5 rounded-lg transition"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{lead.name}</p>
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="text-sm text-brand-600 dark:text-brand-400 hover:underline block">
                    {lead.email}
                  </a>
                )}
                {lead.phone && <p className="text-sm text-gray-700 dark:text-gray-300">{lead.phone}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(lead.created_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
                <div className="mt-2 space-y-0.5">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Visits:</span> {lead.visit_count ?? 1}
                  </p>
                  {lead.last_seen && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Last seen:</span>{" "}
                      {new Date(lead.last_seen).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  )}
                </div>
                {canEditStatus && (
                  <button
                    onClick={onLogVisit}
                    className="mt-3 text-xs font-medium bg-success-600 hover:bg-success-700 text-white px-3 py-1.5 rounded-lg transition"
                  >
                    + Log Visit
                  </button>
                )}
              </div>

              {/* Details block */}
              {rows.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Details</p>
                  <dl className="space-y-1">
                    {rows.map(([label, value]) => (
                      <div key={label} className="flex gap-2 text-sm">
                        <dt className="font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">{label}:</dt>
                        <dd className="text-gray-800 dark:text-gray-200">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          )}

          {/* Trainer assignment */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Assigned Trainer</p>
            {canAssign ? (
              <select value={lead.assigned_to || ""} onChange={(e) => onAssign(e.target.value)} className={SELECT_CLS}>
                <option value="">Unassigned</option>
                {trainers.map((t) => (
                  <option key={t.user_id} value={t.user_id}>
                    {t.display_name || t.email}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300">{trainerName(lead.assigned_to)}</p>
            )}
          </div>

          {/* Trial pass */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Trial Pass</p>
            <TrialPassControl
              trialPass={lead.trial_pass}
              trialEndDate={lead.trial_end_date}
              canManage={canManageTrialPass}
              onChange={onTrialPassChange}
            />
          </div>

          {/* Trainer notes */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Guest Notes</p>
                {lead.source === "checkin_app" && lead.details?.visit_reason && (
                  <span className="text-xs bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                    {lead.details.visit_reason}
                  </span>
                )}
              </div>
              {canEditStatus && (
                <button
                  onClick={onLogVisit}
                  className="text-xs font-medium bg-success-600 hover:bg-success-700 text-white px-3 py-1 rounded-lg transition flex-shrink-0"
                >
                  + Log Visit
                </button>
              )}
            </div>

            {notesLoading ? (
              <p className="text-xs text-gray-400">Loading notes…</p>
            ) : notes.length === 0 ? (
              <p className="text-xs text-gray-400 mb-3">No notes yet.</p>
            ) : (
              <div className="space-y-3 mb-4">
                {notes.map((note) => (
                  <div key={note.id}>
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-xs font-semibold" style={{ color: note.staff?.color || "#6b7280" }}>
                        {note.author_name ?? note.staff?.name ?? "Unknown"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(note.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{note.note_text}</p>
                  </div>
                ))}
              </div>
            )}

            {myName && canAddNotes && (
              <div className="flex gap-2 mt-2">
                <textarea
                  rows={2}
                  value={noteText}
                  onChange={(e) => onNoteTextChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) onAddNote();
                  }}
                  placeholder="Add a note… (Ctrl+Enter to submit)"
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white/90 resize-none shadow-theme-xs focus:outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:focus:border-brand-800"
                />
                <button
                  onClick={onAddNote}
                  disabled={!noteText.trim() || noteSubmitting}
                  className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-xs font-medium px-3 py-2 rounded-lg transition self-end whitespace-nowrap"
                >
                  {noteSubmitting ? "…" : "Add Note"}
                </button>
              </div>
            )}
          </div>

          {/* Test entry flag */}
          {canMarkTest && (
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={onToggleTest}
                className={`text-xs border rounded-lg px-3 py-1.5 transition ${
                  lead.is_test
                    ? "text-warning-700 border-warning-300 bg-warning-50 hover:bg-warning-100 dark:text-warning-400 dark:border-warning-500/30 dark:bg-warning-500/10"
                    : "text-gray-400 hover:text-warning-600 border-gray-200 dark:border-gray-700 hover:border-warning-300"
                }`}
              >
                {lead.is_test ? "TEST ENTRY — click to unmark" : "Mark as test entry"}
              </button>
            </div>
          )}

          {/* Delete lead */}
          {canDelete && (
            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Delete this lead permanently?</span>
                  <button
                    onClick={onDelete}
                    className="text-xs font-medium text-white bg-error-600 hover:bg-error-700 px-3 py-1.5 rounded-lg transition"
                  >
                    Yes, delete
                  </button>
                  <button
                    onClick={() => onConfirmDeleteToggle(false)}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 border border-gray-300 dark:border-gray-700 px-3 py-1.5 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onConfirmDeleteToggle(true)}
                  className="text-xs text-error-400 hover:text-error-600 border border-error-200 dark:border-error-500/30 hover:border-error-400 px-3 py-1.5 rounded-lg transition"
                >
                  Delete lead
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
