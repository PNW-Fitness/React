import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../lib/AuthContext";
import { usePermissions } from "../../lib/PermissionsContext";
import {
  type Shift,
  type StaffMember,
  type TradeRequest,
  loadStaffDirectory,
  loadTradeTargets,
  roleMatchesLabel,
  claimShift,
  todayStr,
} from "../../lib/scheduling";
import { formatTime, staffName } from "../../lib/time";
import TradeRequestSheet from "../Schedule/TradeRequestSheet";
import AcceptTradeSheet from "./AcceptTradeSheet";

type Tab = "available" | "mine" | "activity";

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  denied: { text: "Denied", className: "bg-red-100 text-red-700" },
  approved: { text: "Approved", className: "bg-emerald-100 text-emerald-700" },
  accepted: { text: "Accepted — waiting on manager", className: "bg-gold/20 text-navy" },
};

export default function Marketplace() {
  const { session } = useAuth();
  const { rbacRoleName } = usePermissions();
  const currentUserId = session?.user?.id ?? null;

  const [tab, setTab] = useState<Tab>("available");
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [trades, setTrades] = useState<TradeRequest[]>([]);
  const [targets, setTargets] = useState<{ trade_id: string; user_id: string }[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  const [tradeShift, setTradeShift] = useState<Shift | null>(null);
  const [tradeOpen, setTradeOpen] = useState(false);

  const [respondingTrade, setRespondingTrade] = useState<TradeRequest | null>(null);
  const [acceptOpen, setAcceptOpen] = useState(false);

  const refresh = useCallback(async () => {
    const [{ data: shiftData }, { data: tradeData }, targetData] = await Promise.all([
      supabase.from("staff_shifts").select("*").order("shift_date"),
      supabase.from("shift_trade_requests").select("*").order("created_at", { ascending: false }),
      loadTradeTargets(),
    ]);
    setShifts((shiftData as Shift[] | null) ?? []);
    setTrades((tradeData as TradeRequest[] | null) ?? []);
    setTargets(targetData);
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([refresh(), loadStaffDirectory().then(setStaff)]);
      setLoading(false);
    }
    init();
  }, [refresh]);

  if (loading) return <p className="p-4 text-sm text-navy/40">Loading…</p>;

  const today = todayStr();
  const shiftsById = Object.fromEntries(shifts.map((s) => [s.id, s]));

  const availableShifts = shifts.filter(
    (s) => s.status === "open" && s.shift_date >= today && roleMatchesLabel(rbacRoleName, s.role_label),
  );

  const myUpcomingShifts = shifts.filter(
    (s) => s.assigned_to === currentUserId && s.status === "scheduled" && s.shift_date >= today,
  );

  const myTargetTradeIds = new Set(targets.filter((t) => t.user_id === currentUserId).map((t) => t.trade_id));
  const needsMyResponse = trades.filter(
    (t) => t.status === "pending" && !t.accepted_by && myTargetTradeIds.has(t.id) && t.requested_by !== currentUserId,
  );

  const myActivity = trades.filter((t) => t.requested_by === currentUserId || t.accepted_by === currentUserId);

  function statusLabel(t: TradeRequest) {
    if (STATUS_LABEL[t.status]) return STATUS_LABEL[t.status];
    const hasTargets = targets.some((tg) => tg.trade_id === t.id);
    if (hasTargets) return { text: "Waiting for someone to accept", className: "bg-navy/5 text-navy/60" };
    return { text: "Waiting for manager approval", className: "bg-gold/20 text-navy" };
  }

  async function handleClaim(shiftId: string) {
    if (!currentUserId) return;
    setClaimingId(shiftId);
    setClaimError(null);
    const { error } = await claimShift(shiftId, currentUserId);
    setClaimingId(null);
    if (error) {
      setClaimError(error.message);
      return;
    }
    refresh();
  }

  function openTradeFor(shift: Shift) {
    setTradeShift(shift);
    setTradeOpen(true);
  }

  function openRespond(trade: TradeRequest) {
    setRespondingTrade(trade);
    setAcceptOpen(true);
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "available", label: "Available" },
    { key: "mine", label: "Give Away" },
    { key: "activity", label: "Activity" },
  ];

  return (
    <div className="p-4">
      <div className="flex rounded-xl border border-navy/15 overflow-hidden text-sm font-medium mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 relative transition ${tab === t.key ? "bg-navy text-white" : "text-navy/60"}`}
          >
            {t.label}
            {t.key === "activity" && needsMyResponse.length > 0 && (
              <span className="absolute top-1 right-3 inline-flex items-center justify-center w-4 h-4 text-[10px] rounded-full bg-red-500 text-white">
                {needsMyResponse.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "available" && (
        <div className="space-y-2">
          {claimError && <p className="text-sm text-red-600">{claimError}</p>}
          {availableShifts.length === 0 ? (
            <p className="text-sm text-navy/40">No open shifts match your role right now.</p>
          ) : (
            availableShifts.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-xl bg-white border border-navy/10 px-4 py-3">
                <span className="text-sm text-navy">
                  <span className="font-medium">{s.role_label}</span>
                  <br />
                  <span className="text-navy/50">{s.shift_date}, {formatTime(s.start_time)}–{formatTime(s.end_time)}</span>
                </span>
                <button
                  onClick={() => handleClaim(s.id)}
                  disabled={claimingId === s.id}
                  className="text-xs font-bold text-white bg-navy disabled:opacity-50 px-3 py-2 rounded-lg shrink-0"
                >
                  {claimingId === s.id ? "Claiming…" : "Claim"}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "mine" && (
        <div className="space-y-2">
          {myUpcomingShifts.length === 0 ? (
            <p className="text-sm text-navy/40">You have no upcoming shifts to give away or swap.</p>
          ) : (
            myUpcomingShifts.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-xl bg-white border border-navy/10 px-4 py-3">
                <span className="text-sm text-navy">
                  <span className="font-medium">{s.role_label}</span>
                  <br />
                  <span className="text-navy/50">{s.shift_date}, {formatTime(s.start_time)}–{formatTime(s.end_time)}</span>
                </span>
                <button
                  onClick={() => openTradeFor(s)}
                  className="text-xs font-bold text-navy bg-gold px-3 py-2 rounded-lg shrink-0"
                >
                  Drop / Swap
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "activity" && (
        <div className="space-y-6">
          {needsMyResponse.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-navy/50 uppercase tracking-wide mb-2">Needs Your Response</p>
              <div className="space-y-2">
                {needsMyResponse.map((t) => {
                  const shift = shiftsById[t.shift_id];
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl bg-gold/10 border border-gold/30 px-4 py-3">
                      <span className="text-sm text-navy">
                        <span className="font-medium">{staffName(staff, t.requested_by)}</span> wants to give up{" "}
                        {shift ? `${shift.role_label} — ${shift.shift_date}, ${formatTime(shift.start_time)}–${formatTime(shift.end_time)}` : "a shift"}
                        {t.reason && <span className="text-navy/40"> ("{t.reason}")</span>}
                      </span>
                      <button
                        onClick={() => openRespond(t)}
                        className="text-xs font-bold text-navy bg-gold px-3 py-2 rounded-lg shrink-0"
                      >
                        Respond
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-navy/50 uppercase tracking-wide mb-2">My Activity</p>
            {myActivity.length === 0 ? (
              <p className="text-sm text-navy/40">No trade activity yet.</p>
            ) : (
              <div className="space-y-2">
                {myActivity.map((t) => {
                  const shift = shiftsById[t.shift_id];
                  const label = statusLabel(t);
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl bg-white border border-navy/10 px-4 py-3">
                      <span className="text-sm text-navy">
                        {shift ? `${shift.role_label} — ${shift.shift_date}, ${formatTime(shift.start_time)}–${formatTime(shift.end_time)}` : "Shift"}
                        <br />
                        <span className="text-navy/40 text-xs">
                          {t.requested_by === currentUserId ? "you offered this" : "you accepted this"}
                        </span>
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${label.className}`}>
                        {label.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {currentUserId && (
        <TradeRequestSheet
          isOpen={tradeOpen}
          onClose={() => setTradeOpen(false)}
          shift={tradeShift}
          currentUserId={currentUserId}
          staff={staff}
          onSubmitted={refresh}
        />
      )}

      {currentUserId && respondingTrade && (
        <AcceptTradeSheet
          isOpen={acceptOpen}
          onClose={() => setAcceptOpen(false)}
          trade={respondingTrade}
          shift={shiftsById[respondingTrade.shift_id] ?? null}
          myShifts={myUpcomingShifts.filter((s) => s.id !== respondingTrade.shift_id)}
          currentUserId={currentUserId}
          onAccepted={refresh}
        />
      )}
    </div>
  );
}
