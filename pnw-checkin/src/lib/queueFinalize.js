import { supabase } from "./supabase.js";

// Converts an absolute ISO timestamp (from Supabase) into the same naive
// "YYYY-MM-DD HH:MM:SS" local-time shape db.js's localNow() produces, so it
// can be dropped into the existing PDF generator / lead-sync code unchanged.
export function formatIsoAsLocal(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Shapes a pending_checkins row (flow_type: 'guest') into the guestSession
// shape exportGuestFiles/isQualifyingLead/buildLeadPayload already expect.
// dob is intentionally left null — the web form never persists it (same as
// the tablet's own flow, where DOB is transient and only used for the
// in-the-moment ID cross-check reminder, never written to the guests table).
export function guestSessionFromPendingRow(row) {
  const fd = row.form_data || {};
  return {
    isMinor: Boolean(fd.is_minor),
    supervisionRequired: Boolean(fd.supervision_required),
    dob: null,
    returnVisit: null,
    existingGuestId: null,
    formData: fd,
    idPhoto: null,
  };
}

// Shapes a pending_checkins row (flow_type: 'classpass') into the cpSession
// shape exportClassPassFile expects.
export function cpSessionFromPendingRow(row) {
  const fd = row.form_data || {};
  return {
    guestName: fd.guest_name || "",
    contact: fd.contact || "",
    zipCode: fd.zip_code || "",
    idPhoto: null,
  };
}

export async function markPendingCheckinCompleted(id) {
  const { error } = await supabase
    .from("pending_checkins")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function markPendingCheckinDeclinedId(id) {
  const { error } = await supabase
    .from("pending_checkins")
    .update({ status: "declined_id", completed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function markPendingCheckinCleared(id) {
  const { error } = await supabase
    .from("pending_checkins")
    .update({ status: "cleared", completed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
