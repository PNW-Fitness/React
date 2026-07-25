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

interface ScheduleEvent extends EventInput {
  extendedProps: { status: Shift["status"] };
}

function shiftToEvent(shift: Shift): ScheduleEvent {
  return {
    id: shift.id,
    title: shift.role_label,
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
  const currentUserId = session?.user?.id ?? null;

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
  const events = myAndOpenShifts.map(shiftToEvent);

  return (
    <div>
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
        {loading ? (
          <p className="text-sm text-navy/40">Loading schedule…</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-navy/40">No upcoming shifts or open shifts for your role.</p>
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
