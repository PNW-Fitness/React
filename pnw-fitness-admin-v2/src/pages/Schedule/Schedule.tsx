import { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg, EventClickArg, EventContentArg } from "@fullcalendar/core";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useModal } from "../../hooks/useModal";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../lib/AuthContext";
import { usePermissions } from "../../lib/PermissionsContext";
import { Shift, ShiftStatus, TradeRequest, StaffMember, loadStaffDirectory } from "../../lib/scheduling";
import AddEditShiftModal from "./AddEditShiftModal";
import ShiftDetailModal from "./ShiftDetailModal";
import TradeRequestModal from "./TradeRequestModal";
import PendingTradesPanel from "./PendingTradesPanel";
import BulkScheduleModal from "./BulkScheduleModal";

interface CalendarEvent extends EventInput {
  extendedProps: { calendar: string };
}

const STATUS_COLOR: Record<ShiftStatus, string> = {
  scheduled: "Primary",
  open: "Warning",
  trade_pending: "Danger",
  completed: "Success",
  no_show: "Warning",
};

function shiftToEvent(shift: Shift, staff: StaffMember[]): CalendarEvent {
  const assignee = staff.find((s) => s.user_id === shift.assigned_to);
  const assigneeLabel = assignee ? assignee.display_name || assignee.email : "Open";
  return {
    id: shift.id,
    title: `${shift.role_label} — ${assigneeLabel}`,
    start: `${shift.shift_date}T${shift.start_time}`,
    end: `${shift.shift_date}T${shift.end_time}`,
    extendedProps: { calendar: STATUS_COLOR[shift.status] },
  };
}

function renderEventContent(eventInfo: EventContentArg) {
  const colorClass = `fc-bg-${String(eventInfo.event.extendedProps.calendar).toLowerCase()}`;
  return (
    <div className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}>
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-time">{eventInfo.timeText}</div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
}

export default function Schedule() {
  const { session } = useAuth();
  const { can, rbacRoleName } = usePermissions();
  const canManageSchedule = can("schedule.manage");
  const canRequestTrade = can("shift_trade.request");
  const canManageTrades = can("shift_trade.manage");
  const currentUserId = session?.user?.id ?? null;

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [trades, setTrades] = useState<TradeRequest[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined);
  const addEditModal = useModal();
  const detailModal = useModal();
  const tradeModal = useModal();
  const bulkModal = useModal();

  const loadShifts = useCallback(async () => {
    const { data } = await supabase.from("staff_shifts").select("*").order("shift_date");
    setShifts((data as Shift[] | null) ?? []);
  }, []);

  const loadTrades = useCallback(async () => {
    if (!canManageTrades) return;
    const { data } = await supabase.from("shift_trade_requests").select("*").eq("status", "pending");
    setTrades((data as TradeRequest[] | null) ?? []);
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

  function handleDateSelect(selectInfo: DateSelectArg) {
    if (!canManageSchedule) return;
    setSelectedShift(null);
    setDefaultDate(selectInfo.startStr);
    addEditModal.openModal();
  }

  function handleEventClick(clickInfo: EventClickArg) {
    const shift = shifts.find((s) => s.id === clickInfo.event.id);
    if (!shift) return;
    setSelectedShift(shift);
    if (canManageSchedule) {
      addEditModal.openModal();
    } else {
      detailModal.openModal();
    }
  }

  function handleRequestTrade(shift: Shift) {
    setSelectedShift(shift);
    detailModal.closeModal();
    tradeModal.openModal();
  }

  const shiftsById = Object.fromEntries(shifts.map((s) => [s.id, s]));
  const events = shifts.map((s) => shiftToEvent(s, staff));

  return (
    <div>
      <PageMeta title="Schedule | PNW Fitness Admin" description="" />
      <PageBreadcrumb pageTitle="Schedule" />

      {canManageTrades && (
        <PendingTradesPanel
          trades={trades}
          shiftsById={shiftsById}
          staff={staff}
          currentUserId={currentUserId}
          onDecided={refreshAll}
        />
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading schedule…</p>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="custom-calendar">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={
                canManageSchedule
                  ? { left: "prev,next addShiftButton bulkScheduleButton", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }
                  : { left: "prev,next", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }
              }
              events={events}
              selectable={canManageSchedule}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventContent={renderEventContent}
              customButtons={{
                addShiftButton: {
                  text: "Add Shift +",
                  click: () => {
                    setSelectedShift(null);
                    setDefaultDate(undefined);
                    addEditModal.openModal();
                  },
                },
                bulkScheduleButton: {
                  text: "Bulk Schedule",
                  click: () => bulkModal.openModal(),
                },
              }}
            />
          </div>
        </div>
      )}

      <AddEditShiftModal
        isOpen={addEditModal.isOpen}
        onClose={addEditModal.closeModal}
        shift={selectedShift}
        defaultDate={defaultDate}
        staff={staff}
        currentUserId={currentUserId}
        onSaved={refreshAll}
      />

      <ShiftDetailModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.closeModal}
        shift={selectedShift}
        staff={staff}
        currentUserId={currentUserId}
        currentUserRoleName={rbacRoleName}
        canRequestTrade={canRequestTrade}
        onRequestTrade={handleRequestTrade}
        onClaimed={refreshAll}
      />

      {currentUserId && (
        <TradeRequestModal
          isOpen={tradeModal.isOpen}
          onClose={tradeModal.closeModal}
          shift={selectedShift}
          currentUserId={currentUserId}
          staff={staff}
          onSubmitted={refreshAll}
        />
      )}

      {canManageSchedule && (
        <BulkScheduleModal
          isOpen={bulkModal.isOpen}
          onClose={bulkModal.closeModal}
          staff={staff}
          currentUserId={currentUserId}
          existingShifts={shifts}
          onSaved={refreshAll}
        />
      )}
    </div>
  );
}
