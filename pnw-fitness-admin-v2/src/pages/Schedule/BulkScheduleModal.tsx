import { useState, useEffect, useMemo } from "react";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import { SELECT_CLS } from "../../lib/leadsHelpers";
import {
  Shift,
  StaffMember,
  SLOT_ROW_COUNT,
  slotForRow,
  createShiftsBulk,
} from "../../lib/scheduling";

interface BulkScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember[];
  currentUserId: string | null;
  existingShifts: Shift[];
  onSaved: () => void;
}

const ROW_LABELS = ["Early / Morning", "Mid / Afternoon", "Late", "Manager"];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function mondayOfWeek(base: Date): string {
  const day = base.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(base);
  monday.setDate(base.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")}${period}`;
}

function staffLabel(staff: StaffMember[], userId: string | null) {
  if (!userId) return "Open";
  const s = staff.find((x) => x.user_id === userId);
  return s ? s.display_name || s.email : "Unknown";
}

export default function BulkScheduleModal({
  isOpen,
  onClose,
  staff,
  currentUserId,
  existingShifts,
  onSaved,
}: BulkScheduleModalProps) {
  const [weekStart, setWeekStart] = useState("");
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setWeekStart(mondayOfWeek(new Date()));
    setAssignments({});
    setError(null);
    setResult(null);
  }, [isOpen]);

  const weekDates = useMemo(() => {
    if (!weekStart) return [];
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const existingByKey = useMemo(() => {
    const map = new Map<string, Shift>();
    existingShifts.forEach((s) => {
      map.set(`${s.shift_date}|${s.start_time.slice(0, 5)}|${s.end_time.slice(0, 5)}`, s);
    });
    return map;
  }, [existingShifts]);

  if (!weekDates.length) return null;

  function cellKey(date: string, rowIndex: number) {
    return `${date}|${rowIndex}`;
  }

  function setCell(date: string, rowIndex: number, userId: string) {
    setAssignments((a) => ({ ...a, [cellKey(date, rowIndex)]: userId }));
  }

  let plannedCount = 0;
  for (const date of weekDates) {
    for (let row = 0; row < SLOT_ROW_COUNT; row++) {
      const slot = slotForRow(date, row);
      if (!slot) continue;
      if (existingByKey.has(`${date}|${slot.start_time}|${slot.end_time}`)) continue;
      plannedCount++;
    }
  }

  async function handleCreateWeek() {
    setSaving(true);
    setError(null);
    setResult(null);

    const rows: {
      role_label: string;
      assigned_to: string | null;
      shift_date: string;
      start_time: string;
      end_time: string;
      created_by: string | null;
    }[] = [];
    let skipped = 0;

    for (const date of weekDates) {
      for (let row = 0; row < SLOT_ROW_COUNT; row++) {
        const slot = slotForRow(date, row);
        if (!slot) continue;
        if (existingByKey.has(`${date}|${slot.start_time}|${slot.end_time}`)) {
          skipped++;
          continue;
        }
        rows.push({
          role_label: slot.role_label,
          assigned_to: assignments[cellKey(date, row)] || null,
          shift_date: date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          created_by: currentUserId,
        });
      }
    }

    const { error: err, count } = await createShiftsBulk(rows);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setResult(
      `Created ${count} shift${count === 1 ? "" : "s"}.` +
        (skipped > 0 ? ` ${skipped} already existed and were skipped.` : "")
    );
    onSaved();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-5xl p-6">
      <h3 className="font-bold text-gray-800 dark:text-white/90 mb-1">Bulk Schedule a Week</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Fills in the standard weekly pattern — weekdays: 5:45a–11a, 11a–4p, 4p–9p, plus a 10a–4p manager shift;
        weekends: 7:45a–2p and 2p–8p. Leave a slot on "Open" to let staff claim it later.
      </p>

      <div className="mb-4">
        <Label>Week starting (Monday)</Label>
        <input
          type="date"
          value={weekStart}
          onChange={(e) => setWeekStart(e.target.value)}
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-800 dark:text-gray-200"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-2 w-28">Slot</th>
              {weekDates.map((date, i) => (
                <th key={date} className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 px-1">
                  {DAY_LABELS[i]}
                  <div className="text-[11px] font-normal text-gray-400">{date.slice(5)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: SLOT_ROW_COUNT }, (_, row) => (
              <tr key={row} className="border-t border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-2 text-xs font-medium text-gray-600 dark:text-gray-300 align-top">
                  {ROW_LABELS[row]}
                  {weekDates.some((d) => slotForRow(d, row)) && (
                    <div className="text-[11px] font-normal text-gray-400">
                      {fmtTime(weekDates.map((d) => slotForRow(d, row)).find(Boolean)!.start_time)}–
                      {fmtTime(weekDates.map((d) => slotForRow(d, row)).find(Boolean)!.end_time)}
                    </div>
                  )}
                </td>
                {weekDates.map((date) => {
                  const slot = slotForRow(date, row);
                  if (!slot) {
                    return (
                      <td key={date} className="py-2 px-1 align-top">
                        <span className="text-xs text-gray-300 dark:text-gray-700">—</span>
                      </td>
                    );
                  }
                  const existing = existingByKey.get(`${date}|${slot.start_time}|${slot.end_time}`);
                  if (existing) {
                    return (
                      <td key={date} className="py-2 px-1 align-top">
                        <div className="text-[11px] text-gray-400 italic">
                          exists: {staffLabel(staff, existing.assigned_to)}
                        </div>
                      </td>
                    );
                  }
                  const value = assignments[cellKey(date, row)] ?? "";
                  return (
                    <td key={date} className="py-2 px-1 align-top">
                      <select
                        value={value}
                        onChange={(e) => setCell(date, row, e.target.value)}
                        className={`${SELECT_CLS} w-full text-xs`}
                      >
                        <option value="">Open</option>
                        {staff.map((s) => (
                          <option key={s.user_id} value={s.user_id}>
                            {s.display_name || s.email}
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && (
        <p className="mt-4 text-sm text-error-600 bg-error-50 border border-error-200 rounded px-3 py-2 dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400">
          {error}
        </p>
      )}
      {result && (
        <p className="mt-4 text-sm text-success-700 bg-success-50 border border-success-200 rounded px-3 py-2 dark:bg-success-500/10 dark:border-success-500/30 dark:text-success-400">
          {result}
        </p>
      )}

      <div className="flex items-center gap-2 mt-5">
        <Button size="sm" onClick={handleCreateWeek} disabled={saving || plannedCount === 0}>
          {saving ? "Creating…" : `Create Week (${plannedCount} shift${plannedCount === 1 ? "" : "s"})`}
        </Button>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 border border-gray-300 dark:border-gray-700 px-4 py-2.5 rounded-lg transition"
        >
          {result ? "Close" : "Cancel"}
        </button>
      </div>
    </Modal>
  );
}
