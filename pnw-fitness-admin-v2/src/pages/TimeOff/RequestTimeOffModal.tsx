import { useState, useEffect } from "react";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import Button from "../../components/ui/button/Button";
import { SELECT_CLS } from "../../lib/leadsHelpers";
import { TimeOffReason, requestTimeOff } from "../../lib/timeOff";

interface RequestTimeOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSubmitted: () => void;
}

const REASONS: TimeOffReason[] = ["vacation", "sick", "personal"];

export default function RequestTimeOffModal({ isOpen, onClose, userId, onSubmitted }: RequestTimeOffModalProps) {
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
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <h3 className="font-bold text-gray-800 dark:text-white/90 mb-4">Request Time Off</h3>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <div>
          <Label>Reason</Label>
          <select value={reason} onChange={(e) => setReason(e.target.value as TimeOffReason)} className={`${SELECT_CLS} w-full`}>
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Note (optional)</Label>
          <TextArea rows={3} value={note} onChange={setNote} placeholder="Anything your manager should know" />
        </div>

        {error && (
          <p className="text-sm text-error-600 bg-error-50 border border-error-200 rounded px-3 py-2 dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400">
            {error}
          </p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? "Submitting…" : "Submit Request"}
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 border border-gray-300 dark:border-gray-700 px-4 py-2.5 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
