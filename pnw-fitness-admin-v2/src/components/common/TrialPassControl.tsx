import Checkbox from "../form/input/Checkbox";
import DatePicker from "../form/date-picker";

interface TrialPassControlProps {
  leadId: string;
  trialPass: boolean;
  trialEndDate: string | null;
  canManage: boolean;
  onChange: (trialPass: boolean, trialEndDate: string | null) => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Shared between Leads and Guest Notes — gated on leads.trial_pass.manage,
// degrades to plain read-only text for roles without it (e.g. Trainer),
// same pattern as the Assigned Trainer control degrades elsewhere.
//
// Uses TailAdmin's flatpickr-based DatePicker instead of a native
// <input type="date">: the native control proved unreliable in testing —
// a controlled value reset it mid-keystroke, and separately, clicking near
// its built-in calendar icon opened the browser's own popup and produced
// garbled values when combined with typing. flatpickr renders its own
// consistent calendar UI instead of deferring to the browser, avoiding
// both failure modes.
export default function TrialPassControl({ leadId, trialPass, trialEndDate, canManage, onChange }: TrialPassControlProps) {
  if (!canManage) {
    return (
      <p className="text-sm text-gray-700 dark:text-gray-300">
        {trialPass ? `Yes${trialEndDate ? ` — ends ${formatDate(trialEndDate)}` : ""}` : "No"}
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Checkbox
        label="Trial Pass"
        checked={trialPass}
        onChange={(checked) => onChange(checked, checked ? trialEndDate : null)}
      />
      {trialPass && (
        <>
          <div className="w-44">
            <DatePicker
              id={`trial-end-date-${leadId}`}
              defaultDate={trialEndDate ?? undefined}
              placeholder="Select end date"
              onChange={(_dates, dateStr) => onChange(true, dateStr || null)}
            />
          </div>
          {trialEndDate && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Expires {formatDate(trialEndDate)}
            </span>
          )}
        </>
      )}
    </div>
  );
}
