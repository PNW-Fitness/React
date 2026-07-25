import { useState } from "react";
import { type Shift, type TradeRequest, type StaffMember, approveTrade, denyTrade } from "../../lib/scheduling";
import { staffName } from "../../lib/time";

interface PendingTradesPanelProps {
  trades: TradeRequest[];
  targets: { trade_id: string; user_id: string }[];
  shiftsById: Record<string, Shift>;
  staff: StaffMember[];
  currentUserId: string | null;
  onDecided: () => void;
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
    <div className="mx-4 mt-3 rounded-xl border border-gold/40 bg-gold/10 p-4">
      <p className="text-xs font-semibold text-navy/70 uppercase tracking-wide mb-3">
        Pending Trade Requests ({actionable.length})
      </p>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <div className="space-y-2">
        {actionable.map((trade) => {
          const shift = shiftsById[trade.shift_id];
          const offeredShift = trade.offered_shift_id ? shiftsById[trade.offered_shift_id] : null;
          return (
            <div key={trade.id} className="bg-white rounded-lg px-3 py-2.5">
              <p className="text-sm text-navy">
                <span className="font-medium">{staffName(staff, trade.requested_by)}</span>{" "}
                {trade.accepted_by ? (
                  offeredShift ? (
                    <>
                      and <span className="font-medium">{staffName(staff, trade.accepted_by)}</span> agreed to swap
                      shifts ({offeredShift.role_label}, {offeredShift.shift_date} in exchange)
                    </>
                  ) : (
                    <>
                      wants to give up their shift — <span className="font-medium">{staffName(staff, trade.accepted_by)}</span> accepted it
                    </>
                  )
                ) : (
                  <>wants to drop their shift to open</>
                )}
                {shift && <span className="text-navy/40"> — {shift.role_label}, {shift.shift_date}</span>}
              </p>
              {trade.reason && <p className="text-xs text-navy/40 mt-0.5">"{trade.reason}"</p>}
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => handleApprove(trade)}
                  disabled={actingOn === trade.id}
                  className="text-xs font-bold text-white bg-navy disabled:opacity-50 px-3 py-1.5 rounded-lg"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleDeny(trade)}
                  disabled={actingOn === trade.id}
                  className="text-xs text-navy/60 border border-navy/15 px-3 py-1.5 rounded-lg"
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
