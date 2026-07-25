import {
  Shift,
  StaffMember,
  ROLE_LABELS,
  staffColor,
  OPEN_SHIFT_COLOR,
  addDaysToDate,
} from "../../lib/scheduling";

interface GridViewProps {
  mode: "employee" | "role";
  shifts: Shift[];
  staff: StaffMember[];
  weekStart: string;
  onShiftClick: (shift: Shift) => void;
}

interface Row {
  key: string;
  label: string;
  isOpenRow?: boolean;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "p" : "a";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour}${period}` : `${hour}:${String(m).padStart(2, "0")}${period}`;
}

function shiftMinutes(s: Shift) {
  const [sh, sm] = s.start_time.split(":").map(Number);
  const [eh, em] = s.end_time.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

export default function GridView({ mode, shifts, staff, weekStart, onShiftClick }: GridViewProps) {
  // weekStart is the Monday of the week (mondayOfWeek(), shared with Bulk
  // Schedule); DAY_LABELS here is Sun-first to match Homebase's own
  // convention, so the displayed range starts one day earlier, at Sunday.
  const sundayStart = addDaysToDate(weekStart, -1);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDaysToDate(sundayStart, i));

  const rows: Row[] =
    mode === "employee"
      ? [
          { key: "__open__", label: "Open Shifts", isOpenRow: true },
          ...staff.map((s) => ({ key: s.user_id, label: s.display_name || s.email })),
        ]
      : ROLE_LABELS.map((r) => ({ key: r, label: r }));

  function shiftsFor(row: Row, date: string) {
    return shifts
      .filter((s) => s.shift_date === date)
      .filter((s) =>
        mode === "employee"
          ? row.isOpenRow
            ? s.assigned_to === null
            : s.assigned_to === row.key
          : s.role_label === row.key
      )
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  function weeklyHours(row: Row) {
    const totalMin = weekDates.reduce((sum, d) => sum + shiftsFor(row, d).reduce((s2, sh) => s2 + shiftMinutes(sh), 0), 0);
    return (totalMin / 60).toFixed(2);
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800">
            <th className="text-left text-xs font-medium text-gray-400 p-3 w-44">
              {mode === "employee" ? "Team Member" : "Role"}
            </th>
            {weekDates.map((d, i) => (
              <th key={d} className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 p-3">
                {DAY_LABELS[i]} <span className="text-gray-400 font-normal">{d.slice(5)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-gray-100 dark:border-gray-800">
              <td className="p-3 align-top">
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{row.label}</div>
                {mode === "employee" && !row.isOpenRow && (
                  <div className="text-xs text-gray-400">{weeklyHours(row)} hrs</div>
                )}
              </td>
              {weekDates.map((d) => (
                <td key={d} className="p-2 align-top min-w-[130px]">
                  <div className="space-y-1">
                    {shiftsFor(row, d).map((s) => {
                      const assignee = staff.find((st) => st.user_id === s.assigned_to);
                      const color = s.status === "open" ? OPEN_SHIFT_COLOR : staffColor(assignee);
                      const label =
                        mode === "employee" ? s.role_label : assignee ? assignee.display_name || assignee.email : "Open";
                      return (
                        <button
                          key={s.id}
                          onClick={() => onShiftClick(s)}
                          className="block w-full text-left text-[11px] leading-tight rounded px-1.5 py-1 transition hover:opacity-90"
                          style={{
                            backgroundColor: color,
                            color: s.status === "open" ? "#374151" : "#ffffff",
                            border: !s.published ? "1px dashed rgba(0,0,0,0.4)" : "1px solid transparent",
                            opacity: s.published ? 1 : 0.75,
                          }}
                        >
                          {fmtTime(s.start_time)}-{fmtTime(s.end_time)} {label}
                        </button>
                      );
                    })}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
