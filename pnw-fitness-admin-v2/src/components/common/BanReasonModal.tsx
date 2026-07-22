import { useState } from "react";
import { Modal } from "../ui/modal";
import TextArea from "../form/input/TextArea";
import Button from "../ui/button/Button";

interface BanReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  guestName: string;
  submitLabel: string;
  onSubmit: (reason: string) => Promise<void>;
}

export default function BanReasonModal({ isOpen, onClose, title, guestName, submitLabel, onSubmit }: BanReasonModalProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleClose() {
    setReason("");
    setError("");
    onClose();
  }

  async function handleSubmit() {
    if (!reason.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(reason.trim());
      setReason("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
    setSubmitting(false);
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md p-6">
      <h3 className="font-bold text-gray-800 dark:text-white/90 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        For <span className="font-medium text-gray-700 dark:text-gray-300">{guestName}</span>
      </p>
      <TextArea
        rows={4}
        value={reason}
        onChange={setReason}
        placeholder="Reason (required)…"
      />
      {error && (
        <p className="mt-2 text-sm text-error-600 bg-error-50 border border-error-200 rounded px-3 py-2 dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400">
          {error}
        </p>
      )}
      <div className="flex gap-2 mt-4">
        <Button size="sm" onClick={handleSubmit} disabled={!reason.trim() || submitting}>
          {submitting ? "Submitting…" : submitLabel}
        </Button>
        <button
          type="button"
          onClick={handleClose}
          className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-sm font-medium py-3 rounded-lg transition"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
