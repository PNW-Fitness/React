import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { SOURCE_LABELS } from "../../lib/sourceLabels";
import { STATUS_OPTIONS, STATUS_LABELS, VISIT_REASONS, SELECT_CLS } from "../../lib/leadsHelpers";

export interface NewLeadFormState {
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  visit_reason: string;
  how_heard: string;
  zip_code: string;
  first_seen: string;
}

interface NewLeadFormProps {
  form: NewLeadFormState;
  onChange: (form: NewLeadFormState) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}

export default function NewLeadForm({ form, onChange, onSave, onCancel, saving, error }: NewLeadFormProps) {
  function set<K extends keyof NewLeadFormState>(key: K, value: NewLeadFormState[K]) {
    onChange({ ...form, [key]: value });
  }

  return (
    <div className="bg-white dark:bg-white/[0.03] border border-brand-200 dark:border-brand-500/30 rounded-xl shadow-sm p-5 mb-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">New Lead — Manual Entry</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Name *</label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Email</label>
          <Input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@example.com" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Phone</label>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="2535550123" />
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
        {form.source === "checkin_app" && (
          <>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Visit Reason</label>
              <select
                value={form.visit_reason}
                onChange={(e) => set("visit_reason", e.target.value)}
                className={`${SELECT_CLS} w-full`}
              >
                <option value="">— Select —</option>
                {VISIT_REASONS.map((vr) => (
                  <option key={vr} value={vr}>
                    {vr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">How Heard</label>
              <Input value={form.how_heard} onChange={(e) => set("how_heard", e.target.value)} placeholder="e.g. Google, Friend" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Zip Code</label>
              <Input value={form.zip_code} onChange={(e) => set("zip_code", e.target.value)} placeholder="98402" />
            </div>
          </>
        )}
      </div>
      {error && <p className="text-xs text-error-600 dark:text-error-400 mt-3">{error}</p>}
      <div className="flex gap-2 mt-4">
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? "Saving…" : "Save Lead"}
        </Button>
        <button
          onClick={onCancel}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-700 px-4 py-2 rounded-lg transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
