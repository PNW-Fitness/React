import { useState } from "react";
import Sheet from "../../components/Sheet";
import { type Shift, type StaffMember, claimShift, roleMatchesLabel } from "../../lib/scheduling";
import { formatTime, staffName } from "../../lib/time";

interface ShiftDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift | null;
  staff: StaffMember[];
  currentUserId: string | null;
  currentUserRoleName: string | null;
  canRequestTrade: boolean;
  onRequestTrade: (shift: Shift) => void;
  onClaimed: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  open: "Open",
  trade_pending: "Trade pending",
  completed: "Completed",
  no_show: "No show",
};

export default function ShiftDetailSheet({
  isOpen,
  onClose,
  shift,
  staff,
  currentUserId,
  currentUserRoleName,
  canRequestTrade,
  onRequestTrade,
  onClaimed,
}: ShiftDetailSheetProps) {
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!shift) return null;

  const isOwnShift = shift.assigned_to === currentUserId;
  const canClaim = shift.status === "open" && roleMatchesLabel(currentUserRoleName, shift.role_label);

  async function handleClaim() {
    if (!shift || !currentUserId) return;
    setClaiming(true);
    setError(null);
    const { error: err } = await claimShift(shift.id, currentUserId);
    setClaiming(false);
    if (err) {
      setError(err.message);
      return;
    }
    onClaimed();
    onClose();
  }

  return (
    <Sheet isOpen={isOpen} onClose={onClose}>
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="font-bold text-navy">{shift.role_label}</h3>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-navy/5 text-navy/70">
          {STATUS_LABEL[shift.status] ?? shift.status}
        </span>
      </div>

      <dl className="space-y-2 text-sm">
        {!isOwnShift && (
          <div className="flex gap-2">
            <dt className="font-medium text-navy/50">Assigned to</dt>
            <dd className="text-navy">{staffName(staff, shift.assigned_to) === "—" ? "Unassigned (open)" : staffName(staff, shift.assigned_to)}</dd>
          </div>
        )}
        <div className="flex gap-2">
          <dt className="font-medium text-navy/50">Date</dt>
          <dd className="text-navy">{shift.shift_date}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium text-navy/50">Time</dt>
          <dd className="text-navy">
            {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
          </dd>
        </div>
        {shift.notes && (
          <div className="flex gap-2">
            <dt className="font-medium text-navy/50">Notes</dt>
            <dd className="text-navy whitespace-pre-wrap">{shift.notes}</dd>
          </div>
        )}
      </dl>

      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-2 mt-5">
        {isOwnShift && canRequestTrade && shift.status === "scheduled" && (
          <button
            onClick={() => onRequestTrade(shift)}
            className="flex-1 text-sm font-bold text-navy bg-gold px-4 py-2.5 rounded-xl"
          >
            Request Trade
          </button>
        )}
        {canClaim && (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="flex-1 text-sm font-bold text-white bg-navy px-4 py-2.5 rounded-xl disabled:opacity-50"
          >
            {claiming ? "Claiming…" : "Claim Shift"}
          </button>
        )}
        <button onClick={onClose} className="text-sm text-navy/60 border border-navy/15 px-4 py-2.5 rounded-xl">
          Close
        </button>
      </div>
    </Sheet>
  );
}
