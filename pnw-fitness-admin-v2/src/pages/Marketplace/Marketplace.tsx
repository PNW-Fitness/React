import { useState, useEffect, useCallback } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Badge from "../../components/ui/badge/Badge";
import { useModal } from "../../hooks/useModal";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../lib/AuthContext";
import { usePermissions } from "../../lib/PermissionsContext";
import {
  Shift,
  StaffMember,
  TradeRequest,
  loadStaffDirectory,
  loadTradeTargets,
  roleMatchesLabel,
  claimShift,
  todayStr,
} from "../../lib/scheduling";
import TradeRequestModal from "../Schedule/TradeRequestModal";
import AcceptTradeModal from "./AcceptTradeModal";

type Tab = "available" | "mine" | "activity";

function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function staffName(staff: StaffMember[], userId: string | null) {
  if (!userId) return "—";
  const s = staff.find((x) => x.user_id === userId);
  return s ? s.display_name || s.email : "Unknown";
}

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
  const tradeModal = useModal();

  const [respondingTrade, setRespondingTrade] = useState<TradeRequest | null>(null);
  const acceptModal = useModal();

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

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>;

  const today = todayStr();
  const shiftsById = Object.fromEntries(shifts.map((s) => [s.id, s]));

  const availableShifts = shifts.filter(
    (s) => s.status === "open" && s.shift_date >= today && roleMatchesLabel(rbacRoleName, s.role_label)
  );

  const myUpcomingShifts = shifts.filter(
    (s) => s.assigned_to === currentUserId && s.status === "scheduled" && s.shift_date >= today
  );

  const myTargetTradeIds = new Set(targets.filter((t) => t.user_id === currentUserId).map((t) => t.trade_id));
  const needsMyResponse = trades.filter(
    (t) => t.status === "pending" && !t.accepted_by && myTargetTradeIds.has(t.id) && t.requested_by !== currentUserId
  );

  const myActivity = trades.filter((t) => t.requested_by === currentUserId || t.accepted_by === currentUserId);

  function statusLabel(t: TradeRequest): { text: string; color: "warning" | "success" | "error" | "light" } {
    if (t.status === "denied") return { text: "Denied", color: "error" };
    if (t.status === "approved") return { text: "Approved", color: "success" };
    if (t.status === "accepted") return { text: "Accepted — waiting for manager approval", color: "warning" };
    const hasTargets = targets.some((tg) => tg.trade_id === t.id);
    if (hasTargets) return { text: "Waiting for someone to accept", color: "light" };
    return { text: "Waiting for manager approval", color: "warning" };
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
    tradeModal.openModal();
  }

  function openRespond(trade: TradeRequest) {
    setRespondingTrade(trade);
    acceptModal.openModal();
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "available", label: "Available Shifts" },
    { key: "mine", label: "Give Away / Swap" },
    { key: "activity", label: "Activity" },
  ];

  return (
    <div>
      <PageMeta title="Shift Marketplace | PNW Fitness Admin" description="" />
      <PageBreadcrumb pageTitle="Shift Marketplace" />

      <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm font-medium mb-4 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 transition ${tab === t.key ? "bg-brand-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03]"}`}
          >
            {t.label}
            {t.key === "activity" && needsMyResponse.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[10px] rounded-full bg-error-500 text-white">
                {needsMyResponse.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "available" && (
        <div className="space-y-2">
          {claimError && <p className="text-sm text-error-600 dark:text-error-400">{claimError}</p>}
          {availableShifts.length === 0 ? (
            <p className="text-sm text-gray-400">No open shifts match your role right now.</p>
          ) : (
            availableShifts.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-white/[0.03] px-4 py-3">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{s.role_label}</span> — {s.shift_date}, {fmtTime(s.start_time)}–{fmtTime(s.end_time)}
                </span>
                <button
                  onClick={() => handleClaim(s.id)}
                  disabled={claimingId === s.id}
                  className="text-xs font-medium text-white bg-success-600 hover:bg-success-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition"
                >
                  {claimingId === s.id ? "Claiming…" : "Claim Shift"}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "mine" && (
        <div className="space-y-2">
          {myUpcomingShifts.length === 0 ? (
            <p className="text-sm text-gray-400">You have no upcoming shifts to give away or swap.</p>
          ) : (
            myUpcomingShifts.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-white/[0.03] px-4 py-3">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{s.role_label}</span> — {s.shift_date}, {fmtTime(s.start_time)}–{fmtTime(s.end_time)}
                </span>
                <button
                  onClick={() => openTradeFor(s)}
                  className="text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-lg transition"
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
              <p className="text-xs font-semibold text-warning-700 dark:text-warning-400 uppercase tracking-wide mb-2">
                Needs Your Response
              </p>
              <div className="space-y-2">
                {needsMyResponse.map((t) => {
                  const shift = shiftsById[t.shift_id];
                  return (
                    <div key={t.id} className="flex items-center justify-between rounded-lg bg-warning-50 dark:bg-warning-500/10 px-4 py-3">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">{staffName(staff, t.requested_by)}</span> wants to give up{" "}
                        {shift ? `${shift.role_label} — ${shift.shift_date}, ${fmtTime(shift.start_time)}–${fmtTime(shift.end_time)}` : "a shift"}
                        {t.reason && <span className="text-gray-400"> ("{t.reason}")</span>}
                      </span>
                      <button
                        onClick={() => openRespond(t)}
                        className="text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-lg transition flex-shrink-0"
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
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">My Activity</p>
            {myActivity.length === 0 ? (
              <p className="text-sm text-gray-400">No trade activity yet.</p>
            ) : (
              <div className="space-y-2">
                {myActivity.map((t) => {
                  const shift = shiftsById[t.shift_id];
                  const label = statusLabel(t);
                  return (
                    <div key={t.id} className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-white/[0.03] px-4 py-3">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {shift ? `${shift.role_label} — ${shift.shift_date}, ${fmtTime(shift.start_time)}–${fmtTime(shift.end_time)}` : "Shift"}
                        {t.requested_by === currentUserId ? " (you offered this)" : " (you accepted this)"}
                      </span>
                      <Badge size="sm" color={label.color}>
                        {label.text}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {currentUserId && (
        <TradeRequestModal
          isOpen={tradeModal.isOpen}
          onClose={tradeModal.closeModal}
          shift={tradeShift}
          currentUserId={currentUserId}
          staff={staff}
          onSubmitted={refresh}
        />
      )}

      {currentUserId && respondingTrade && (
        <AcceptTradeModal
          isOpen={acceptModal.isOpen}
          onClose={acceptModal.closeModal}
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
