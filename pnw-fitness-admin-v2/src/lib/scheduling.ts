import { supabase } from "./supabaseClient";

export type ShiftStatus = "scheduled" | "open" | "trade_pending" | "completed" | "no_show";
export type TradeStatus = "pending" | "approved" | "denied" | "claimed" | "cancelled";

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
}

export interface TradeRequest {
  id: string;
  shift_id: string;
  requested_by: string;
  requested_to: string | null;
  reason: string | null;
  status: TradeStatus;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
}

export interface StaffMember {
  user_id: string;
  display_name: string | null;
  email: string;
  role_name: string | null;
}

interface ActionError {
  message: string;
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
    .select("user_id, display_name, email, is_active")
    .eq("is_active", true)
    .order("display_name");

  return (profiles ?? []).map((p) => ({
    user_id: p.user_id,
    display_name: p.display_name,
    email: p.email,
    role_name: roleByUser.get(p.user_id) ?? null,
  }));
}

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
  return supabase.from("staff_shifts").insert({ ...shift, status });
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
  }));
  const { data, error } = await supabase.from("staff_shifts").insert(payload).select("id");
  if (error) return { error: { message: error.message }, count: 0 };
  return { error: null, count: data?.length ?? 0 };
}

export async function updateShift(id: string, patch: Partial<Shift>) {
  return supabase.from("staff_shifts").update(patch).eq("id", id);
}

export async function deleteShift(id: string) {
  return supabase.from("staff_shifts").delete().eq("id", id);
}

// Drop-to-open (requestedTo = null) or offer to a specific coworker.
export async function requestTrade(
  shiftId: string,
  requestedBy: string,
  requestedTo: string | null,
  reason: string | null
): Promise<{ error: ActionError | null }> {
  const { error: reqErr } = await supabase
    .from("shift_trade_requests")
    .insert({ shift_id: shiftId, requested_by: requestedBy, requested_to: requestedTo, reason, status: "pending" });
  if (reqErr) return { error: reqErr };

  const { error: statusErr } = await supabase
    .from("staff_shifts")
    .update({ status: "trade_pending" })
    .eq("id", shiftId);
  return { error: statusErr };
}

export async function approveTrade(trade: TradeRequest, decidedBy: string): Promise<{ error: ActionError | null }> {
  const { error: decideErr } = await supabase
    .from("shift_trade_requests")
    .update({ status: "approved", decided_by: decidedBy, decided_at: new Date().toISOString() })
    .eq("id", trade.id);
  if (decideErr) return { error: decideErr };

  const { error: shiftErr } = trade.requested_to
    ? await supabase.from("staff_shifts").update({ assigned_to: trade.requested_to, status: "scheduled" }).eq("id", trade.shift_id)
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
