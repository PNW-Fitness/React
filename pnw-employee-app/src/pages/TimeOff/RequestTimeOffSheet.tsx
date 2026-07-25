import { useState, useEffect } from "react";
import Sheet from "../../components/Sheet";
import { type TimeOffReason, requestTimeOff } from "../../lib/timeOff";

interface RequestTimeOffSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSubmitted: () => void;
}

const REASONS: TimeOffReason[] = ["vacation", "sick", "personal"];

export default function RequestTimeOffSheet({ isOpen, onClose, userId, onSubmitted }: RequestTimeOffSheetProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState<TimeOffReason>("vacation");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStartDate("");
    setEndDate("");
    setReason("vacation");
    setNote("");
    setError(null);
  }, [isOpen]);

  async function handleSubmit() {
    if (!startDate || !endDate) {
      setError("Start and end date are both required.");
      return;
    }
    if (endDate < startDate) {
      setError("End date can't be before the start date.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await requestTimeOff({
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
      reason,
      note: note.trim() || null,
    });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSubmitted();
    onClose();
  }

  return (
    <Sheet isOpen={isOpen} onClose={onClose}>
      <h3 className="font-bold text-navy mb-4">Request Time Off</h3>

      <div className="space-y-3 mb-4">
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

      <p className="text-xs font-medium text-navy/50 mb-1.5">Reason</p>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value as TimeOffReason)}
        className="w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm text-navy mb-4"
      >
        {REASONS.map((r) => (
          <option key={r} value={r}>
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </option>
        ))}
      </select>

      <p className="text-xs font-medium text-navy/50 mb-1.5">Note (optional)</p>
      <textarea
        rows={3}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Anything your manager should know"
        className="w-full rounded-xl border border-navy/15 px-3 py-2 text-sm text-navy mb-4"
      />

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 text-sm font-bold text-navy bg-gold px-4 py-2.5 rounded-xl disabled:opacity-50"
        >
          {saving ? "Submitting…" : "Submit Request"}
        </button>
        <button onClick={onClose} className="text-sm text-navy/60 border border-navy/15 px-4 py-2.5 rounded-xl">
          Cancel
        </button>
      </div>
    </Sheet>
  );
}
