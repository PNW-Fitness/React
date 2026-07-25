import { useState, useEffect, useCallback } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import { useModal } from "../../hooks/useModal";
import { useAuth } from "../../lib/AuthContext";
import { usePermissions } from "../../lib/PermissionsContext";
import { SELECT_CLS } from "../../lib/leadsHelpers";
import { StaffMember, loadStaffDirectory } from "../../lib/scheduling";
import {
  AvailabilityRule,
  TimeOffRequest,
  BlackoutDate,
  DAY_OF_WEEK_LABELS,
  loadAvailability,
  deleteAvailabilityRule,
  loadMyTimeOff,
  loadPendingTimeOff,
  loadBlackoutDates,
} from "../../lib/timeOff";
import RequestTimeOffModal from "./RequestTimeOffModal";
import AvailabilityRuleModal from "./AvailabilityRuleModal";
import PendingTimeOffPanel from "./PendingTimeOffPanel";
import BlackoutDatesPanel from "./BlackoutDatesPanel";

const STATUS_BADGE: Record<string, "warning" | "success" | "error"> = {
  pending: "warning",
  approved: "success",
  denied: "error",
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

  const requestModal = useModal();
  const ruleModal = useModal();

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

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>;

  return (
    <div>
      <PageMeta title="Time Off | PNW Fitness Admin" description="" />
      <PageBreadcrumb pageTitle="Time Off" />

      {canManage && (
        <PendingTimeOffPanel requests={pendingTimeOff} staff={staff} currentUserId={currentUserId} onDecided={refresh} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ComponentCard title="Time Off Requests">
          <button
            onClick={requestModal.openModal}
            className="text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg transition mb-4"
          >
            Request Time Off
          </button>
          {myTimeOff.length === 0 ? (
            <p className="text-sm text-gray-400">No time-off requests yet.</p>
          ) : (
            <div className="space-y-2">
              {myTimeOff.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-white/[0.03] rounded-lg px-3 py-2">
                  <span className="text-gray-700 dark:text-gray-300">
                    {r.reason.charAt(0).toUpperCase() + r.reason.slice(1)} · {r.start_date} to {r.end_date}
                  </span>
                  <Badge size="sm" color={STATUS_BADGE[r.status]}>
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </ComponentCard>

        <ComponentCard
          title="Availability"
          desc={canManage ? "Viewing rules for the selected team member." : undefined}
        >
          {canManage && staff.length > 0 && (
            <div className="mb-4 max-w-xs">
              <select
                value={targetUserId ?? ""}
                onChange={(e) => setTargetUserId(e.target.value)}
                className={`${SELECT_CLS} w-full`}
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
            </div>
          )}
          <button
            onClick={ruleModal.openModal}
            className="text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg transition mb-4"
          >
            Add Rule
          </button>
          {availability.length === 0 ? (
            <p className="text-sm text-gray-400">No availability rules set.</p>
          ) : (
            <div className="space-y-2">
              {availability.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-white/[0.03] rounded-lg px-3 py-2">
                  <span className="text-gray-700 dark:text-gray-300">
                    {describeRule(rule)}
                    {rule.note && <span className="text-gray-400"> — "{rule.note}"</span>}
                  </span>
                  <button onClick={() => handleDeleteRule(rule.id)} className="text-xs text-error-500 hover:text-error-600">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </ComponentCard>
      </div>

      {canManage && (
        <BlackoutDatesPanel blackoutDates={blackoutDates} currentUserId={currentUserId} onChanged={refresh} />
      )}

      {currentUserId && (
        <RequestTimeOffModal
          isOpen={requestModal.isOpen}
          onClose={requestModal.closeModal}
          userId={currentUserId}
          onSubmitted={refresh}
        />
      )}
      {targetUserId && (
        <AvailabilityRuleModal
          isOpen={ruleModal.isOpen}
          onClose={ruleModal.closeModal}
          targetUserId={targetUserId}
          currentUserId={currentUserId}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
