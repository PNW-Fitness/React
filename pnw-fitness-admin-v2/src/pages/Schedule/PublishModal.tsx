import { useState, useEffect } from "react";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import { PublishAudience, publishDrafts } from "../../lib/scheduling";

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftCount: number;
  onPublished: () => void;
}

const AUDIENCE_OPTIONS: { value: PublishAudience; label: string; hint: string }[] = [
  { value: "affected", label: "Notify only affected employees", hint: "Anyone assigned to a shift in this batch" },
  { value: "all", label: "Notify all employees", hint: "Everyone with schedule access" },
  { value: "none", label: "Don't notify anyone", hint: "Just publish, no notifications" },
];

export default function PublishModal({ isOpen, onClose, draftCount, onPublished }: PublishModalProps) {
  const [audience, setAudience] = useState<PublishAudience>("affected");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setAudience("affected");
    setError(null);
    setResult(null);
  }, [isOpen]);

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    const { error: err, publishedCount } = await publishDrafts(audience);
    setPublishing(false);
    if (err) {
      setError(err.message);
      return;
    }
    setResult(`Published ${publishedCount} shift${publishedCount === 1 ? "" : "s"}.`);
    onPublished();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <h3 className="font-bold text-gray-800 dark:text-white/90 mb-1">Publish Schedule</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {draftCount === 0
          ? "There are no draft shifts to publish."
          : `${draftCount} draft shift${draftCount === 1 ? " is" : "s are"} waiting to be published.`}
      </p>

      {draftCount > 0 && !result && (
        <div className="space-y-2 mb-4">
          {AUDIENCE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-2 rounded-lg border px-3 py-2 cursor-pointer transition ${
                audience === opt.value
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                  : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
              }`}
            >
              <input
                type="radio"
                name="audience"
                className="mt-1"
                checked={audience === opt.value}
                onChange={() => setAudience(opt.value)}
              />
              <span>
                <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">{opt.label}</span>
                <span className="block text-xs text-gray-400">{opt.hint}</span>
              </span>
            </label>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-error-600 bg-error-50 border border-error-200 rounded px-3 py-2 dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400 mb-4">
          {error}
        </p>
      )}
      {result && (
        <p className="text-sm text-success-700 bg-success-50 border border-success-200 rounded px-3 py-2 dark:bg-success-500/10 dark:border-success-500/30 dark:text-success-400 mb-4">
          {result}
        </p>
      )}

      <div className="flex items-center gap-2">
        {draftCount > 0 && !result && (
          <Button size="sm" onClick={handlePublish} disabled={publishing}>
            {publishing ? "Publishing…" : `Publish ${draftCount} Shift${draftCount === 1 ? "" : "s"}`}
          </Button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 border border-gray-300 dark:border-gray-700 px-4 py-2.5 rounded-lg transition"
        >
          {result ? "Close" : "Cancel"}
        </button>
      </div>
    </Modal>
  );
}
