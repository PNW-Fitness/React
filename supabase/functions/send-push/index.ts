// Sends a Web Push notification to every device subscribed for a user.
// Triggered by the trg_push_on_notification Postgres trigger (migration
// 042) on every insert into public.notifications — one central mechanism
// for all features (schedule, trades, time off, team board, ...), per the
// Phase 6 Design Addendum Section 5.
//
// Required Supabase secrets:
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY  (npx web-push generate-vapid-keys)
//   PUSH_TRIGGER_SECRET                  shared secret checked against the
//                                        X-Trigger-Secret header — same
//                                        value as Vault's 'push_trigger_secret'
//                                        (see migration 042)
//
// Deployed with --no-verify-jwt: the caller is Postgres via pg_net, not a
// normal Supabase-authenticated client, so the shared-secret header above
// is the real auth check, done manually below.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-trigger-secret',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const triggerSecret = Deno.env.get('PUSH_TRIGGER_SECRET')
    if (!triggerSecret || req.headers.get('x-trigger-secret') !== triggerSecret) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { user_id, title, body, link } = await req.json()
    if (!user_id) throw new Error('user_id is required')

    const vapidPublicKey  = Deno.env.get('VAPID_PUBLIC_KEY')!
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!
    webpush.setVapidDetails('mailto:info@pnw-fitness.com', vapidPublicKey, vapidPrivateKey)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: subs, error } = await adminClient
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', user_id)

    if (error) throw error
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = JSON.stringify({ title: title ?? 'PNW Fitness', body: body ?? '', link: link ?? null })

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
      ),
    )

    // A 404/410 from the push service means the subscription is dead
    // (uninstalled app, expired endpoint) — clean it up so it isn't
    // retried on every future notification.
    const deadIds: string[] = []
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const statusCode = (r.reason as { statusCode?: number })?.statusCode
        if (statusCode === 404 || statusCode === 410) deadIds.push(subs[i].id)
        else console.error('push send failed:', (r.reason as Error)?.message ?? r.reason)
      }
    })

    if (deadIds.length > 0) {
      await adminClient.from('push_subscriptions').delete().in('id', deadIds)
    }

    const sent = results.filter((r) => r.status === 'fulfilled').length
    return new Response(JSON.stringify({ sent, removed: deadIds.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-push error:', (err as Error).message)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
