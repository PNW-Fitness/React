import Checkbox from "../form/input/Checkbox";
import { SELECT_CLS } from "../../lib/leadsHelpers";

interface TrialPassControlProps {
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
export default function TrialPassControl({ trialPass, trialEndDate, canManage, onChange }: TrialPassControlProps) {
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
        <input
          // Uncontrolled on purpose: a native date input only reports a
          // value once month/day/year are ALL complete, so a controlled
          // value fed back on every keystroke resets the field mid-edit
          // (e.g. after typing 2 of 4 year digits). Committing on blur
          // instead lets the browser's own segment editing work normally;
          // the key remounts it if the stored date changes externally.
          key={trialEndDate ?? "empty"}
          type="date"
          defaultValue={trialEndDate ?? ""}
          onBlur={(e) => onChange(true, e.target.value || null)}
          className={SELECT_CLS}
        />
      )}
    </div>
  );
}
