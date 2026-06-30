import { supabase } from './supabase.js'
import { getPendingLeads, deletePendingLead, updatePendingLeadAttempt } from './db.js'

function parseInterests(raw) {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string' && raw) {
    try { return JSON.parse(raw) } catch { return [] }
  }
  return []
}

// Returns true if this check-in should be pushed to the leads table.
export function isQualifyingLead(guestSession) {
  const { returnVisit, existingGuestId, formData } = guestSession
  if (!returnVisit || !existingGuestId) return true
  if (formData.visit_reason === 'Interested in membership') return true
  if (parseInterests(formData.interests).includes('Personal Training')) return true
  return false
}

// Constructs the RPC payload from a completed guest session.
export function buildLeadPayload(guestSession, signedAt) {
  const { formData } = guestSession
  const interests = parseInterests(formData.interests)
  const howHeard = formData.how_heard
    ? (formData.how_heard_specify
        ? `${formData.how_heard} — ${formData.how_heard_specify}`
        : formData.how_heard)
    : ''
  return {
    p_name:         `${formData.first_name} ${formData.last_name}`.trim(),
    p_email:        formData.email || '',
    p_phone:        (formData.phone || '').replace(/\D/g, '').slice(-10),
    p_zip_code:     formData.zip_code || '',
    p_visit_reason: formData.visit_reason || '',
    p_how_heard:    howHeard,
    p_interests:    interests.join(', '),
    p_signed_at:    new Date(signedAt.replace(' ', 'T')).toISOString(),
  }
}

// Calls the Supabase upsert RPC. Returns { success, error }.
export async function pushLeadToSupabase(payload) {
  try {
    const { error } = await supabase.rpc('upsert_checkin_lead', payload)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: err?.message ?? String(err) }
  }
}

// Retries every pending lead that has fewer than 10 failed attempts.
export async function retryPendingLeads() {
  let pending
  try {
    pending = await getPendingLeads()
  } catch {
    return
  }
  for (const row of pending) {
    let payload
    try { payload = JSON.parse(row.payload) } catch { continue }
    const { success, error } = await pushLeadToSupabase(payload)
    if (success) {
      await deletePendingLead(row.id)
    } else {
      await updatePendingLeadAttempt(row.id, error)
    }
  }
}
