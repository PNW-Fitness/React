import { Shift, StaffMember, staffColor, OPEN_SHIFT_COLOR } from "../../lib/scheduling";

interface PrintScheduleViewProps {
  year: number;
  month: number; // 0-indexed, matches Date.getMonth()
  shifts: Shift[];
  staff: StaffMember[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "p" : "a";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour}${period}` : `${hour}:${String(m).padStart(2, "0")}${period}`;
}

function buildWeeks(year: number, month: number): Date[][] {
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - firstOfMonth.getDay());

  const lastOfMonth = new Date(year, month + 1, 0);
  const gridEnd = new Date(lastOfMonth);
  gridEnd.setDate(gridEnd.getDate() + (6 - lastOfMonth.getDay()));

  const weeks: Date[][] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export default function PrintScheduleView({ year, month, shifts, staff }: PrintScheduleViewProps) {
  const weeks = buildWeeks(year, month);

  // A printout is meant to be posted for staff to see — draft shifts haven't
  // been published to them yet, and closed shifts were explicitly marked as
  // not needed, so both are excluded here even though the manager can see
  // them on screen. (Without this, a closed shift would print mislabeled as
  // "Open" since it has no assignee — the whole point of closing it was to
  // stop it from showing up as something staff need to fill.)
  const publishedShifts = shifts.filter((s) => s.published && s.status !== "closed");

  const shiftsByDate = new Map<string, Shift[]>();
  publishedShifts.forEach((s) => {
    if (!shiftsByDate.has(s.shift_date)) shiftsByDate.set(s.shift_date, []);
    shiftsByDate.get(s.shift_date)!.push(s);
  });
  shiftsByDate.forEach((list) => list.sort((a, b) => a.start_time.localeCompare(b.start_time)));

  const monthShifts = publishedShifts.filter((s) => {
    const d = new Date(`${s.shift_date}T00:00:00`);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const legendStaffIds = Array.from(new Set(monthShifts.map((s) => s.assigned_to).filter(Boolean))) as string[];
  const legendStaff = legendStaffIds
    .map((id) => staff.find((s) => s.user_id === id))
    .filter((s): s is StaffMember => !!s)
    .sort((a, b) => (a.display_name || a.email).localeCompare(b.display_name || b.email));
  const hasOpenShift = monthShifts.some((s) => s.status === "open");

  return (
    <div className="print-area hidden print:block p-3">
      <h1 className="text-xl font-bold text-black mb-0.5">PNW Fitness — Staff Schedule</h1>
      <h2 className="text-base text-black mb-2">
        {MONTH_LABELS[month]} {year}
      </h2>

      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr>
            {DAY_LABELS.map((d) => (
              <th key={d} className="border border-gray-400 bg-gray-100 text-black text-sm py-1">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((day) => {
                const dateStr = toDateStr(day);
                const inMonth = day.getMonth() === month;
                const dayShifts = shiftsByDate.get(dateStr) ?? [];
                return (
                  <td
                    key={dateStr}
                    className="border border-gray-400 align-top p-1"
                    style={{ height: "0.95in", width: "14.28%" }}
                  >
                    <div className={`text-xs font-semibold mb-0.5 ${inMonth ? "text-black" : "text-gray-400"}`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {dayShifts.map((s) => {
                        const assignee = staff.find((st) => st.user_id === s.assigned_to);
                        const color = s.status === "open" ? OPEN_SHIFT_COLOR : staffColor(assignee);
                        const label = assignee ? (assignee.display_name || assignee.email) : "Open";
                        return (
                          <div
                            key={s.id}
                            className="text-[9px] leading-tight rounded-sm px-1 py-0.5 text-white"
                            style={{ backgroundColor: color, color: s.status === "open" ? "#374151" : "#ffffff" }}
                          >
                            {fmtTime(s.start_time)}-{fmtTime(s.end_time)} {label}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-wrap gap-3 mt-2">
        {legendStaff.map((s) => (
          <div key={s.user_id} className="flex items-center gap-1.5 text-xs text-black">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: staffColor(s) }}
            ></span>
            {s.display_name || s.email}
          </div>
        ))}
        {hasOpenShift && (
          <div className="flex items-center gap-1.5 text-xs text-black">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: OPEN_SHIFT_COLOR }}></span>
            Open
          </div>
        )}
      </div>
    </div>
  );
}
