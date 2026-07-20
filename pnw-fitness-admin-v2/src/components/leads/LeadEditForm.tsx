import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { SOURCE_LABELS } from "../../lib/sourceLabels";
import { STATUS_OPTIONS, STATUS_LABELS, VISIT_REASONS, SELECT_CLS } from "../../lib/leadsHelpers";

export interface EditFormState {
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  visit_count: number | string;
  first_seen: string;
  visit_reason: string;
  how_heard: string;
  interests: string;
  zip_code: string;
}

interface LeadEditFormProps {
  form: EditFormState;
  onChange: (form: EditFormState) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}

export default function LeadEditForm({ form, onChange, onSave, onCancel, saving, error }: LeadEditFormProps) {
  function set<K extends keyof EditFormState>(key: K, value: EditFormState[K]) {
    onChange({ ...form, [key]: value });
  }

  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Editing Lead</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Name</label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Email</label>
          <Input value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Phone</label>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Source</label>
          <select value={form.source} onChange={(e) => set("source", e.target.value)} className={`${SELECT_CLS} w-full`}>
            {Object.entries(SOURCE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Status</label>
          <select value={form.status} onChange={(e) => set("status", e.target.value)} className={`${SELECT_CLS} w-full`}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Check-in Date &amp; Time</label>
          <Input type="datetime-local" value={form.first_seen} onChange={(e) => set("first_seen", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Visit Count</label>
          <Input type="number" min="1" value={form.visit_count} onChange={(e) => set("visit_count", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Visit Reason</label>
          <select
            value={form.visit_reason}
            onChange={(e) => set("visit_reason", e.target.value)}
            className={`${SELECT_CLS} w-full`}
          >
            <option value="">— None —</option>
            {VISIT_REASONS.map((vr) => (
              <option key={vr} value={vr}>
                {vr}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">How Heard</label>
          <Input value={form.how_heard} onChange={(e) => set("how_heard", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Interests</label>
          <Input value={form.interests} onChange={(e) => set("interests", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Zip Code</label>
          <Input value={form.zip_code} onChange={(e) => set("zip_code", e.target.value)} />
        </div>
      </div>
      {error && <p className="text-xs text-error-600 dark:text-error-400 mt-2">{error}</p>}
      <div className="flex gap-2 mt-3">
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
        <button
          onClick={onCancel}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-700 px-4 py-1.5 rounded-lg transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
