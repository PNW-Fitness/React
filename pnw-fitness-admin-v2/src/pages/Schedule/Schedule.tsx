import { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg, EventClickArg, EventContentArg, DatesSetArg } from "@fullcalendar/core";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useModal } from "../../hooks/useModal";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../lib/AuthContext";
import { usePermissions } from "../../lib/PermissionsContext";
import {
  Shift,
  TradeRequest,
  StaffMember,
  loadStaffDirectory,
  staffColor,
  OPEN_SHIFT_COLOR,
  mondayOfWeek,
  addDaysToDate,
  loadTradeTargets,
} from "../../lib/scheduling";
import AddEditShiftModal from "./AddEditShiftModal";
import ShiftDetailModal from "./ShiftDetailModal";
import TradeRequestModal from "./TradeRequestModal";
import PendingTradesPanel from "./PendingTradesPanel";
import BulkScheduleModal from "./BulkScheduleModal";
import PrintScheduleView from "./PrintScheduleView";
import PublishModal from "./PublishModal";
import GridView from "./GridView";
import TemplatesModal from "./TemplatesModal";

type ViewMode = "calendar" | "employee" | "role";
type ScopeMode = "team" | "mine";

interface CalendarEvent extends EventInput {
  extendedProps: { tradePending: boolean; published: boolean };
}

// Events are colored by the assignee (each staff member picks their own
// color in Users & Roles), not by status — the manager specifically wants
// to identify people by color at a glance, Homebase-style. Open shifts get
// a neutral gray instead of any person's color. A pending trade keeps the
// assignee's color but gets an amber outline + a small icon, so that signal
// isn't lost.
function shiftToEvent(shift: Shift, staff: StaffMember[]): CalendarEvent {
  const assignee = staff.find((s) => s.user_id === shift.assigned_to);
  const assigneeLabel = assignee ? assignee.display_name || assignee.email : "Open";
  const isOpen = shift.status === "open";
  const isTradePending = shift.status === "trade_pending";
  const color = isOpen ? OPEN_SHIFT_COLOR : staffColor(assignee);
  return {
    id: shift.id,
    title: `${shift.role_label} — ${assigneeLabel}`,
    start: `${shift.shift_date}T${shift.start_time}`,
    end: `${shift.shift_date}T${shift.end_time}`,
    backgroundColor: color,
    borderColor: isTradePending ? "#f59e0b" : color,
    textColor: isOpen ? "#374151" : "#ffffff",
    extendedProps: { tradePending: isTradePending, published: shift.published },
  };
}

// Month view renders timed events as "dot" events by default, where
// FullCalendar only colors a small dot and leaves backgroundColor/
// borderColor/textColor unapplied — those only take effect automatically
// in "block" display mode. Rather than fight that per-view, the color chip
// is built here directly from the event's own color fields (still present
// on the event object either way), so it looks the same in month/week/day.
function renderEventContent(eventInfo: EventContentArg) {
  const { backgroundColor, borderColor, textColor } = eventInfo.event;
  const isDraft = eventInfo.event.extendedProps.published === false;
  return (
    <div
      className="flex items-center gap-1 px-1 py-0.5 rounded-sm overflow-hidden w-full"
      style={{
        backgroundColor,
        border: `1px ${isDraft ? "dashed" : "solid"} ${borderColor || backgroundColor}`,
        color: textColor,
        opacity: isDraft ? 0.7 : 1,
      }}
    >
      {eventInfo.event.extendedProps.tradePending && <span title="Trade pending">⇄</span>}
      {isDraft && <span title="Draft — not published yet">📝</span>}
      <span className="text-[11px] opacity-90 shrink-0">{eventInfo.timeText}</span>
      <span className="text-xs font-medium truncate">{eventInfo.event.title}</span>
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
  const [tradeTargets, setTradeTargets] = useState<{ trade_id: string; user_id: string }[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined);
  const today = new Date();
  const [printYear, setPrintYear] = useState(today.getFullYear());
  const [printMonth, setPrintMonth] = useState(today.getMonth());
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [scopeMode, setScopeMode] = useState<ScopeMode>("team");
  const [gridWeekStart, setGridWeekStart] = useState(mondayOfWeek(today));
  const addEditModal = useModal();
  const detailModal = useModal();
  const tradeModal = useModal();
  const bulkModal = useModal();
  const publishModal = useModal();
  const templatesModal = useModal();

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

  function handleDateSelect(selectInfo: DateSelectArg) {
    if (!canManageSchedule) return;
    setSelectedShift(null);
    setDefaultDate(selectInfo.startStr);
    addEditModal.openModal();
  }

  function handleShiftClick(shift: Shift) {
    setSelectedShift(shift);
    if (canManageSchedule) {
      addEditModal.openModal();
    } else {
      detailModal.openModal();
    }
  }

  function handleEventClick(clickInfo: EventClickArg) {
    const shift = shifts.find((s) => s.id === clickInfo.event.id);
    if (shift) handleShiftClick(shift);
  }

  function handleRequestTrade(shift: Shift) {
    setSelectedShift(shift);
    detailModal.closeModal();
    tradeModal.openModal();
  }

  // Tracks the actual month shown (currentStart skips the leading/trailing
  // padding days from the FullCalendar month grid) so the Print button
  // always prints whatever month is currently on screen.
  function handleDatesSet(dateInfo: DatesSetArg) {
    const mid = new Date(dateInfo.view.currentStart);
    setPrintYear(mid.getFullYear());
    setPrintMonth(mid.getMonth());
  }

  function handlePrint() {
    window.print();
  }

  function shiftWeek(delta: number) {
    setGridWeekStart((w) => addDaysToDate(w, delta * 7));
  }

  const shiftsById = Object.fromEntries(shifts.map((s) => [s.id, s]));
  const scopedShifts = scopeMode === "mine" ? shifts.filter((s) => s.assigned_to === currentUserId) : shifts;
  const events = scopedShifts.map((s) => shiftToEvent(s, staff));
  const draftCount = shifts.filter((s) => !s.published).length;

  return (
    <div>
      <PageMeta title="Schedule | PNW Fitness Admin" description="" />
      <PageBreadcrumb pageTitle="Schedule" />

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

      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm font-medium">
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-3 py-1.5 transition ${viewMode === "calendar" ? "bg-brand-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03]"}`}
          >
            Calendar
          </button>
          {canManageSchedule && (
            <>
              <button
                onClick={() => setViewMode("employee")}
                className={`px-3 py-1.5 transition ${viewMode === "employee" ? "bg-brand-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03]"}`}
              >
                Employee View
              </button>
              <button
                onClick={() => setViewMode("role")}
                className={`px-3 py-1.5 transition ${viewMode === "role" ? "bg-brand-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03]"}`}
              >
                Role View
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm font-medium">
          <button
            onClick={() => setScopeMode("team")}
            className={`px-3 py-1.5 transition ${scopeMode === "team" ? "bg-brand-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03]"}`}
          >
            Team Schedule
          </button>
          <button
            onClick={() => setScopeMode("mine")}
            className={`px-3 py-1.5 transition ${scopeMode === "mine" ? "bg-brand-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03]"}`}
          >
            My Schedule
          </button>
        </div>

        {canManageSchedule && (
          <button
            onClick={templatesModal.openModal}
            className="text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition"
          >
            Templates
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading schedule…</p>
      ) : viewMode !== "calendar" ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => shiftWeek(-1)}
              className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
            >
              ‹
            </button>
            <button
              onClick={() => shiftWeek(1)}
              className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
            >
              ›
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Week of {addDaysToDate(gridWeekStart, -1)}
            </span>
          </div>
          <GridView
            mode={viewMode}
            shifts={scopedShifts}
            staff={staff}
            weekStart={gridWeekStart}
            onShiftClick={handleShiftClick}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="custom-calendar">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={
                canManageSchedule
                  ? { left: "prev,next addShiftButton bulkScheduleButton publishButton printButton", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }
                  : { left: "prev,next printButton", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }
              }
              events={events}
              selectable={canManageSchedule}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventContent={renderEventContent}
              datesSet={handleDatesSet}
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
                publishButton: {
                  text: `Publish (${draftCount})`,
                  click: () => publishModal.openModal(),
                },
                printButton: {
                  text: "Print Month",
                  click: handlePrint,
                },
              }}
            />
          </div>
        </div>
      )}

      <PrintScheduleView year={printYear} month={printMonth} shifts={shifts} staff={staff} />

      <AddEditShiftModal
        isOpen={addEditModal.isOpen}
        onClose={addEditModal.closeModal}
        shift={selectedShift}
        defaultDate={defaultDate}
        staff={staff}
        allShifts={shifts}
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

      {canManageSchedule && (
        <PublishModal
          isOpen={publishModal.isOpen}
          onClose={publishModal.closeModal}
          draftCount={draftCount}
          onPublished={refreshAll}
        />
      )}

      {canManageSchedule && (
        <TemplatesModal
          isOpen={templatesModal.isOpen}
          onClose={templatesModal.closeModal}
          allShifts={shifts}
          currentUserId={currentUserId}
          onApplied={refreshAll}
        />
      )}
    </div>
  );
}
