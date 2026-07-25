import { useState } from "react";
import { Shift, TradeRequest, StaffMember, approveTrade, denyTrade } from "../../lib/scheduling";

interface PendingTradesPanelProps {
  trades: TradeRequest[];
  targets: { trade_id: string; user_id: string }[];
  shiftsById: Record<string, Shift>;
  staff: StaffMember[];
  currentUserId: string | null;
  onDecided: () => void;
}

function staffName(staff: StaffMember[], userId: string | null) {
  if (!userId) return "—";
  const s = staff.find((x) => x.user_id === userId);
  return s ? s.display_name || s.email : "Unknown";
}

export default function PendingTradesPanel({ trades, targets, shiftsById, staff, currentUserId, onDecided }: PendingTradesPanelProps) {
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Only ready-for-a-decision trades belong here: a plain drop with no
  // targets needs no peer acceptance step, but an offer to specific
  // coworkers has to be accepted by one of them first.
  const actionable = trades.filter((t) => {
    if (t.status === "accepted") return true;
    if (t.status === "pending") return !targets.some((tg) => tg.trade_id === t.id);
    return false;
  });

  if (actionable.length === 0) return null;

  async function handleApprove(trade: TradeRequest) {
    setActingOn(trade.id);
    setError(null);
    const { error: err } = await approveTrade(trade, currentUserId || "");
    setActingOn(null);
    if (err) setError(err.message);
    else onDecided();
  }

  async function handleDeny(trade: TradeRequest) {
    setActingOn(trade.id);
    setError(null);
    const { error: err } = await denyTrade(trade, currentUserId || "");
    setActingOn(null);
    if (err) setError(err.message);
    else onDecided();
  }

  return (
    <div className="mb-4 rounded-xl border border-warning-200 dark:border-warning-500/30 bg-warning-50 dark:bg-warning-500/10 p-4">
      <p className="text-xs font-semibold text-warning-700 dark:text-warning-400 uppercase tracking-wide mb-3">
        Pending Trade Requests ({actionable.length})
      </p>
      {error && <p className="text-sm text-error-600 dark:text-error-400 mb-2">{error}</p>}
      <div className="space-y-2">
        {actionable.map((trade) => {
          const shift = shiftsById[trade.shift_id];
          const offeredShift = trade.offered_shift_id ? shiftsById[trade.offered_shift_id] : null;
          return (
            <div
              key={trade.id}
              className="flex items-center justify-between gap-3 bg-white dark:bg-white/[0.03] rounded-lg px-3 py-2"
            >
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">{staffName(staff, trade.requested_by)}</span>{" "}
                {trade.accepted_by ? (
                  offeredShift ? (
                    <>
                      and <span className="font-medium">{staffName(staff, trade.accepted_by)}</span> agreed to swap shifts (
                      {offeredShift.role_label}, {offeredShift.shift_date} in exchange)
                    </>
                  ) : (
                    <>
                      wants to give up their shift — <span className="font-medium">{staffName(staff, trade.accepted_by)}</span> accepted it
                    </>
                  )
                ) : (
                  <>wants to drop their shift to open</>
                )}
                {shift && (
                  <span className="text-gray-400">
                    {" "}
                    — {shift.role_label}, {shift.shift_date}
                  </span>
                )}
                {trade.reason && <p className="text-xs text-gray-400 mt-0.5">"{trade.reason}"</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleApprove(trade)}
                  disabled={actingOn === trade.id}
                  className="text-xs font-medium text-white bg-success-600 hover:bg-success-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleDeny(trade)}
                  disabled={actingOn === trade.id}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 border border-gray-300 dark:border-gray-700 px-3 py-1.5 rounded-lg transition"
                >
                  Deny
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
