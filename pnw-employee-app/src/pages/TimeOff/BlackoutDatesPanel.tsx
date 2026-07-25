import { useState } from "react";
import { type BlackoutDate, createBlackoutDate, deleteBlackoutDate } from "../../lib/timeOff";

interface BlackoutDatesPanelProps {
  blackoutDates: BlackoutDate[];
  currentUserId: string | null;
  onChanged: () => void;
}

export default function BlackoutDatesPanel({ blackoutDates, currentUserId, onChanged }: BlackoutDatesPanelProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!startDate || !endDate || !reason.trim()) {
      setError("Start date, end date, and a reason are all required.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await createBlackoutDate({
      start_date: startDate,
      end_date: endDate,
      reason: reason.trim(),
      created_by: currentUserId,
    });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setStartDate("");
    setEndDate("");
    setReason("");
    onChanged();
  }

  async function handleRemove(id: string) {
    await deleteBlackoutDate(id);
    onChanged();
  }

  return (
    <div className="bg-white rounded-xl border border-navy/10 p-4">
      <p className="text-sm font-bold text-navy mb-1">Blackout Dates</p>
      <p className="text-xs text-navy/50 mb-3">Staff can't request time off during these dates.</p>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="min-w-0 rounded-xl border border-navy/15 px-3 py-2 text-sm text-navy"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="min-w-0 rounded-xl border border-navy/15 px-3 py-2 text-sm text-navy"
        />
      </div>
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. Black Friday"
        className="w-full rounded-xl border border-navy/15 px-3 py-2 text-sm text-navy mb-2"
      />
      <button
        onClick={handleAdd}
        disabled={saving}
        className="w-full text-sm font-bold text-navy bg-gold px-4 py-2 rounded-xl disabled:opacity-50 mb-3"
      >
        {saving ? "Adding…" : "Add Blackout Date"}
      </button>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</p>}

      {blackoutDates.length === 0 ? (
        <p className="text-sm text-navy/40">No blackout dates set.</p>
      ) : (
        <div className="space-y-2">
          {blackoutDates.map((b) => (
            <div key={b.id} className="flex items-center justify-between text-sm bg-navy/5 rounded-lg px-3 py-2">
              <span className="text-navy">
                {b.start_date} – {b.end_date} · <span className="text-navy/50">{b.reason}</span>
              </span>
              <button onClick={() => handleRemove(b.id)} className="text-xs text-red-500 shrink-0 ml-2">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
