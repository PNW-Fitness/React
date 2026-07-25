import { useState } from "react";
import { type StaffMember } from "../../lib/scheduling";
import { type TimeOffRequest, decideTimeOff } from "../../lib/timeOff";
import { staffName } from "../../lib/time";

interface PendingTimeOffPanelProps {
  requests: TimeOffRequest[];
  staff: StaffMember[];
  currentUserId: string | null;
  onDecided: () => void;
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
    <div className="rounded-xl border border-gold/40 bg-gold/10 p-4 mb-4">
      <p className="text-xs font-semibold text-navy/70 uppercase tracking-wide mb-3">
        Pending Time-Off Requests ({requests.length})
      </p>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <div className="space-y-2">
        {requests.map((req) => (
          <div key={req.id} className="bg-white rounded-lg px-3 py-2.5">
            <p className="text-sm text-navy">
              <span className="font-medium">{staffName(staff, req.user_id)}</span> requested {req.reason} —{" "}
              {req.start_date} to {req.end_date}
            </p>
            {req.note && <p className="text-xs text-navy/40 mt-0.5">"{req.note}"</p>}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => handleDecide(req, "approved")}
                disabled={actingOn === req.id}
                className="text-xs font-bold text-white bg-navy disabled:opacity-50 px-3 py-1.5 rounded-lg"
              >
                Approve
              </button>
              <button
                onClick={() => handleDecide(req, "denied")}
                disabled={actingOn === req.id}
                className="text-xs text-navy/60 border border-navy/15 px-3 py-1.5 rounded-lg"
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
