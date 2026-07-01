import { supabase } from "./supabase.js";

// Printed at the front desk and swapped daily rather than rotated live on a
// screen. A day's code stays valid a little past 24h so it doesn't expire
// overnight before staff get in the next morning to print a fresh one.
const TOKEN_LIFETIME_MS = 25 * 60 * 60 * 1000; // 25 hours

// Returns { token, expiresAt } for the most recent session, or null if none exists.
export async function getActiveCheckinSession() {
  const { data, error } = await supabase
    .from("checkin_sessions")
    .select("token, expires_at")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { token: data.token, expiresAt: data.expires_at };
}

// Deactivates the current session (if any) and issues a fresh ~25h token.
// Used for the daily reprint, and for an emergency "code compromised" reset.
export async function generateNewCheckinSession() {
  const previous = await getActiveCheckinSession();
  if (previous) {
    const { error } = await supabase
      .from("checkin_sessions")
      .update({ active: false })
      .eq("token", previous.token);
    if (error) throw error;
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_MS).toISOString();
  const { error: insertError } = await supabase
    .from("checkin_sessions")
    .insert({ token, expires_at: expiresAt });
  if (insertError) throw insertError;

  return { token, expiresAt };
}
