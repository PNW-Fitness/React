import { useState, useEffect } from "react";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import { SELECT_CLS } from "../../lib/leadsHelpers";
import { Shift, TradeRequest, acceptTrade } from "../../lib/scheduling";

interface AcceptTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: TradeRequest | null;
  shift: Shift | null;
  myShifts: Shift[];
  currentUserId: string;
  onAccepted: () => void;
}

function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export default function AcceptTradeModal({
  isOpen,
  onClose,
  trade,
  shift,
  myShifts,
  currentUserId,
  onAccepted,
}: AcceptTradeModalProps) {
  const [mode, setMode] = useState<"take" | "swap">("take");
  const [offeredShiftId, setOfferedShiftId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMode("take");
    setOfferedShiftId("");
    setError(null);
  }, [isOpen]);

  if (!trade || !shift) return null;

  async function handleSubmit() {
    if (!trade) return;
    if (mode === "swap" && !offeredShiftId) {
      setError("Choose one of your own shifts to offer in exchange.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: err } = await acceptTrade(trade.id, currentUserId, mode === "swap" ? offeredShiftId : null);
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    onAccepted();
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <h3 className="font-bold text-gray-800 dark:text-white/90 mb-1">Respond to Trade</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {shift.role_label} — {shift.shift_date}, {fmtTime(shift.start_time)}–{fmtTime(shift.end_time)}
      </p>

      <div className="space-y-4">
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm font-medium">
          <button
            type="button"
            onClick={() => setMode("take")}
            className={`flex-1 py-2 transition ${mode === "take" ? "bg-brand-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03]"}`}
          >
            Just take it
          </button>
          <button
            type="button"
            onClick={() => setMode("swap")}
            className={`flex-1 py-2 transition ${mode === "swap" ? "bg-brand-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03]"}`}
          >
            Offer one of mine back
          </button>
        </div>

        {mode === "swap" && (
          <div>
            <Label>Your shift to offer</Label>
            <select
              value={offeredShiftId}
              onChange={(e) => setOfferedShiftId(e.target.value)}
              className={`${SELECT_CLS} w-full`}
            >
              <option value="">— Select —</option>
              {myShifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.role_label} — {s.shift_date}, {fmtTime(s.start_time)}–{fmtTime(s.end_time)}
                </option>
              ))}
            </select>
            {myShifts.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">You don't have any upcoming shifts to offer.</p>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400">Your manager still needs to approve this before it's final.</p>

        {error && (
          <p className="text-sm text-error-600 bg-error-50 border border-error-200 rounded px-3 py-2 dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Accept"}
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-sm font-medium py-3 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
