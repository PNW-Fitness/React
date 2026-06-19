import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()
    if (!email) throw new Error('Email is required')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!  // set via: supabase secrets set
    const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verify the calling user is a staff_admin before doing anything.
    // We use their JWT (passed automatically by supabase.functions.invoke)
    // and the is_staff_admin() RPC which runs SECURITY DEFINER server-side.
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

    // Service-role client bypasses all RLS — only used here, never in the browser.
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Invite the user. Supabase sends them an email to set their password.
    // inviteUserByEmail returns the new user record immediately with their UUID,
    // so we can add them to staff_admins before they even click the link.
    const { data: invite, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email)
    if (inviteErr) throw inviteErr

    const userId = invite.user.id

    // Add to staff_admins (grants write access on the public site data)
    const { error: saErr } = await adminClient
      .from('staff_admins')
      .insert({ user_id: userId })
    // Ignore duplicate — re-inviting an existing admin is harmless
    if (saErr && saErr.code !== '23505') throw saErr

    // Add to admin_profiles (for human-readable display in the Manage Admins screen)
    const { error: apErr } = await adminClient
      .from('admin_profiles')
      .insert({ user_id: userId, email: invite.user.email })
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
