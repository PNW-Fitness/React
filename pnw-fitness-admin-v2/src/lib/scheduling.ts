import { supabase } from "./supabaseClient";

export type ShiftStatus = "scheduled" | "open" | "trade_pending" | "completed" | "no_show";
export type TradeStatus = "pending" | "accepted" | "approved" | "denied" | "claimed" | "cancelled";

// Fixed set per Design Addendum §3.1, matched against a staff member's RBAC
// role name to decide who can claim an open shift or be offered a trade.
// "Manager-on-duty" matches either Manager or Super Admin.
export const ROLE_LABELS = ["Trainer", "Front Desk", "Manager-on-duty"] as const;

export function roleMatchesLabel(rbacRoleName: string | null | undefined, roleLabel: string): boolean {
  if (roleLabel === "Manager-on-duty") return rbacRoleName === "Manager" || rbacRoleName === "Super Admin";
  return rbacRoleName === roleLabel;
}

// Fixed weekly shift pattern the gym actually runs, used to pre-fill the
// bulk-schedule grid. Weekday and weekend slot arrays are kept the same
// length/order (early/mid, late, manager) so a row index means the same
// "slot" across both — the weekend simply has no "late" or "manager" row.
export interface ShiftTemplateSlot {
  key: string;
  label: string;
  start_time: string;
  end_time: string;
  role_label: string;
}

export const WEEKDAY_SLOTS: ShiftTemplateSlot[] = [
  { key: "early", label: "Early", start_time: "05:45", end_time: "11:00", role_label: "Front Desk" },
  { key: "mid", label: "Mid", start_time: "11:00", end_time: "16:00", role_label: "Front Desk" },
  { key: "late", label: "Late", start_time: "16:00", end_time: "21:00", role_label: "Front Desk" },
  { key: "manager", label: "Manager", start_time: "10:00", end_time: "16:00", role_label: "Manager-on-duty" },
];

export const WEEKEND_SLOTS: ShiftTemplateSlot[] = [
  { key: "morning", label: "Morning", start_time: "07:45", end_time: "14:00", role_label: "Front Desk" },
  { key: "afternoon", label: "Afternoon", start_time: "14:00", end_time: "20:00", role_label: "Front Desk" },
];

export const SLOT_ROW_COUNT = 4;

// Formats using LOCAL date components, never .toISOString() — that converts
// to UTC, which silently rolls the date forward a day for any UTC-behind
// timezone once local time passes into the evening (e.g. new Date() at
// 5pm Pacific is already "tomorrow" in UTC). Fixes both callers below.
function formatDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return formatDateLocal(new Date());
}

export function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return formatDateLocal(d);
}

export function mondayOfWeek(base: Date): string {
  const day = base.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(base.getFullYear(), base.getMonth(), base.getDate() + diff);
  return formatDateLocal(monday);
}

export function isWeekendDate(dateStr: string): boolean {
  const day = new Date(`${dateStr}T00:00:00`).getDay();
  return day === 0 || day === 6;
}

// Returns the slot template for a given date + row index, or null if that
// row doesn't apply (weekends only have 2 rows, not 4).
export function slotForRow(dateStr: string, rowIndex: number): ShiftTemplateSlot | null {
  const slots = isWeekendDate(dateStr) ? WEEKEND_SLOTS : WEEKDAY_SLOTS;
  return slots[rowIndex] ?? null;
}

export interface Shift {
  id: string;
  assigned_to: string | null;
  role_label: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  status: ShiftStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  published: boolean;
}

export interface TradeRequest {
  id: string;
  shift_id: string;
  requested_by: string;
  reason: string | null;
  status: TradeStatus;
  accepted_by: string | null;
  accepted_at: string | null;
  offered_shift_id: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
}

export interface StaffMember {
  user_id: string;
  display_name: string | null;
  email: string;
  role_name: string | null;
  schedule_color: string | null;
}

interface ActionError {
  message: string;
}

// Curated palette (not free-text) so every color is dark/saturated enough
// for white event-title text to stay readable on both screen and print.
export const STAFF_COLOR_PALETTE = [
  "#2563eb", // blue
  "#dc2626", // red
  "#059669", // emerald
  "#7c3aed", // violet
  "#ea580c", // orange
  "#db2777", // pink
  "#0891b2", // cyan
  "#65a30d", // lime
  "#ca8a04", // amber
  "#4f46e5", // indigo
] as const;

export const UNASSIGNED_COLOR = "#9ca3af"; // gray-400, for staff with no color picked yet
export const OPEN_SHIFT_COLOR = "#d1d5db"; // gray-300, open/unclaimed shifts

export function staffColor(staff: StaffMember | undefined | null): string {
  return staff?.schedule_color || UNASSIGNED_COLOR;
}

// admin_profiles and user_roles aren't directly FK-linked (both reference
// auth.users independently), so PostgREST can't embed one under the other —
// fetch separately and merge client-side, same pattern as Leads' loadTrainers().
export async function loadStaffDirectory(): Promise<StaffMember[]> {
  const { data: userRoles } = await supabase.from("user_roles").select("user_id, roles(name)");
  const roleByUser = new Map<string, string>();
  (userRoles ?? []).forEach((r) => {
    const roleName = (r as unknown as { roles: { name: string } | null }).roles?.name;
    if (roleName) roleByUser.set(r.user_id as string, roleName);
  });

  const { data: profiles } = await supabase
    .from("admin_profiles")
    .select("user_id, display_name, email, is_active, schedule_color")
    .eq("is_active", true)
    .order("display_name");

  return (profiles ?? []).map((p) => ({
    user_id: p.user_id,
    display_name: p.display_name,
    email: p.email,
    role_name: roleByUser.get(p.user_id) ?? null,
    schedule_color: p.schedule_color,
  }));
}

export async function updateStaffColor(userId: string, color: string): Promise<{ error: ActionError | null }> {
  const { error } = await supabase.from("admin_profiles").update({ schedule_color: color }).eq("user_id", userId);
  return { error };
}

// New shifts always start as drafts — they only become visible to
// non-managers once explicitly published (see publishDrafts below).
export async function createShift(shift: {
  role_label: string;
  assigned_to: string | null;
  shift_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  created_by: string | null;
}) {
  const status: ShiftStatus = shift.assigned_to ? "scheduled" : "open";
  return supabase.from("staff_shifts").insert({ ...shift, status, published: false });
}

// Inserts many shifts in one request. Caller is responsible for filtering
// out slots that already exist (see BulkScheduleModal) — this function does
// not de-duplicate.
export async function createShiftsBulk(
  rows: {
    role_label: string;
    assigned_to: string | null;
    shift_date: string;
    start_time: string;
    end_time: string;
    created_by: string | null;
  }[]
): Promise<{ error: ActionError | null; count: number }> {
  if (rows.length === 0) return { error: null, count: 0 };
  const payload = rows.map((r) => ({
    ...r,
    status: (r.assigned_to ? "scheduled" : "open") as ShiftStatus,
    published: false,
  }));
  const { data, error } = await supabase.from("staff_shifts").insert(payload).select("id");
  if (error) return { error: { message: error.message }, count: 0 };
  return { error: null, count: data?.length ?? 0 };
}

export type PublishAudience = "all" | "affected" | "none";

// Flips every current draft to published in one batch, then notifies
// according to the manager's chosen audience. Drafts are fetched first so
// the "affected" audience can be computed from exactly the rows that were
// actually still drafts (avoids a race with a shift published moments earlier).
export async function publishDrafts(
  audience: PublishAudience
): Promise<{ error: ActionError | null; publishedCount: number }> {
  const { data: drafts, error: fetchErr } = await supabase
    .from("staff_shifts")
    .select("id, assigned_to")
    .eq("published", false);
  if (fetchErr) return { error: fetchErr, publishedCount: 0 };
  if (!drafts || drafts.length === 0) return { error: null, publishedCount: 0 };

  const { error: updateErr } = await supabase
    .from("staff_shifts")
    .update({ published: true })
    .eq("published", false);
  if (updateErr) return { error: updateErr, publishedCount: 0 };

  if (audience === "none") return { error: null, publishedCount: drafts.length };

  let recipientIds: string[];
  if (audience === "affected") {
    recipientIds = Array.from(new Set(drafts.map((d) => d.assigned_to).filter((id): id is string => !!id)));
  } else {
    const { data: active } = await supabase.from("admin_profiles").select("user_id").eq("is_active", true);
    recipientIds = (active ?? []).map((a) => a.user_id);
  }

  if (recipientIds.length > 0) {
    const notifications = recipientIds.map((user_id) => ({
      user_id,
      message: "A new schedule has been published. Check your upcoming shifts.",
      link: "/schedule",
    }));
    await supabase.from("notifications").insert(notifications);
  }

  return { error: null, publishedCount: drafts.length };
}

export async function updateShift(id: string, patch: Partial<Shift>) {
  return supabase.from("staff_shifts").update(patch).eq("id", id);
}

export async function deleteShift(id: string) {
  return supabase.from("staff_shifts").delete().eq("id", id);
}

// Weekly threshold matches FLSA/WA/OR law (overtime past 40 hrs/week — this
// region has no daily-overtime rule like California). The daily threshold
// is just an operational heads-up, not a legal requirement.
export const DAILY_OT_THRESHOLD_HOURS = 8;
export const WEEKLY_OT_THRESHOLD_HOURS = 40;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function shiftHours(s: { start_time: string; end_time: string }): number {
  return (timeToMinutes(s.end_time) - timeToMinutes(s.start_time)) / 60;
}

function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(bStart) < timeToMinutes(aEnd);
}

// Flags double-booking and overtime before a manager saves a shift. Unlike
// the hard DB-level block on approved time off, these are soft warnings the
// manager can save past — staffing sometimes genuinely requires overtime or
// a deliberate overlap (e.g. a manager covering two roles back-to-back).
// Approved-time-off overlap isn't checked here since the DB trigger from
// migration 037 already rejects that outright before this would matter.
export function checkShiftConflicts(
  candidate: { id?: string; assigned_to: string | null; shift_date: string; start_time: string; end_time: string },
  allShifts: Shift[],
  staff: StaffMember[]
): string[] {
  if (!candidate.assigned_to) return [];
  const person = staff.find((s) => s.user_id === candidate.assigned_to);
  const name = person ? person.display_name || person.email : "This person";
  const warnings: string[] = [];

  const others = allShifts.filter((s) => s.assigned_to === candidate.assigned_to && s.id !== candidate.id);

  const clash = others.find(
    (s) =>
      s.shift_date === candidate.shift_date &&
      timesOverlap(s.start_time, s.end_time, candidate.start_time, candidate.end_time)
  );
  if (clash) {
    warnings.push(
      `${name} is already scheduled ${clash.start_time.slice(0, 5)}-${clash.end_time.slice(0, 5)} on ${candidate.shift_date} — this overlaps.`
    );
  }

  const dayTotal =
    others.filter((s) => s.shift_date === candidate.shift_date).reduce((sum, s) => sum + shiftHours(s), 0) +
    shiftHours(candidate);
  if (dayTotal > DAILY_OT_THRESHOLD_HOURS) {
    warnings.push(
      `${name} would have ${dayTotal.toFixed(1)} hours on ${candidate.shift_date} (over the ${DAILY_OT_THRESHOLD_HOURS}-hour daily threshold).`
    );
  }

  const weekStart = mondayOfWeek(new Date(`${candidate.shift_date}T00:00:00`));
  const weekDates = new Set(Array.from({ length: 7 }, (_, i) => addDaysToDate(weekStart, i)));
  const weekTotal =
    others.filter((s) => weekDates.has(s.shift_date)).reduce((sum, s) => sum + shiftHours(s), 0) + shiftHours(candidate);
  if (weekTotal > WEEKLY_OT_THRESHOLD_HOURS) {
    warnings.push(
      `${name} would have ${weekTotal.toFixed(1)} hours this week (over the ${WEEKLY_OT_THRESHOLD_HOURS}-hour weekly threshold).`
    );
  }

  return warnings;
}

// Drop-to-open (targetUserIds = []) or offer to one or more specific
// coworkers — any ONE of them can accept it (see acceptTrade below).
export async function requestTrade(
  shiftId: string,
  requestedBy: string,
  targetUserIds: string[],
  reason: string | null
): Promise<{ error: ActionError | null }> {
  const { data: trade, error: reqErr } = await supabase
    .from("shift_trade_requests")
    .insert({ shift_id: shiftId, requested_by: requestedBy, reason, status: "pending" })
    .select()
    .single();
  if (reqErr || !trade) return { error: reqErr ?? { message: "Failed to create trade request." } };

  if (targetUserIds.length > 0) {
    const { error: targetErr } = await supabase
      .from("shift_trade_targets")
      .insert(targetUserIds.map((user_id) => ({ trade_id: trade.id, user_id })));
    if (targetErr) return { error: targetErr };
  }

  const { error: statusErr } = await supabase
    .from("staff_shifts")
    .update({ status: "trade_pending" })
    .eq("id", shiftId);
  return { error: statusErr };
}

export async function loadTradeTargets(): Promise<{ trade_id: string; user_id: string }[]> {
  const { data } = await supabase.from("shift_trade_targets").select("trade_id, user_id");
  return data ?? [];
}

// A targeted coworker accepts — either a plain take-over (offeredShiftId
// null) or countering with one of their own shifts to make it a real swap.
// Conditional UPDATE (status='pending' AND accepted_by IS NULL) guards the
// same race as claimShift: if another targeted coworker accepted a moment
// earlier, this matches zero rows instead of double-accepting.
export async function acceptTrade(
  tradeId: string,
  accepterId: string,
  offeredShiftId: string | null
): Promise<{ error: ActionError | null }> {
  const { data, error } = await supabase
    .from("shift_trade_requests")
    .update({ accepted_by: accepterId, accepted_at: new Date().toISOString(), offered_shift_id: offeredShiftId, status: "accepted" })
    .eq("id", tradeId)
    .eq("status", "pending")
    .is("accepted_by", null)
    .select()
    .maybeSingle();
  if (!error && !data) {
    return { error: { message: "This trade was already accepted by someone else, or is no longer available." } };
  }
  return { error };
}

// Approval finalizes whatever was agreed: a two-way swap if the accepter
// countered with their own shift, a plain take-over if they didn't, or —
// if nobody needed to accept at all (a plain drop with no targets) — just
// releases the shift back to the open pool.
export async function approveTrade(trade: TradeRequest, decidedBy: string): Promise<{ error: ActionError | null }> {
  const { error: decideErr } = await supabase
    .from("shift_trade_requests")
    .update({ status: "approved", decided_by: decidedBy, decided_at: new Date().toISOString() })
    .eq("id", trade.id);
  if (decideErr) return { error: decideErr };

  if (trade.offered_shift_id && trade.accepted_by) {
    const { error: err1 } = await supabase
      .from("staff_shifts")
      .update({ assigned_to: trade.accepted_by, status: "scheduled" })
      .eq("id", trade.shift_id);
    if (err1) return { error: err1 };
    const { error: err2 } = await supabase
      .from("staff_shifts")
      .update({ assigned_to: trade.requested_by, status: "scheduled" })
      .eq("id", trade.offered_shift_id);
    return { error: err2 };
  }

  const { error: shiftErr } = trade.accepted_by
    ? await supabase.from("staff_shifts").update({ assigned_to: trade.accepted_by, status: "scheduled" }).eq("id", trade.shift_id)
    : await supabase.from("staff_shifts").update({ assigned_to: null, status: "open" }).eq("id", trade.shift_id);
  return { error: shiftErr };
}

export async function denyTrade(trade: TradeRequest, decidedBy: string): Promise<{ error: ActionError | null }> {
  const { error: decideErr } = await supabase
    .from("shift_trade_requests")
    .update({ status: "denied", decided_by: decidedBy, decided_at: new Date().toISOString() })
    .eq("id", trade.id);
  if (decideErr) return { error: decideErr };

  const { error: shiftErr } = await supabase.from("staff_shifts").update({ status: "scheduled" }).eq("id", trade.shift_id);
  return { error: shiftErr };
}

// Conditional UPDATE (WHERE status = 'open') guards the double-claim race —
// if someone else claimed it a moment earlier, this matches zero rows instead
// of silently overwriting their claim.
export async function claimShift(shiftId: string, userId: string): Promise<{ error: ActionError | null }> {
  const { data, error } = await supabase
    .from("staff_shifts")
    .update({ assigned_to: userId, status: "scheduled" })
    .eq("id", shiftId)
    .eq("status", "open")
    .select()
    .maybeSingle();
  if (!error && !data) {
    return { error: { message: "This shift was already claimed by someone else." } };
  }
  return { error };
}
