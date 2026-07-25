import { useState, useEffect } from "react";
import Sheet from "../../components/Sheet";
import {
  type AvailabilityKind,
  type AvailabilityStatus,
  DAY_OF_WEEK_LABELS,
  createAvailabilityRule,
} from "../../lib/timeOff";

interface AvailabilityRuleSheetProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  currentUserId: string | null;
  onSaved: () => void;
}

export default function AvailabilityRuleSheet({
  isOpen,
  onClose,
  targetUserId,
  currentUserId,
  onSaved,
}: AvailabilityRuleSheetProps) {
  const [kind, setKind] = useState<AvailabilityKind>("recurring");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [status, setStatus] = useState<AvailabilityStatus>("unavailable");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setKind("recurring");
    setDayOfWeek(1);
    setStartDate("");
    setEndDate("");
    setAllDay(true);
    setStartTime("09:00");
    setEndTime("17:00");
    setStatus("unavailable");
    setNote("");
    setError(null);
  }, [isOpen]);

  async function handleSave() {
    if (kind === "custom" && (!startDate || !endDate)) {
      setError("Start and end date are required for a custom date range.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await createAvailabilityRule({
      user_id: targetUserId,
      kind,
      day_of_week: kind === "recurring" ? dayOfWeek : null,
      start_date: kind === "custom" ? startDate : endDate || null,
      end_date: kind === "custom" ? endDate : endDate || null,
      start_time: allDay ? null : startTime,
      end_time: allDay ? null : endTime,
      status,
      note: note.trim() || null,
      created_by: currentUserId,
    });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <Sheet isOpen={isOpen} onClose={onClose}>
      <h3 className="font-bold text-navy mb-4">Add Availability Rule</h3>

      <div className="flex rounded-xl border border-navy/15 overflow-hidden text-sm font-medium mb-4">
        <button
          type="button"
          onClick={() => setKind("recurring")}
          className={`flex-1 py-2.5 transition ${kind === "recurring" ? "bg-navy text-white" : "text-navy/60"}`}
        >
          Recurring
        </button>
        <button
          type="button"
          onClick={() => setKind("custom")}
          className={`flex-1 py-2.5 transition ${kind === "custom" ? "bg-navy text-white" : "text-navy/60"}`}
        >
          Custom Date(s)
        </button>
      </div>

      {kind === "recurring" ? (
        <div className="mb-4">
          <p className="text-xs font-medium text-navy/50 mb-1.5">Day of week</p>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value))}
            className="w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm text-navy"
          >
            {DAY_OF_WEEK_LABELS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
          <p className="text-xs font-medium text-navy/50 mb-1.5 mt-3">Repeat until (optional)</p>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm text-navy"
          />
          <p className="text-xs text-navy/40 mt-1">Leave blank to repeat every week indefinitely.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs font-medium text-navy/50 mb-1.5">Start Date</p>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm text-navy"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-navy/50 mb-1.5">End Date</p>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm text-navy"
            />
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 mb-4">
        <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="w-4 h-4" />
        <span className="text-sm text-navy">All day</span>
      </label>

      {!allDay && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs font-medium text-navy/50 mb-1.5">From</p>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm text-navy"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-navy/50 mb-1.5">To</p>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm text-navy"
            />
          </div>
        </div>
      )}

      <p className="text-xs font-medium text-navy/50 mb-1.5">Status</p>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as AvailabilityStatus)}
        className="w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm text-navy mb-4"
      >
        <option value="unavailable">Unavailable</option>
        <option value="available">Available</option>
        <option value="preferred">Preferred</option>
      </select>

      <p className="text-xs font-medium text-navy/50 mb-1.5">Note (optional)</p>
      <textarea
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="e.g. Classes on campus"
        className="w-full rounded-xl border border-navy/15 px-3 py-2 text-sm text-navy mb-4"
      />

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 text-sm font-bold text-navy bg-gold px-4 py-2.5 rounded-xl disabled:opacity-50"
        >
          {saving ? "Saving…" : "Add Rule"}
        </button>
        <button onClick={onClose} className="text-sm text-navy/60 border border-navy/15 px-4 py-2.5 rounded-xl">
          Cancel
        </button>
      </div>
    </Sheet>
  );
}
