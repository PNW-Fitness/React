import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../lib/AuthContext";
import { usePermissions } from "../../lib/PermissionsContext";
import { type StaffMember, loadStaffDirectory } from "../../lib/scheduling";
import {
  type AvailabilityRule,
  type TimeOffRequest,
  type BlackoutDate,
  DAY_OF_WEEK_LABELS,
  loadAvailability,
  deleteAvailabilityRule,
  loadMyTimeOff,
  loadPendingTimeOff,
  loadBlackoutDates,
} from "../../lib/timeOff";
import RequestTimeOffSheet from "./RequestTimeOffSheet";
import AvailabilityRuleSheet from "./AvailabilityRuleSheet";
import PendingTimeOffPanel from "./PendingTimeOffPanel";
import BlackoutDatesPanel from "./BlackoutDatesPanel";

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-gold/20 text-navy",
  approved: "bg-emerald-100 text-emerald-700",
  denied: "bg-red-100 text-red-700",
};

function describeRule(rule: AvailabilityRule) {
  const statusLabel = rule.status.charAt(0).toUpperCase() + rule.status.slice(1);
  const timeLabel =
    rule.start_time && rule.end_time ? `${rule.start_time.slice(0, 5)}–${rule.end_time.slice(0, 5)}` : "All day";
  if (rule.kind === "recurring") {
    const day = DAY_OF_WEEK_LABELS[rule.day_of_week ?? 0];
    const until = rule.end_date ? ` until ${rule.end_date}` : "";
    return `${statusLabel} every ${day}, ${timeLabel}${until}`;
  }
  return `${statusLabel} ${rule.start_date} to ${rule.end_date}, ${timeLabel}`;
}

export default function TimeOff() {
  const { session } = useAuth();
  const { can } = usePermissions();
  const canManage = can("time_off.manage");
  const currentUserId = session?.user?.id ?? null;

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [targetUserId, setTargetUserId] = useState<string | null>(currentUserId);
  const [myTimeOff, setMyTimeOff] = useState<TimeOffRequest[]>([]);
  const [pendingTimeOff, setPendingTimeOff] = useState<TimeOffRequest[]>([]);
  const [availability, setAvailability] = useState<AvailabilityRule[]>([]);
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([]);
  const [loading, setLoading] = useState(true);

  const [requestOpen, setRequestOpen] = useState(false);
  const [ruleOpen, setRuleOpen] = useState(false);

  useEffect(() => {
    if (currentUserId && !targetUserId) setTargetUserId(currentUserId);
  }, [currentUserId, targetUserId]);

  // Time-off requests are always scoped to the logged-in user themselves —
  // RLS only allows submitting a request where user_id = auth.uid(), so the
  // staff-picker below only ever applies to Availability, which managers
  // genuinely can set on someone else's behalf per the spec.
  const refresh = useCallback(async () => {
    if (!currentUserId || !targetUserId) return;
    const tasks: Promise<void>[] = [
      loadMyTimeOff(currentUserId).then(setMyTimeOff),
      loadAvailability(targetUserId).then(setAvailability),
      loadBlackoutDates().then(setBlackoutDates),
    ];
    if (canManage) tasks.push(loadPendingTimeOff().then(setPendingTimeOff));
    await Promise.all(tasks);
  }, [currentUserId, targetUserId, canManage]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      if (canManage) await loadStaffDirectory().then(setStaff);
      await refresh();
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId]);

  async function handleDeleteRule(id: string) {
    await deleteAvailabilityRule(id);
    refresh();
  }

  if (loading) return <p className="p-4 text-sm text-navy/40">Loading…</p>;

  return (
    <div className="p-4 space-y-4">
      {canManage && (
        <PendingTimeOffPanel requests={pendingTimeOff} staff={staff} currentUserId={currentUserId} onDecided={refresh} />
      )}

      <div className="bg-white rounded-xl border border-navy/10 p-4">
        <p className="text-sm font-bold text-navy mb-3">My Time Off</p>
        <button
          onClick={() => setRequestOpen(true)}
          className="text-sm font-bold text-navy bg-gold px-4 py-2 rounded-xl mb-3"
        >
          Request Time Off
        </button>
        {myTimeOff.length === 0 ? (
          <p className="text-sm text-navy/40">No time-off requests yet.</p>
        ) : (
          <div className="space-y-2">
            {myTimeOff.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 text-sm bg-navy/5 rounded-lg px-3 py-2">
                <span className="text-navy">
                  {r.reason.charAt(0).toUpperCase() + r.reason.slice(1)} · {r.start_date} to {r.end_date}
                </span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${STATUS_CLASS[r.status]}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-navy/10 p-4">
        <p className="text-sm font-bold text-navy mb-1">Availability</p>
        {canManage && <p className="text-xs text-navy/50 mb-3">Viewing rules for the selected team member.</p>}

        {canManage && staff.length > 0 && (
          <select
            value={targetUserId ?? ""}
            onChange={(e) => setTargetUserId(e.target.value)}
            className="w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm text-navy mb-3"
          >
            {currentUserId && <option value={currentUserId}>Myself</option>}
            {staff
              .filter((s) => s.user_id !== currentUserId)
              .map((s) => (
                <option key={s.user_id} value={s.user_id}>
                  {s.display_name || s.email}
                </option>
              ))}
          </select>
        )}

        <button
          onClick={() => setRuleOpen(true)}
          className="text-sm font-bold text-navy bg-gold px-4 py-2 rounded-xl mb-3"
        >
          Add Rule
        </button>

        {availability.length === 0 ? (
          <p className="text-sm text-navy/40">No availability rules set.</p>
        ) : (
          <div className="space-y-2">
            {availability.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between gap-2 text-sm bg-navy/5 rounded-lg px-3 py-2">
                <span className="text-navy">
                  {describeRule(rule)}
                  {rule.note && <span className="text-navy/40"> — "{rule.note}"</span>}
                </span>
                <button onClick={() => handleDeleteRule(rule.id)} className="text-xs text-red-500 shrink-0">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {canManage && (
        <BlackoutDatesPanel blackoutDates={blackoutDates} currentUserId={currentUserId} onChanged={refresh} />
      )}

      {currentUserId && (
        <RequestTimeOffSheet
          isOpen={requestOpen}
          onClose={() => setRequestOpen(false)}
          userId={currentUserId}
          onSubmitted={refresh}
        />
      )}
      {targetUserId && (
        <AvailabilityRuleSheet
          isOpen={ruleOpen}
          onClose={() => setRuleOpen(false)}
          targetUserId={targetUserId}
          currentUserId={currentUserId}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
