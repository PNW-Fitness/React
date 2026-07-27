import { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import listPlugin from "@fullcalendar/list";
import type { EventInput, EventClickArg, EventContentArg } from "@fullcalendar/core";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../lib/AuthContext";
import { usePermissions } from "../../lib/PermissionsContext";
import {
  type Shift,
  type TradeRequest,
  type StaffMember,
  loadStaffDirectory,
  loadTradeTargets,
  roleMatchesLabel,
  todayStr,
} from "../../lib/scheduling";
import ShiftDetailSheet from "./ShiftDetailSheet";
import TradeRequestSheet from "./TradeRequestSheet";
import PendingTradesPanel from "./PendingTradesPanel";
import AnnouncementPopup from "./AnnouncementPopup";

interface ScheduleEvent extends EventInput {
  extendedProps: { status: Shift["status"] };
}

function shiftToEvent(shift: Shift, staff: StaffMember[], showAssignee: boolean): ScheduleEvent {
  const assignee = staff.find((s) => s.user_id === shift.assigned_to);
  const assigneeLabel = assignee ? assignee.display_name || assignee.email : "Open";
  return {
    id: shift.id,
    title: showAssignee ? `${shift.role_label} — ${assigneeLabel}` : shift.role_label,
    start: `${shift.shift_date}T${shift.start_time}`,
    end: `${shift.shift_date}T${shift.end_time}`,
    extendedProps: { status: shift.status },
  };
}

function renderEventContent(eventInfo: EventContentArg) {
  const status = eventInfo.event.extendedProps.status as Shift["status"];
  const isOpen = status === "open";
  const isTradePending = status === "trade_pending";
  return (
    <div className="flex items-center gap-2 py-1">
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${isOpen ? "bg-gold" : isTradePending ? "bg-amber-500" : "bg-navy"}`}
      />
      <span className="text-sm font-medium text-navy">{eventInfo.event.title}</span>
      {isTradePending && <span className="text-xs text-amber-600">trade pending</span>}
      {isOpen && <span className="text-xs text-navy/40">open</span>}
    </div>
  );
}

export default function Schedule() {
  const { session } = useAuth();
  const { can, rbacRoleName } = usePermissions();
  const canRequestTrade = can("shift_trade.request");
  const canManageTrades = can("shift_trade.manage");
  const canManageSchedule = can("schedule.manage");
  const currentUserId = session?.user?.id ?? null;

  // Managers land on the whole team's schedule first (that's what they need
  // to actually manage); everyone else lands on their own shifts first, per
  // the manager's own request — both can still flip the toggle either way.
  const [scopeMode, setScopeMode] = useState<"mine" | "team">(canManageSchedule ? "team" : "mine");

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [trades, setTrades] = useState<TradeRequest[]>([]);
  const [tradeTargets, setTradeTargets] = useState<{ trade_id: string; user_id: string }[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [tradeOpen, setTradeOpen] = useState(false);

  const loadShifts = useCallback(async () => {
    const { data } = await supabase.from("staff_shifts").select("*").order("shift_date");
    setShifts((data as Shift[] | null) ?? []);
  }, []);

  const loadTrades = useCallback(async () => {
    if (!canManageTrades) return;
    const { data } = await supabase.from("shift_trade_requests").select("*").in("status", ["pending", "accepted"]);
    setTrades((data as TradeRequest[] | null) ?? []);
    setTradeTargets(await loadTradeTargets());
  }, [canManageTrades]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadShifts(), loadTrades(), loadStaffDirectory().then(setStaff)]);
      setLoading(false);
    }
    init();
  }, [loadShifts, loadTrades]);

  function refreshAll() {
    loadShifts();
    loadTrades();
  }

  function handleEventClick(clickInfo: EventClickArg) {
    const shift = shifts.find((s) => s.id === clickInfo.event.id);
    if (shift) {
      setSelectedShift(shift);
      setDetailOpen(true);
    }
  }

  function handleRequestTrade(shift: Shift) {
    setSelectedShift(shift);
    setDetailOpen(false);
    setTradeOpen(true);
  }

  const shiftsById = Object.fromEntries(shifts.map((s) => [s.id, s]));
  const today = todayStr();
  const myAndOpenShifts = shifts.filter(
    (s) =>
      s.shift_date >= today &&
      (s.assigned_to === currentUserId || (s.status === "open" && roleMatchesLabel(rbacRoleName, s.role_label))),
  );
  // Closed shifts (a manager decided an open slot isn't needed, e.g. no
  // Manager-on-duty required that day) are a record for the admin dashboard
  // only — never shown to employees here, even in whole-schedule view.
  const teamShifts = shifts.filter((s) => s.shift_date >= today && s.status !== "closed");
  const displayedShifts = scopeMode === "mine" ? myAndOpenShifts : teamShifts;
  const events = displayedShifts.map((s) => shiftToEvent(s, staff, scopeMode === "team"));

  return (
    <div>
      <AnnouncementPopup userId={currentUserId} />

      {canManageTrades && (
        <PendingTradesPanel
          trades={trades}
          targets={tradeTargets}
          shiftsById={shiftsById}
          staff={staff}
          currentUserId={currentUserId}
          onDecided={refreshAll}
        />
      )}

      <div className="p-4">
        <div className="flex rounded-xl border border-navy/15 overflow-hidden text-sm font-medium mb-4">
          <button
            onClick={() => setScopeMode("mine")}
            className={`flex-1 py-2.5 transition ${scopeMode === "mine" ? "bg-navy text-white" : "text-navy/60"}`}
          >
            My Schedule
          </button>
          <button
            onClick={() => setScopeMode("team")}
            className={`flex-1 py-2.5 transition ${scopeMode === "team" ? "bg-navy text-white" : "text-navy/60"}`}
          >
            Whole Schedule
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-navy/40">Loading schedule…</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-navy/40">
            {scopeMode === "mine" ? "No upcoming shifts or open shifts for your role." : "No upcoming shifts scheduled."}
          </p>
        ) : (
          <div className="employee-calendar">
            <FullCalendar
              plugins={[listPlugin]}
              initialView="listMonth"
              headerToolbar={{ left: "prev,next", center: "title", right: "" }}
              height="auto"
              events={events}
              eventClick={handleEventClick}
              eventContent={renderEventContent}
              eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
              listDaySideFormat={false}
            />
          </div>
        )}
      </div>

      <ShiftDetailSheet
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        shift={selectedShift}
        staff={staff}
        currentUserId={currentUserId}
        currentUserRoleName={rbacRoleName}
        canRequestTrade={canRequestTrade}
        onRequestTrade={handleRequestTrade}
        onClaimed={refreshAll}
      />

      {currentUserId && (
        <TradeRequestSheet
          isOpen={tradeOpen}
          onClose={() => setTradeOpen(false)}
          shift={selectedShift}
          currentUserId={currentUserId}
          staff={staff}
          onSubmitted={refreshAll}
        />
      )}
    </div>
  );
}
