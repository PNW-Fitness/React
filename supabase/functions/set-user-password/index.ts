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
    const { userId, password } = await req.json()
    if (!userId)   throw new Error('userId is required')
    if (!password) throw new Error('password is required')
    if (password.length < 6) throw new Error('Password must be at least 6 characters')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verify the caller is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    // get_my_role() / admin_profiles.role predates the RBAC system (roles,
    // permissions, user_roles) the rest of the app now uses — a Super Admin
    // under RBAC has no reason to also have the legacy role column set to
    // 'admin', so that check rejected legitimate admins. users.manage is the
    // same permission the Users & Roles page itself, and the admin_profiles
    // RLS policies, already gate user-management actions on.
    const { data: canManageUsers } = await callerClient.rpc('auth_has_permission', { permission_key: 'users.manage' })
    if (!canManageUsers) {
      return new Response(JSON.stringify({ error: 'Forbidden — users.manage permission required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { error } = await adminClient.auth.admin.updateUserById(userId, { password })
    if (error) throw error

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
