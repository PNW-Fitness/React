import { useState, useEffect } from "react";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import TextArea from "../../components/form/input/TextArea";
import Button from "../../components/ui/button/Button";
import { Shift, StaffMember, requestTrade, roleMatchesLabel } from "../../lib/scheduling";

interface TradeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift | null;
  currentUserId: string;
  staff: StaffMember[];
  onSubmitted: () => void;
}

export default function TradeRequestModal({
  isOpen,
  onClose,
  shift,
  currentUserId,
  staff,
  onSubmitted,
}: TradeRequestModalProps) {
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
    (s) => s.user_id !== currentUserId && roleMatchesLabel(s.role_name, shift.role_label)
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
      reason.trim() || null
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
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <h3 className="font-bold text-gray-800 dark:text-white/90 mb-1">Request Trade</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {shift.role_label} — {shift.shift_date}
      </p>

      <div className="space-y-4">
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm font-medium">
          <button
            type="button"
            onClick={() => setMode("open")}
            className={`flex-1 py-2 transition ${mode === "open" ? "bg-brand-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03]"}`}
          >
            Drop to open
          </button>
          <button
            type="button"
            onClick={() => setMode("offer")}
            className={`flex-1 py-2 transition ${mode === "offer" ? "bg-brand-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03]"}`}
          >
            Offer to coworkers
          </button>
        </div>

        {mode === "open" ? (
          <p className="text-xs text-gray-400">
            Anyone with a matching role ({shift.role_label}) will be able to claim this shift once a manager approves
            the drop.
          </p>
        ) : (
          <div>
            <Label>Coworkers (any one of them can accept)</Label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
              {coworkers.map((c) => (
                <label key={c.user_id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
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
                <p className="text-xs text-gray-400">No other {shift.role_label} staff found to offer this to.</p>
              )}
            </div>
          </div>
        )}

        <div>
          <Label>Reason (optional)</Label>
          <TextArea rows={2} value={reason} onChange={setReason} placeholder="Why are you requesting this trade?" />
        </div>

        {error && (
          <p className="text-sm text-error-600 bg-error-50 border border-error-200 rounded px-3 py-2 dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit Request"}
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
