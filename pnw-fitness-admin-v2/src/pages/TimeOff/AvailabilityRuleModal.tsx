import { useState, useEffect } from "react";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import Button from "../../components/ui/button/Button";
import { SELECT_CLS } from "../../lib/leadsHelpers";
import {
  AvailabilityKind,
  AvailabilityStatus,
  DAY_OF_WEEK_LABELS,
  createAvailabilityRule,
} from "../../lib/timeOff";

interface AvailabilityRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  currentUserId: string | null;
  onSaved: () => void;
}

export default function AvailabilityRuleModal({
  isOpen,
  onClose,
  targetUserId,
  currentUserId,
  onSaved,
}: AvailabilityRuleModalProps) {
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
      start_date: kind === "custom" ? startDate : endDate ? endDate : null,
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
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <h3 className="font-bold text-gray-800 dark:text-white/90 mb-4">Add Availability Rule</h3>

      <div className="space-y-4">
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm font-medium">
          <button
            type="button"
            onClick={() => setKind("recurring")}
            className={`flex-1 py-2 transition ${kind === "recurring" ? "bg-brand-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03]"}`}
          >
            Recurring
          </button>
          <button
            type="button"
            onClick={() => setKind("custom")}
            className={`flex-1 py-2 transition ${kind === "custom" ? "bg-brand-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03]"}`}
          >
            Custom Date(s)
          </button>
        </div>

        {kind === "recurring" ? (
          <div>
            <Label>Day of week</Label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className={`${SELECT_CLS} w-full`}
            >
              {DAY_OF_WEEK_LABELS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
            <Label className="mt-3">Repeat until (optional)</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">Leave blank to repeat every week indefinitely.</p>
          </div>
        ) : (
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
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allDay"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="allDay" className="text-sm text-gray-700 dark:text-gray-300">
            All day
          </label>
        </div>

        {!allDay && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>From</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <Label>To</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
        )}

        <div>
          <Label>Status</Label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AvailabilityStatus)}
            className={`${SELECT_CLS} w-full`}
          >
            <option value="unavailable">Unavailable</option>
            <option value="available">Available</option>
            <option value="preferred">Preferred</option>
          </select>
        </div>

        <div>
          <Label>Note (optional)</Label>
          <TextArea rows={2} value={note} onChange={setNote} placeholder="e.g. Classes on campus" />
        </div>

        {error && (
          <p className="text-sm text-error-600 bg-error-50 border border-error-200 rounded px-3 py-2 dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400">
            {error}
          </p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Add Rule"}
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
