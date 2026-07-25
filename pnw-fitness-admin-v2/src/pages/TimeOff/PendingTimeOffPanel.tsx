import { useState } from "react";
import { StaffMember } from "../../lib/scheduling";
import { TimeOffRequest, decideTimeOff } from "../../lib/timeOff";

interface PendingTimeOffPanelProps {
  requests: TimeOffRequest[];
  staff: StaffMember[];
  currentUserId: string | null;
  onDecided: () => void;
}

function staffName(staff: StaffMember[], userId: string) {
  const s = staff.find((x) => x.user_id === userId);
  return s ? s.display_name || s.email : "Unknown";
}

export default function PendingTimeOffPanel({ requests, staff, currentUserId, onDecided }: PendingTimeOffPanelProps) {
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (requests.length === 0) return null;

  async function handleDecide(req: TimeOffRequest, status: "approved" | "denied") {
    setActingOn(req.id);
    setError(null);
    const { error: err } = await decideTimeOff(req.id, status, currentUserId || "");
    setActingOn(null);
    if (err) setError(err.message);
    else onDecided();
  }

  return (
    <div className="mb-4 rounded-xl border border-warning-200 dark:border-warning-500/30 bg-warning-50 dark:bg-warning-500/10 p-4">
      <p className="text-xs font-semibold text-warning-700 dark:text-warning-400 uppercase tracking-wide mb-3">
        Pending Time-Off Requests ({requests.length})
      </p>
      {error && <p className="text-sm text-error-600 dark:text-error-400 mb-2">{error}</p>}
      <div className="space-y-2">
        {requests.map((req) => (
          <div
            key={req.id}
            className="flex items-center justify-between gap-3 bg-white dark:bg-white/[0.03] rounded-lg px-3 py-2"
          >
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">{staffName(staff, req.user_id)}</span> requested {req.reason} —{" "}
              {req.start_date} to {req.end_date}
              {req.note && <p className="text-xs text-gray-400 mt-0.5">"{req.note}"</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleDecide(req, "approved")}
                disabled={actingOn === req.id}
                className="text-xs font-medium text-white bg-success-600 hover:bg-success-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition"
              >
                Approve
              </button>
              <button
                onClick={() => handleDecide(req, "denied")}
                disabled={actingOn === req.id}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 border border-gray-300 dark:border-gray-700 px-3 py-1.5 rounded-lg transition"
              >
                Deny
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
