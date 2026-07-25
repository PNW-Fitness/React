import { useState } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { BlackoutDate, createBlackoutDate, deleteBlackoutDate } from "../../lib/timeOff";

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
    <ComponentCard title="Blackout Dates" desc="Staff can't request time off during these dates.">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end mb-4">
        <div>
          <Label>Start</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <Label>End</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="sm:col-span-1">
          <Label>Reason</Label>
          <Input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Black Friday" />
        </div>
        <Button size="sm" onClick={handleAdd} disabled={saving}>
          {saving ? "Adding…" : "Add"}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-error-600 bg-error-50 border border-error-200 rounded px-3 py-2 dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400 mb-3">
          {error}
        </p>
      )}

      {blackoutDates.length === 0 ? (
        <p className="text-sm text-gray-400">No blackout dates set.</p>
      ) : (
        <div className="space-y-2">
          {blackoutDates.map((b) => (
            <div key={b.id} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-white/[0.03] rounded-lg px-3 py-2">
              <span className="text-gray-700 dark:text-gray-300">
                {b.start_date} – {b.end_date} · <span className="text-gray-500">{b.reason}</span>
              </span>
              <button onClick={() => handleRemove(b.id)} className="text-xs text-error-500 hover:text-error-600">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </ComponentCard>
  );
}
