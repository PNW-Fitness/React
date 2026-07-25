**PNW Fitness Employee App**

**Phase 6 Build Guide --- Final Scope**

*Schedule · Team Board · Time Off · Marketplace · Profile*

Prepared for Xavier Backus, Customer Relations Manager

Pacific Northwest Fitness

July 2026

Table of Contents

1\. Project Setup

-   npm create vite@latest pnw-employee-app \-- \--template react-ts,
    sibling to the other apps in PNW-Fitness/React.

-   npm install \@supabase/supabase-js vite-plugin-pwa
    \@fullcalendar/react \@fullcalendar/list \@fullcalendar/core
    react-router

-   Copy unchanged from pnw-fitness-admin-v2/src/lib/:
    supabaseClient.js, AuthContext.jsx, PermissionsContext.jsx,
    scheduling.ts, teamBoard.ts, timeOff.ts, textFormat.js. Same
    .env.local pattern (same Supabase project).

Do not copy bans.ts or leadsHelpers.ts --- Banned Guests and Leads are
out of scope for this app.

2\. PWA Configuration

Same as the original Phase 4 plan --- unaffected by the scope changes
since it's just manifest/service-worker setup.

VitePWA({

registerType: \'autoUpdate\',

manifest: {

name: \'PNW Fitness Team\', short_name: \'PNW Team\',

theme_color: \'#0E2340\', background_color: \'#0E2340\',

display: \'standalone\', start_url: \'/\',

icons: \[

{ src: \'icon-192.png\', sizes: \'192x192\', type: \'image/png\' },

{ src: \'icon-512.png\', sizes: \'512x512\', type: \'image/png\' },

\],

},

})

**✓ Checkpoint:** Manifest detected with no errors (Chrome DevTools →
Application → Manifest) before building any page.

3\. Push Notifications --- built on the existing notifications table

This replaces Phase 4's three-hardcoded-trigger-points plan with a
single, general mechanism, per the Design Addendum Section 5.

\-- supabase/migrations/042_push_subscriptions.sql

CREATE TABLE IF NOT EXISTS public.push_subscriptions (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

endpoint TEXT NOT NULL UNIQUE,

p256dh TEXT NOT NULL,

auth TEXT NOT NULL,

created_at TIMESTAMPTZ NOT NULL DEFAULT now()

);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON
push_subscriptions(user_id);

\-- Fire push on every new notification, regardless of which feature
created it

CREATE OR REPLACE FUNCTION public.trigger_push_on_notification()

RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path =
public AS \$\$

BEGIN

PERFORM net.http_post(

url := \'\<your-project-ref\>.supabase.co/functions/v1/send-push\',

body := jsonb_build_object(\'user_id\', NEW.user_id, \'title\', \'PNW
Fitness\', \'body\', NEW.message, \'link\', NEW.link),

headers := jsonb_build_object(\'Authorization\', \'Bearer
\<service-role-key-as-secret\>\', \'Content-Type\',
\'application/json\')

);

RETURN NEW;

END;

\$\$;

DROP TRIGGER IF EXISTS trg_push_on_notification ON notifications;

CREATE TRIGGER trg_push_on_notification

AFTER INSERT ON notifications

FOR EACH ROW EXECUTE FUNCTION public.trigger_push_on_notification();

Requires the pg_net extension (enable via Supabase Dashboard → Database
→ Extensions if not already on) and the project ref / service key stored
as Postgres secrets, not hardcoded in the migration file.

3.1 send-push Edge Function

-   Generate VAPID keys (npx web-push generate-vapid-keys), public key
    as a Vite env var, private key as an Edge Function secret.

-   Deno function: takes { user_id, title, body, link }, looks up all
    push_subscriptions rows for that user, sends to each via the Web
    Push protocol.

3.2 Client subscribe flow

Notification.requestPermission() → registration.pushManager.subscribe({
userVisibleOnly: true, applicationServerKey }) → upsert the subscription
into push_subscriptions on endpoint. Surface this as a prompt on first
login or a toggle in Profile --- there's no separate Settings tab in
this scope, per the earlier decision to fold it into Profile.

**✓ Checkpoint:** Trigger a real event (e.g. request a trade as a test
account) and confirm a push arrives on an installed-iOS device and an
Android device, and confirm tapping a notification with an unrecognized
link (e.g. a lead-related one) falls back gracefully rather than
erroring.

4\. Pages

4.1 Schedule

-   FullCalendar listWeek view over staff_shifts (via scheduling.ts),
    filtered to the signed-in user's shifts plus open shifts matching
    their role.

-   Request Trade / Claim Shift actions call requestTrade / claimShift
    directly --- no reimplementation.

-   Manager/Super Admin: render approve/deny controls
    (approveTrade/denyTrade) gated on shift_trade.manage, same as the
    admin dashboard's PendingTradesPanel logic, condensed for mobile.

4.2 Marketplace

-   A dedicated feed --- not nested inside Schedule --- listing trade
    offers via loadTradeTargets, matching admin-v2's Marketplace.tsx
    pattern.

-   Accept flow: AcceptTradeModal equivalent, offering both \"take it
    over\" and \"counter with one of my shifts\" (acceptTrade with
    optional offered_shift_id).

4.3 Time Off

-   loadMyTimeOff + requestTimeOff for every employee;
    loadAvailability + createAvailabilityRule for setting preferences.

-   Manager/Super Admin: loadPendingTimeOff + decideTimeOff, plus
    blackout date management, gated on time_off.manage.

4.4 Team Board

-   loadAnnouncements for everyone; createAnnouncement form gated on
    team_board.post --- direct port, no new decisions.

4.5 Profile

-   Build alongside the admin dashboard's Phase 5 work --- same
    admin_profiles.phone_number migration, same Supabase Auth updateUser
    calls for email (confirmation-link flow) and password.

-   The notification-permission toggle from Section 3.2 lives here too.

5\. Navigation

Bottom tab bar: Schedule / Marketplace / Time Off / Team Board /
Profile. Five tabs is on the higher end for a mobile bottom bar --- if
it feels cramped once built, folding Marketplace into a Schedule sub-tab
is a reasonable fallback, but build them as five first and judge on a
real device before deciding to collapse anything.

6\. Build Order

-   1\. Scaffold + PWA config (Section 1--2) --- checkpoint before any
    page work.

-   2\. Push infrastructure (Section 3) --- checkpoint with a real test
    notification before building pages that depend on it.

-   3\. Schedule + Marketplace together (Section 4.1--4.2) --- they
    share the same lib file and trade concepts.

-   4\. Time Off (Section 4.3).

-   5\. Team Board (Section 4.4) --- smallest, no dependencies on
    anything else.

-   6\. Profile (Section 4.5) --- coordinate with whoever/whatever is
    building the admin dashboard's equivalent Phase 5 work so the
    migration only runs once.
