import { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../ui/table";
import Input from "../../form/input/InputField";
import TextArea from "../../form/input/TextArea";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../lib/AuthContext";
import { usePermissions } from "../../../lib/PermissionsContext";

interface VendorSubmission {
  id: string;
  name: string;
  company: string;
  phone: string | null;
  reason: string;
  notes: string | null;
  submitted_at: string;
}

// LOCAL date components, not .toISOString() — that converts to UTC, which
// rolls the date forward a day once local time passes into the evening for
// any UTC-behind timezone (e.g. new Date() at 5pm Pacific is already
// "tomorrow" in UTC).
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function VendorLogTable() {
  const { role } = useAuth();
  const { can } = usePermissions();
  const [vendors, setVendors] = useState<VendorSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Two gates ported as-is from VendorLogPage.jsx: notes editing is a real
  // RBAC permission, delete is still hard-coded to the legacy admin role.
  const isAdmin = role === "admin";
  const canAddNotes = can("vendor_log.notes.add");

  async function handleSaveNote(vendorId: string) {
    setNoteSaving(true);
    setNoteError(null);
    const { error } = await supabase
      .from("vendor_submissions")
      .update({ notes: noteText.trim() || null })
      .eq("id", vendorId);
    if (error) {
      setNoteError(error.message);
    } else {
      setVendors((prev) =>
        prev.map((v) => (v.id === vendorId ? { ...v, notes: noteText.trim() || null } : v))
      );
      setEditingNote(null);
    }
    setNoteSaving(false);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    setDeleteError(null);
    const { error } = await supabase.from("vendor_submissions").delete().eq("id", id);
    if (error) {
      setDeleteError(`Delete failed: ${error.message} (${error.code})`);
      setConfirmId(null);
    } else {
      setVendors((prev) => prev.filter((v) => v.id !== id));
      setConfirmId(null);
    }
    setDeleting(null);
  }

  async function fetchVendors(dateStr: string) {
    setLoading(true);
    setFetchError(null);
    const start = new Date(dateStr + "T00:00:00");
    const end = new Date(dateStr + "T23:59:59.999");

    const { data, error } = await supabase
      .from("vendor_submissions")
      .select("*")
      .gte("submitted_at", start.toISOString())
      .lte("submitted_at", end.toISOString())
      .order("submitted_at", { ascending: false });

    if (error) setFetchError(`${error.message} (${error.code})`);
    setVendors(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchVendors(selectedDate);

    if (selectedDate !== todayStr()) return;

    const channel = supabase
      .channel(`vendor_log_admin_${selectedDate}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "vendor_submissions" },
        (payload) => {
          setVendors((prev) =>
            prev.some((v) => v.id === payload.new.id) ? prev : [payload.new as VendorSubmission, ...prev]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate]);

  const isToday = selectedDate === todayStr();
  const dateLabel = new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const colCount = isAdmin ? 7 : 6;

  return (
    <div>
      <div className="flex items-center justify-between mb-1 gap-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isToday ? "Today — " : ""}
          {dateLabel}
        </p>
        <Input
          type="date"
          value={selectedDate}
          max={todayStr()}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-auto"
        />
      </div>

      {loading && <p className="text-sm text-gray-400 text-center py-8">Loading…</p>}

      {deleteError && (
        <div className="mb-4 bg-error-50 border border-error-200 rounded-xl px-5 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400">
          {deleteError} — make sure the DELETE policy has been added in Supabase.
        </div>
      )}

      {!loading && fetchError && (
        <div className="bg-error-50 border border-error-200 rounded-xl px-5 py-4 text-sm text-error-700 dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400">
          <p className="font-semibold mb-1">Failed to load vendor log</p>
          <p className="font-mono text-xs">{fetchError}</p>
        </div>
      )}

      {!loading && !fetchError && vendors.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🏢</p>
          <p className="text-sm font-medium">
            No vendors signed in {isToday ? "today" : "that day"}
          </p>
          <p className="text-xs mt-1">
            Vendor sign-ins appear here as they check in on the kiosk.
          </p>
        </div>
      )}

      {!loading && !fetchError && vendors.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-white/[0.05]">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {vendors.length} {vendors.length === 1 ? "vendor" : "vendors"}
            </p>
          </div>
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs whitespace-nowrap dark:text-gray-400">
                    Time In
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Name
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Company
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Phone
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Reason for Visit
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Notes
                  </TableCell>
                  {isAdmin && <TableCell isHeader className="px-4 py-3">{null}</TableCell>}
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {noteError && (
                  <tr>
                    <td colSpan={colCount} className="px-4 py-2 text-xs text-error-600 bg-error-50 dark:bg-error-500/10 dark:text-error-400">
                      Failed to save note: {noteError}
                    </td>
                  </tr>
                )}
                {vendors.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                      {formatTime(v.submitted_at)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                      {v.name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                      {v.company}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 whitespace-nowrap dark:text-gray-400">
                      {v.phone || "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                      {v.reason}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start min-w-[180px]">
                      {editingNote === v.id ? (
                        <div className="flex flex-col gap-1.5">
                          <TextArea rows={2} value={noteText} onChange={setNoteText} />
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleSaveNote(v.id)}
                              disabled={noteSaving}
                              className="text-xs font-medium text-brand-600 hover:text-brand-800 disabled:opacity-50"
                            >
                              {noteSaving ? "Saving…" : "Save"}
                            </button>
                            <button
                              onClick={() => setEditingNote(null)}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 group">
                          <span className={v.notes ? "text-gray-700 text-sm dark:text-gray-300" : "text-gray-300 text-sm dark:text-gray-600"}>
                            {v.notes || "—"}
                          </span>
                          {canAddNotes && (
                            <button
                              onClick={() => {
                                setEditingNote(v.id);
                                setNoteText(v.notes || "");
                                setNoteError(null);
                              }}
                              className="text-xs text-gray-300 group-hover:text-brand-500 transition flex-shrink-0 mt-0.5"
                            >
                              {v.notes ? "Edit" : "+ Add"}
                            </button>
                          )}
                        </div>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="px-4 py-3 text-right whitespace-nowrap">
                        {confirmId === v.id ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="text-xs text-gray-500">Delete?</span>
                            <button
                              onClick={() => handleDelete(v.id)}
                              disabled={deleting === v.id}
                              className="text-xs font-medium text-error-600 hover:text-error-800 disabled:opacity-50"
                            >
                              {deleting === v.id ? "Deleting…" : "Yes"}
                            </button>
                            <button
                              onClick={() => setConfirmId(null)}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmId(v.id)}
                            className="text-xs text-gray-400 hover:text-error-600 transition"
                          >
                            Delete
                          </button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
