// Sends a staff notification email via Resend when a new lead is submitted.
// Called by the public site after inserting into lead_submissions.
//
// Required Supabase secret:  RESEND_API_KEY   (your Resend API key)
// Optional Supabase secret:  NOTIFY_EMAIL     (defaults to info@pnw-fitness.com)
// Required in Resend:        verify the pnw-fitness.com domain so the 'from'
//                            address is accepted.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SOURCE_LABELS: Record<string, string> = {
  join:                'New Lead',
  tour:                'Tour Request',
  booking:             'Booking',
  training_assessment: 'TA Request',
  nasm_partnership:    'NASM Certification',
}

const DETAIL_LABELS: Record<string, string> = {
  // training_assessment
  contact_method:    'Preferred contact',
  membership_status: 'Membership status',
  goals:             'Goals',
  fitness_level:     'Fitness level',
  availability:      'Availability',
  medical_notes:     'Medical / joint notes',
  // nasm_partnership
  mailing_address:   'Mailing address',
  course:            'Course',
  questions:         'Questions',
  // join / tour / booking
  plan:              'Plan',
  date:              'Date',
  time:              'Time',
  group:             'Group size',
  notes:             'Notes',
  type:              'Booking type',
}

function formatDetails(details: Record<string, string> | null): string {
  if (!details) return ''
  return Object.entries(details)
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;white-space:nowrap">${DETAIL_LABELS[k] ?? k}</td><td style="padding:4px 0;color:#111">${v}</td></tr>`)
    .join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { lead_id } = await req.json()
    if (!lead_id) throw new Error('lead_id is required')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendKey   = Deno.env.get('RESEND_API_KEY')
    const notifyEmail = Deno.env.get('NOTIFY_EMAIL') ?? 'info@pnw-fitness.com'

    if (!resendKey) {
      console.warn('RESEND_API_KEY not set — skipping email notification')
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: lead, error } = await adminClient
      .from('lead_submissions')
      .select('*')
      .eq('id', lead_id)
      .single()

    if (error || !lead) throw new Error(`Lead not found: ${lead_id}`)

    const label      = SOURCE_LABELS[lead.source] ?? lead.source
    const detailRows = formatDetails(lead.details)
    const submitted  = new Date(lead.created_at).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles',
    })

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family:Inter,Arial,sans-serif;background:#f9fafb;margin:0;padding:32px">
  <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:#2563EB;padding:20px 28px">
      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.7)">PNW Fitness</p>
      <h1 style="margin:4px 0 0;font-size:22px;font-weight:800;color:#fff">${label}</h1>
    </div>
    <div style="padding:28px">
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280;white-space:nowrap">Name</td><td style="padding:4px 0;color:#111;font-weight:600">${lead.name ?? '—'}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280;white-space:nowrap">Email</td><td style="padding:4px 0"><a href="mailto:${lead.email}" style="color:#2563EB">${lead.email ?? '—'}</a></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280;white-space:nowrap">Phone</td><td style="padding:4px 0;color:#111">${lead.phone ?? '—'}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280;white-space:nowrap">Submitted</td><td style="padding:4px 0;color:#111">${submitted} PT</td></tr>
        ${detailRows}
      </table>
      <a href="https://react-rouge-nu.vercel.app/leads" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:13px">View in Admin Dashboard →</a>
    </div>
  </div>
</body>
</html>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PNW Fitness <onboarding@resend.dev>',
        to: [notifyEmail],
        subject: `[PNW Fitness] ${label} — ${lead.name ?? lead.email}`,
        html,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Resend error ${res.status}: ${body}`)
    }

    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('notify-lead error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
