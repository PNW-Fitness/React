**PNW Fitness Employee App**

**Phase 6 Design Addendum --- Final Scope**

*Schedule · Team Board · Time Off · Marketplace · Profile*

Prepared for Xavier Backus, Customer Relations Manager

Pacific Northwest Fitness

July 2026

*Written directly against the real pnw-fitness-admin-v2 codebase after
review, not against assumptions. Supersedes the Phase 4 Design Addendum
--- that document was written before Time Off and Marketplace existed
and assumed a simpler trade model.*

Table of Contents

1\. Purpose & Scope

Final, confirmed scope for pnw-employee-app: Schedule, Team Board, Time
Off, Marketplace, and Profile. Nothing else --- no admin-only pages
(Leads, Guest Notes, Vendor Log, Activity Log, Users & Roles, Banned
Guests, My Dashboard).

**Supersedes Phase 4:** the Phase 4 document assumed simple
single-target shift trades and had no Time Off or Marketplace at all,
because neither existed yet when it was written. Both are now real,
shipped features in pnw-fitness-admin-v2 with their own tables, RLS
policies, and a genuinely more sophisticated trade model than Phase 4
guessed at. Build against this document, not Phase 4.

2\. Why this build is smaller than it looks

The admin dashboard's business logic already lives in framework-agnostic
TypeScript files, not tangled inside React components:
src/lib/scheduling.ts, src/lib/teamBoard.ts, src/lib/timeOff.ts,
alongside the existing
supabaseClient.js/AuthContext.jsx/PermissionsContext.jsx. Every
meaningful action --- requesting a trade, accepting one, claiming an
open shift, requesting time off, posting an announcement --- is already
a plain exported function that takes arguments and talks to Supabase.
This means the employee app is almost entirely a UI-and-navigation
build: copy the lib files in unchanged, call the same functions, render
mobile-first instead of desktop-first.

3\. Manager actions stay in scope, on mobile

Unlike the Phase 4 draft, this version doesn't treat Manager/Super Admin
as read-only in the employee app. If a Manager has the app installed,
they should be able to approve/deny trades, approve/deny time off, and
set blackout dates from their phone --- same permission-gated pattern as
the admin dashboard (usePermissions().can(\...)), just rendered for a
phone screen. There's no reason to make a manager walk to a desktop to
approve a trade request.

4\. Pages

4.1 Schedule

Reuses lib/scheduling.ts directly: loadStaffDirectory, requestTrade,
claimShift, checkShiftConflicts, shiftHours. Mobile agenda/list view
(FullCalendar's list plugin, already a dependency) rather than the admin
dashboard's full GridView/BulkScheduleModal --- those stay admin-only,
they don't belong on a phone.

-   View own upcoming shifts plus any open shift matching the employee's
    role.

-   Request a trade (drop, or offer to specific coworkers) via
    requestTrade.

-   Claim an open shift via claimShift.

-   Manager/Super Admin: approve/deny trades via approveTrade/denyTrade,
    same as the admin dashboard's PendingTradesPanel.

4.2 Marketplace

Reuses the same lib/scheduling.ts trade functions as Schedule ---
acceptTrade, loadTradeTargets. This is a dedicated feed of trade offers
rather than something buried in the calendar: everything currently
offered (dropped-to-open or targeted at the signed-in employee
specifically) in one browsable list, matching the admin dashboard's
Marketplace.tsx/AcceptTradeModal.tsx pattern.

-   An employee sees offers targeted at them, plus any open-to-anyone
    offers matching their role.

-   Accepting can mean a plain take-over or countering with one of their
    own shifts (offered_shift_id) for a real swap --- that choice
    belongs to the accepter, not the original requester, exactly as the
    admin dashboard already implements it.

-   The trade still isn't final until a Manager/Super Admin approves it.

4.3 Time Off

Reuses lib/timeOff.ts directly.

-   loadMyTimeOff / requestTimeOff --- every employee can see their own
    request history and submit new ones (sick/vacation/personal),
    subject to the same blackout-date and existing-approved-time-off
    checks already enforced at the database level --- nothing new to
    build there, the DB triggers do it regardless of which app calls in.

-   loadAvailability / createAvailabilityRule --- recurring or custom
    availability preferences, same as the admin dashboard's
    AvailabilityRuleModal.

-   Manager/Super Admin: loadPendingTimeOff / decideTimeOff, and
    blackout date management --- same permission gate (time_off.manage)
    as the admin dashboard.

4.4 Team Board

Reuses lib/teamBoard.ts --- loadAnnouncements for everyone,
createAnnouncement gated by team_board.post. Straightforward port, no
new decisions needed here.

4.5 Profile

Same scope as the Phase 5 addendum: email, phone, change password. Not
yet built in the admin dashboard either --- build both together, sharing
the same admin_profiles.phone_number column and the same Supabase Auth
update calls, rather than building it twice independently.

5\. Push Notifications --- revised approach

The admin dashboard already centralizes every notification-worthy event
--- schedule changes, trade requests, time-off decisions, lead-related
alerts for Lead Managers --- into one notifications table (user_id,
message, link, is_read, created_at), populated by Postgres triggers
already in place across migrations 030--034. This is a meaningfully
better foundation than Phase 4's plan, which assumed manually wiring a
push call into three separate mutation code paths.

Revised design: a single trigger on notifications (AFTER INSERT) calls
the send-push Edge Function for that user_id, reading their
push_subscriptions rows (Phase 4's table, still valid). Every current
and future notification type gets push automatically --- no per-feature
wiring required, and nothing about this needs to change when a sixth
feature gets added later.

**⚠ Open question:** Some notification types (e.g. a Lead Manager being
notified about an overdue lead) link to a page (/leads/\...) that
doesn't exist in the employee app at all, since Leads is intentionally
out of scope here. Recommend letting the push notification still arrive
(it's genuinely useful information) but having the employee app treat an
unrecognized link gracefully --- e.g. open to the home tab rather than a
broken route --- rather than trying to filter which notification types
are \"allowed\" to push, which would need maintaining a list that has to
stay in sync with the admin dashboard's features. Flagging since it's a
real design choice, not a non-issue.
