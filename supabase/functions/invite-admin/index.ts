import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()
    if (!email) throw new Error('Email is required')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verify the caller is a staff admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: isAdmin } = await callerClient.rpc('is_staff_admin')
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden — not a staff admin' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    let userId: string
    let userEmail: string

    // Try to invite. If the user is already registered, look them up instead
    // so we can still grant access without sending a duplicate invite email.
    const { data: invite, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email)

    if (inviteErr) {
      if (inviteErr.message.toLowerCase().includes('already registered') ||
          inviteErr.message.toLowerCase().includes('already been registered')) {
        const { data: existingId, error: lookupErr } = await adminClient
          .rpc('get_user_id_by_email', { p_email: email })
        if (lookupErr || !existingId) throw new Error(`Could not find existing user: ${email}`)
        userId    = existingId
        userEmail = email
      } else {
        throw inviteErr
      }
    } else {
      userId    = invite.user.id
      userEmail = invite.user.email ?? email
    }

    // Grant admin access
    const { error: saErr } = await adminClient
      .from('staff_admins')
      .insert({ user_id: userId })
    if (saErr && saErr.code !== '23505') throw saErr

    const { error: apErr } = await adminClient
      .from('admin_profiles')
      .insert({ user_id: userId, email: userEmail })
    if (apErr && apErr.code !== '23505') throw apErr

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
