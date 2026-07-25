import { supabase } from "./supabaseClient";

export type AvailabilityStatus = "available" | "unavailable" | "preferred";
export type AvailabilityKind = "recurring" | "custom";

export interface AvailabilityRule {
  id: string;
  user_id: string;
  kind: AvailabilityKind;
  day_of_week: number | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  status: AvailabilityStatus;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export type TimeOffReason = "sick" | "vacation" | "personal";
export type TimeOffStatus = "pending" | "approved" | "denied";

export interface TimeOffRequest {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  reason: TimeOffReason;
  note: string | null;
  status: TimeOffStatus;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
}

export interface BlackoutDate {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
  created_by: string | null;
  created_at: string;
}

interface ActionError {
  message: string;
}

export const DAY_OF_WEEK_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function loadAvailability(userId: string): Promise<AvailabilityRule[]> {
  const { data } = await supabase
    .from("staff_availability")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function createAvailabilityRule(rule: {
  user_id: string;
  kind: AvailabilityKind;
  day_of_week: number | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  status: AvailabilityStatus;
  note: string | null;
  created_by: string | null;
}): Promise<{ error: ActionError | null }> {
  const { error } = await supabase.from("staff_availability").insert(rule);
  return { error };
}

export async function deleteAvailabilityRule(id: string): Promise<{ error: ActionError | null }> {
  const { error } = await supabase.from("staff_availability").delete().eq("id", id);
  return { error };
}

export async function loadMyTimeOff(userId: string): Promise<TimeOffRequest[]> {
  const { data } = await supabase
    .from("time_off_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function loadPendingTimeOff(): Promise<TimeOffRequest[]> {
  const { data } = await supabase.from("time_off_requests").select("*").eq("status", "pending").order("created_at");
  return data ?? [];
}

export async function requestTimeOff(req: {
  user_id: string;
  start_date: string;
  end_date: string;
  reason: TimeOffReason;
  note: string | null;
}): Promise<{ error: ActionError | null }> {
  const { error } = await supabase.from("time_off_requests").insert({ ...req, status: "pending" });
  return { error };
}

export async function decideTimeOff(
  id: string,
  status: "approved" | "denied",
  decidedBy: string
): Promise<{ error: ActionError | null }> {
  const { error } = await supabase
    .from("time_off_requests")
    .update({ status, decided_by: decidedBy, decided_at: new Date().toISOString() })
    .eq("id", id);
  return { error };
}

export async function loadBlackoutDates(): Promise<BlackoutDate[]> {
  const { data } = await supabase.from("schedule_blackout_dates").select("*").order("start_date");
  return data ?? [];
}

export async function createBlackoutDate(b: {
  start_date: string;
  end_date: string;
  reason: string;
  created_by: string | null;
}): Promise<{ error: ActionError | null }> {
  const { error } = await supabase.from("schedule_blackout_dates").insert(b);
  return { error };
}

export async function deleteBlackoutDate(id: string): Promise<{ error: ActionError | null }> {
  const { error } = await supabase.from("schedule_blackout_dates").delete().eq("id", id);
  return { error };
}
