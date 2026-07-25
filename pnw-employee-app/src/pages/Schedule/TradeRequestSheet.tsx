import { useState, useEffect } from "react";
import Sheet from "../../components/Sheet";
import { type Shift, type StaffMember, requestTrade, roleMatchesLabel } from "../../lib/scheduling";

interface TradeRequestSheetProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift | null;
  currentUserId: string;
  staff: StaffMember[];
  onSubmitted: () => void;
}

export default function TradeRequestSheet({
  isOpen,
  onClose,
  shift,
  currentUserId,
  staff,
  onSubmitted,
}: TradeRequestSheetProps) {
  const [mode, setMode] = useState<"open" | "offer">("open");
  const [offerTo, setOfferTo] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMode("open");
    setOfferTo([]);
    setReason("");
    setError(null);
  }, [isOpen]);

  if (!shift) return null;

  const coworkers = staff.filter(
    (s) => s.user_id !== currentUserId && roleMatchesLabel(s.role_name, shift.role_label),
  );

  function toggleCoworker(userId: string) {
    setOfferTo((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  }

  async function handleSubmit() {
    if (!shift) return;
    if (mode === "offer" && offerTo.length === 0) {
      setError("Choose at least one coworker to offer this shift to.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: err } = await requestTrade(
      shift.id,
      currentUserId,
      mode === "offer" ? offerTo : [],
      reason.trim() || null,
    );
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSubmitted();
    onClose();
  }

  return (
    <Sheet isOpen={isOpen} onClose={onClose}>
      <h3 className="font-bold text-navy mb-1">Request Trade</h3>
      <p className="text-sm text-navy/50 mb-4">
        {shift.role_label} — {shift.shift_date}
      </p>

      <div className="flex rounded-xl border border-navy/15 overflow-hidden text-sm font-medium mb-4">
        <button
          type="button"
          onClick={() => setMode("open")}
          className={`flex-1 py-2.5 transition ${mode === "open" ? "bg-navy text-white" : "text-navy/60"}`}
        >
          Drop to open
        </button>
        <button
          type="button"
          onClick={() => setMode("offer")}
          className={`flex-1 py-2.5 transition ${mode === "offer" ? "bg-navy text-white" : "text-navy/60"}`}
        >
          Offer to coworkers
        </button>
      </div>

      {mode === "open" ? (
        <p className="text-xs text-navy/40 mb-4">
          Anyone with a matching role ({shift.role_label}) will be able to claim this shift once a manager approves
          the drop.
        </p>
      ) : (
        <div className="mb-4">
          <p className="text-xs font-medium text-navy/50 mb-1.5">Coworkers (any one of them can accept)</p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto border border-navy/15 rounded-xl p-3">
            {coworkers.map((c) => (
              <label key={c.user_id} className="flex items-center gap-2 text-sm text-navy">
                <input
                  type="checkbox"
                  checked={offerTo.includes(c.user_id)}
                  onChange={() => toggleCoworker(c.user_id)}
                  className="w-4 h-4"
                />
                {c.display_name || c.email}
              </label>
            ))}
            {coworkers.length === 0 && (
              <p className="text-xs text-navy/40">No other {shift.role_label} staff found to offer this to.</p>
            )}
          </div>
        </div>
      )}

      <p className="text-xs font-medium text-navy/50 mb-1.5">Reason (optional)</p>
      <textarea
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Why are you requesting this trade?"
        className="w-full rounded-xl border border-navy/15 px-3 py-2 text-sm text-navy mb-4"
      />

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 text-sm font-bold text-navy bg-gold px-4 py-2.5 rounded-xl disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit Request"}
        </button>
        <button onClick={onClose} className="text-sm text-navy/60 border border-navy/15 px-4 py-2.5 rounded-xl">
          Cancel
        </button>
      </div>
    </Sheet>
  );
}
