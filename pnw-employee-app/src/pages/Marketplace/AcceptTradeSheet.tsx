import { useState, useEffect } from "react";
import Sheet from "../../components/Sheet";
import { type Shift, type TradeRequest, acceptTrade } from "../../lib/scheduling";
import { formatTime } from "../../lib/time";

interface AcceptTradeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  trade: TradeRequest | null;
  shift: Shift | null;
  myShifts: Shift[];
  currentUserId: string;
  onAccepted: () => void;
}

export default function AcceptTradeSheet({
  isOpen,
  onClose,
  trade,
  shift,
  myShifts,
  currentUserId,
  onAccepted,
}: AcceptTradeSheetProps) {
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
    <Sheet isOpen={isOpen} onClose={onClose}>
      <h3 className="font-bold text-navy mb-1">Respond to Trade</h3>
      <p className="text-sm text-navy/50 mb-4">
        {shift.role_label} — {shift.shift_date}, {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
      </p>

      <div className="flex rounded-xl border border-navy/15 overflow-hidden text-sm font-medium mb-4">
        <button
          type="button"
          onClick={() => setMode("take")}
          className={`flex-1 py-2.5 transition ${mode === "take" ? "bg-navy text-white" : "text-navy/60"}`}
        >
          Just take it
        </button>
        <button
          type="button"
          onClick={() => setMode("swap")}
          className={`flex-1 py-2.5 transition ${mode === "swap" ? "bg-navy text-white" : "text-navy/60"}`}
        >
          Offer one of mine back
        </button>
      </div>

      {mode === "swap" && (
        <div className="mb-4">
          <p className="text-xs font-medium text-navy/50 mb-1.5">Your shift to offer</p>
          <select
            value={offeredShiftId}
            onChange={(e) => setOfferedShiftId(e.target.value)}
            className="w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm text-navy"
          >
            <option value="">— Select —</option>
            {myShifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.role_label} — {s.shift_date}, {formatTime(s.start_time)}–{formatTime(s.end_time)}
              </option>
            ))}
          </select>
          {myShifts.length === 0 && (
            <p className="text-xs text-navy/40 mt-1">You don't have any upcoming shifts to offer.</p>
          )}
        </div>
      )}

      <p className="text-xs text-navy/40 mb-4">Your manager still needs to approve this before it's final.</p>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 text-sm font-bold text-navy bg-gold px-4 py-2.5 rounded-xl disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Accept"}
        </button>
        <button onClick={onClose} className="text-sm text-navy/60 border border-navy/15 px-4 py-2.5 rounded-xl">
          Cancel
        </button>
      </div>
    </Sheet>
  );
}
