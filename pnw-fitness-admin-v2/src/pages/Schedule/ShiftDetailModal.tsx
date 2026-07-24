import { useState } from "react";
import { Modal } from "../../components/ui/modal";
import Badge from "../../components/ui/badge/Badge";
import { Shift, StaffMember, claimShift, roleMatchesLabel } from "../../lib/scheduling";

interface ShiftDetailModalProps {
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

const STATUS_BADGE: Record<string, "primary" | "warning" | "error" | "success" | "light"> = {
  scheduled: "primary",
  open: "warning",
  trade_pending: "error",
  completed: "success",
  no_show: "light",
};

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export default function ShiftDetailModal({
  isOpen,
  onClose,
  shift,
  staff,
  currentUserId,
  currentUserRoleName,
  canRequestTrade,
  onRequestTrade,
  onClaimed,
}: ShiftDetailModalProps) {
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!shift) return null;

  const assignee = staff.find((s) => s.user_id === shift.assigned_to);
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
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <div className="flex items-center justify-between gap-2 mb-4 pr-10 sm:pr-12">
        <h3 className="font-bold text-gray-800 dark:text-white/90">{shift.role_label}</h3>
        <Badge size="sm" color={STATUS_BADGE[shift.status] ?? "light"}>
          {shift.status.replace("_", " ")}
        </Badge>
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex gap-2">
          <dt className="font-medium text-gray-500 dark:text-gray-400">Assigned to:</dt>
          <dd className="text-gray-800 dark:text-gray-200">{assignee ? assignee.display_name || assignee.email : "Unassigned (open)"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium text-gray-500 dark:text-gray-400">Date:</dt>
          <dd className="text-gray-800 dark:text-gray-200">{shift.shift_date}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium text-gray-500 dark:text-gray-400">Time:</dt>
          <dd className="text-gray-800 dark:text-gray-200">
            {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
          </dd>
        </div>
        {shift.notes && (
          <div className="flex gap-2">
            <dt className="font-medium text-gray-500 dark:text-gray-400">Notes:</dt>
            <dd className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{shift.notes}</dd>
          </div>
        )}
      </dl>

      {error && (
        <p className="mt-3 text-sm text-error-600 bg-error-50 border border-error-200 rounded px-3 py-2 dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400">
          {error}
        </p>
      )}

      <div className="flex gap-2 mt-5">
        {isOwnShift && canRequestTrade && shift.status === "scheduled" && (
          <button
            onClick={() => onRequestTrade(shift)}
            className="text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg transition"
          >
            Request Trade
          </button>
        )}
        {canClaim && (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="text-sm font-medium text-white bg-success-600 hover:bg-success-700 disabled:opacity-50 px-4 py-2 rounded-lg transition"
          >
            {claiming ? "Claiming…" : "Claim Shift"}
          </button>
        )}
        <button
          onClick={onClose}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 border border-gray-300 dark:border-gray-700 px-4 py-2 rounded-lg transition"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
