import { useState, useEffect } from "react";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import Button from "../../components/ui/button/Button";
import { SELECT_CLS } from "../../lib/leadsHelpers";
import {
  Shift,
  StaffMember,
  ROLE_LABELS,
  createShift,
  updateShift,
  deleteShift,
  checkShiftConflicts,
} from "../../lib/scheduling";

interface AddEditShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift | null;
  defaultDate?: string;
  staff: StaffMember[];
  allShifts: Shift[];
  currentUserId: string | null;
  onSaved: () => void;
}

interface FormState {
  role_label: string;
  assigned_to: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  role_label: ROLE_LABELS[0],
  assigned_to: "",
  shift_date: "",
  start_time: "09:00",
  end_time: "17:00",
  notes: "",
};

export default function AddEditShiftModal({
  isOpen,
  onClose,
  shift,
  defaultDate,
  staff,
  allShifts,
  currentUserId,
  onSaved,
}: AddEditShiftModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<string[] | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setConfirmDelete(false);
    setConflicts(null);
    if (shift) {
      setForm({
        role_label: shift.role_label,
        assigned_to: shift.assigned_to ?? "",
        shift_date: shift.shift_date,
        start_time: shift.start_time.slice(0, 5),
        end_time: shift.end_time.slice(0, 5),
        notes: shift.notes ?? "",
      });
    } else {
      setForm({ ...EMPTY_FORM, shift_date: defaultDate ?? "" });
    }
  }, [isOpen, shift, defaultDate]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setConflicts(null); // re-arm the conflict check — the last result no longer applies
  }

  async function handleSave() {
    if (!form.shift_date || !form.start_time || !form.end_time) {
      setError("Date, start time, and end time are required.");
      return;
    }

    // First click checks for double-booking/overtime and stops to show them;
    // a second click (conflicts already shown) proceeds anyway. The DB
    // itself still hard-blocks approved time off regardless of this check.
    if (conflicts === null) {
      const warnings = checkShiftConflicts(
        {
          id: shift?.id,
          assigned_to: form.assigned_to || null,
          shift_date: form.shift_date,
          start_time: form.start_time,
          end_time: form.end_time,
        },
        allShifts,
        staff
      );
      if (warnings.length > 0) {
        setConflicts(warnings);
        return;
      }
    }

    setSaving(true);
    setError(null);

    const payload = {
      role_label: form.role_label,
      assigned_to: form.assigned_to || null,
      shift_date: form.shift_date,
      start_time: form.start_time,
      end_time: form.end_time,
      notes: form.notes.trim() || null,
    };

    const { error: err } = shift
      ? await updateShift(shift.id, {
          ...payload,
          // Reassigning away from trade_pending/open resets it back to scheduled;
          // leaving it unassigned keeps it open.
          status: payload.assigned_to ? "scheduled" : "open",
        })
      : await createShift({ ...payload, created_by: currentUserId });

    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved();
    onClose();
  }

  async function handleDelete() {
    if (!shift) return;
    setSaving(true);
    const { error: err } = await deleteShift(shift.id);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-6">
      <h3 className="font-bold text-gray-800 dark:text-white/90 mb-4">{shift ? "Edit Shift" : "Add Shift"}</h3>

      <div className="space-y-4">
        <div>
          <Label>Role</Label>
          <select value={form.role_label} onChange={(e) => set("role_label", e.target.value)} className={`${SELECT_CLS} w-full`}>
            {ROLE_LABELS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Assigned Staff (optional — leave blank for an open shift)</Label>
          <select
            value={form.assigned_to}
            onChange={(e) => set("assigned_to", e.target.value)}
            className={`${SELECT_CLS} w-full`}
          >
            <option value="">— Open —</option>
            {staff.map((s) => (
              <option key={s.user_id} value={s.user_id}>
                {s.display_name || s.email} {s.role_name ? `(${s.role_name})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Date</Label>
          <Input type="date" value={form.shift_date} onChange={(e) => set("shift_date", e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Start Time</Label>
            <Input type="time" value={form.start_time} onChange={(e) => set("start_time", e.target.value)} />
          </div>
          <div>
            <Label>End Time</Label>
            <Input type="time" value={form.end_time} onChange={(e) => set("end_time", e.target.value)} />
          </div>
        </div>

        <div>
          <Label>Notes</Label>
          <TextArea rows={2} value={form.notes} onChange={(v) => set("notes", v)} placeholder="Optional" />
        </div>

        {conflicts && conflicts.length > 0 && (
          <div className="text-sm text-warning-700 bg-warning-50 border border-warning-200 rounded px-3 py-2 dark:bg-warning-500/10 dark:border-warning-500/30 dark:text-warning-400 space-y-1">
            {conflicts.map((c, i) => (
              <p key={i}>⚠ {c}</p>
            ))}
            <p className="text-xs opacity-80">Click Save again to save anyway.</p>
          </div>
        )}

        {error && (
          <p className="text-sm text-error-600 bg-error-50 border border-error-200 rounded px-3 py-2 dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400">
            {error}
          </p>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : conflicts && conflicts.length > 0 ? "Save Anyway" : shift ? "Save Changes" : "Add Shift"}
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 border border-gray-300 dark:border-gray-700 px-4 py-2.5 rounded-lg transition"
          >
            Cancel
          </button>
          {shift && (
            <div className="ml-auto">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Delete this shift?</span>
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="text-xs font-medium text-white bg-error-600 hover:bg-error-700 px-3 py-1.5 rounded-lg transition"
                  >
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs text-error-500 hover:text-error-600 border border-error-200 dark:border-error-500/30 px-3 py-1.5 rounded-lg transition"
                >
                  Delete shift
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
