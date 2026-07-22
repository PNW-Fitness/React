import { supabase } from "./supabaseClient";

export interface GuestBan {
  id: string;
  lead_id: string;
  status: "requested" | "approved" | "denied" | "lifted";
  reason: string;
  requested_by: string | null;
  requested_by_name: string | null;
  requested_at: string;
  decided_by: string | null;
  decided_by_name: string | null;
  decided_at: string | null;
}

export interface BannableGuest {
  id: string;
  email: string | null;
  phone: string | null;
}

// A ban is requested/decided against one lead_submissions row (guest_bans.lead_id),
// but the same guest may have several rows — one per source they came through
// (a Tour lead, a separate Join lead, a kiosk check-in, etc). Per Xavier's
// direction, ban_status stays in sync across every row that shares the same
// guest's email or phone, not just the row the action originated on.
async function matchingLeadIds(guest: BannableGuest): Promise<string[]> {
  const conditions: string[] = [];
  if (guest.email) conditions.push(`email.eq.${guest.email}`);
  if (guest.phone) conditions.push(`phone.eq.${guest.phone}`);
  if (conditions.length === 0) return [guest.id];

  const { data } = await supabase.from("lead_submissions").select("id").or(conditions.join(","));
  const ids = (data ?? []).map((r) => r.id as string);
  return ids.includes(guest.id) ? ids : [...ids, guest.id];
}

async function syncBanStatus(guest: BannableGuest, status: "none" | "requested" | "banned") {
  const conditions: string[] = [];
  if (guest.email) conditions.push(`email.eq.${guest.email}`);
  if (guest.phone) conditions.push(`phone.eq.${guest.phone}`);

  const query = supabase.from("lead_submissions").update({ ban_status: status });
  if (conditions.length === 0) return query.eq("id", guest.id);
  return query.or(conditions.join(","));
}

// Finds the most recent guest_bans record across any of the guest's matching
// rows — used to locate the request to approve/deny, or the active ban to lift,
// regardless of which specific row the reviewer happens to be looking at.
export async function findActiveBan(guest: BannableGuest): Promise<GuestBan | null> {
  const leadIds = await matchingLeadIds(guest);
  const { data } = await supabase
    .from("guest_bans")
    .select("*")
    .in("lead_id", leadIds)
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as GuestBan | null) ?? null;
}

// Full request -> decision history across any of the guest's matching rows,
// newest first — shown when expanding a row on the Banned Guests page.
export async function findBanHistory(guest: BannableGuest): Promise<GuestBan[]> {
  const leadIds = await matchingLeadIds(guest);
  const { data } = await supabase
    .from("guest_bans")
    .select("*")
    .in("lead_id", leadIds)
    .order("requested_at", { ascending: false });
  return (data as GuestBan[] | null) ?? [];
}

async function currentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requestBan(guest: BannableGuest, reason: string, staffName: string) {
  const user = await currentUser();
  const { error: banErr } = await supabase.from("guest_bans").insert({
    lead_id: guest.id,
    status: "requested",
    reason,
    requested_by: user?.id ?? null,
    requested_by_name: staffName,
  });
  if (banErr) return { error: banErr };

  await supabase.from("lead_notes").insert({ lead_id: guest.id, note_text: reason, author_name: staffName });

  const { error: syncErr } = await syncBanStatus(guest, "requested");
  return { error: syncErr };
}

export async function applyBanDirectly(guest: BannableGuest, reason: string, staffName: string) {
  const user = await currentUser();
  const now = new Date().toISOString();
  const { error: banErr } = await supabase.from("guest_bans").insert({
    lead_id: guest.id,
    status: "approved",
    reason,
    requested_by: user?.id ?? null,
    requested_by_name: staffName,
    decided_by: user?.id ?? null,
    decided_by_name: staffName,
    decided_at: now,
  });
  if (banErr) return { error: banErr };

  const { error: syncErr } = await syncBanStatus(guest, "banned");
  return { error: syncErr };
}

export async function approveBanRequest(ban: GuestBan, guest: BannableGuest, staffName: string) {
  const user = await currentUser();
  const { error: banErr } = await supabase
    .from("guest_bans")
    .update({
      status: "approved",
      decided_by: user?.id ?? null,
      decided_by_name: staffName,
      decided_at: new Date().toISOString(),
    })
    .eq("id", ban.id);
  if (banErr) return { error: banErr };

  const { error: syncErr } = await syncBanStatus(guest, "banned");
  return { error: syncErr };
}

export async function denyBanRequest(ban: GuestBan, guest: BannableGuest, staffName: string) {
  const user = await currentUser();
  const { error: banErr } = await supabase
    .from("guest_bans")
    .update({
      status: "denied",
      decided_by: user?.id ?? null,
      decided_by_name: staffName,
      decided_at: new Date().toISOString(),
    })
    .eq("id", ban.id);
  if (banErr) return { error: banErr };

  const { error: syncErr } = await syncBanStatus(guest, "none");
  return { error: syncErr };
}

export async function liftBan(ban: GuestBan, guest: BannableGuest, staffName: string) {
  const user = await currentUser();
  const { error: banErr } = await supabase
    .from("guest_bans")
    .update({
      status: "lifted",
      decided_by: user?.id ?? null,
      decided_by_name: staffName,
      decided_at: new Date().toISOString(),
    })
    .eq("id", ban.id);
  if (banErr) return { error: banErr };

  const { error: syncErr } = await syncBanStatus(guest, "none");
  return { error: syncErr };
}
