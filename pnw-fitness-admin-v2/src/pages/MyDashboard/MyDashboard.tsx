import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../lib/AuthContext";
import { Shift, todayStr } from "../../lib/scheduling";

interface Announcement {
  id: string;
  title: string;
  body: string;
  posted_by_name: string | null;
}

function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function fmtDate(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function countdown(shift: Shift): string {
  const now = new Date();
  const start = new Date(`${shift.shift_date}T${shift.start_time}`);
  const end = new Date(`${shift.shift_date}T${shift.end_time}`);
  if (now >= start && now < end) return "Happening now";

  const diffMs = start.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 24) {
    const h = Math.floor(diffHours);
    const m = Math.round((diffHours - h) * 60);
    if (h <= 0) return `Starts in ${m}m`;
    return `Starts in ${h}h ${m}m`;
  }
  const days = Math.round(diffHours / 24);
  return `Starts in ${days} day${days === 1 ? "" : "s"}`;
}

export default function MyDashboard() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const currentUserId = session?.user?.id ?? null;

  const [nextShift, setNextShift] = useState<Shift | null>(null);
  const [todayShifts, setTodayShifts] = useState<Shift[]>([]);
  const [pinnedAnnouncements, setPinnedAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!currentUserId) return;
      setLoading(true);
      const today = todayStr();

      const [{ data: upcoming }, { data: todays }, { data: pinned }] = await Promise.all([
        supabase
          .from("staff_shifts")
          .select("*")
          .eq("assigned_to", currentUserId)
          .in("status", ["scheduled", "trade_pending"])
          .gte("shift_date", today)
          .order("shift_date")
          .order("start_time")
          .limit(1),
        supabase
          .from("staff_shifts")
          .select("*")
          .eq("assigned_to", currentUserId)
          .eq("shift_date", today)
          .not("notes", "is", null),
        supabase
          .from("team_announcements")
          .select("id, title, body, posted_by_name")
          .eq("pinned", true)
          .order("created_at", { ascending: false }),
      ]);

      setNextShift((upcoming as Shift[] | null)?.[0] ?? null);
      setTodayShifts((todays as Shift[] | null) ?? []);
      setPinnedAnnouncements((pinned as Announcement[] | null) ?? []);
      setLoading(false);
    }
    load();
  }, [currentUserId]);

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>;

  const notes = todayShifts.filter((s) => s.notes);

  return (
    <div>
      <PageMeta title="My Dashboard | PNW Fitness Admin" description="" />
      <PageBreadcrumb pageTitle="My Dashboard" />

      <div className="mb-4 rounded-2xl bg-brand-600 text-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80 mb-1">Next Shift</p>
        {nextShift ? (
          <>
            <p className="text-2xl font-bold">{countdown(nextShift)}</p>
            <p className="mt-1 text-sm opacity-90">
              {nextShift.role_label} — {fmtDate(nextShift.shift_date)}, {fmtTime(nextShift.start_time)}–{fmtTime(nextShift.end_time)}
            </p>
            {nextShift.status === "trade_pending" && (
              <p className="mt-1 text-xs opacity-80">A trade request is pending on this shift.</p>
            )}
          </>
        ) : (
          <p className="text-lg font-medium">No upcoming shifts scheduled.</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <button
          onClick={() => navigate("/time-off")}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03] p-5 text-center font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition"
        >
          Request Time Off
        </button>
        <button
          onClick={() => navigate("/marketplace")}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03] p-5 text-center font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition"
        >
          Trade a Shift
        </button>
        <button
          onClick={() => navigate("/schedule")}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03] p-5 text-center font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition"
        >
          View Full Roster
        </button>
      </div>

      <ComponentCard title="Today's Notes">
        {notes.length === 0 && pinnedAnnouncements.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing pinned for today.</p>
        ) : (
          <ul className="space-y-2">
            {notes.map((s) => (
              <li key={s.id} className="text-sm text-gray-700 dark:text-gray-300">
                • {s.notes}
              </li>
            ))}
            {pinnedAnnouncements.map((a) => (
              <li key={a.id} className="text-sm text-gray-700 dark:text-gray-300">
                📌 <span className="font-medium">{a.title}:</span> {a.body}
              </li>
            ))}
          </ul>
        )}
      </ComponentCard>
    </div>
  );
}
