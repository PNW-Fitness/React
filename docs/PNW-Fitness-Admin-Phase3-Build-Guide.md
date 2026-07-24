**PNW Fitness Admin Dashboard**

**Phase 3 Build Guide**

*Staff Scheduling · Shift Trades · Team Announcements*

Prepared for Xavier Backus, Customer Relations Manager

Pacific Northwest Fitness

July 2026

*Companion to the Phase 3 Design Addendum. Builds on top of
pnw-fitness-admin-v2.*

Table of Contents

1\. Overview

Database-first again: run the migration in Section 2, then build
Schedule before Team Board --- Team Board has no dependency on the
scheduling tables and is a good lower-stakes second step. FullCalendar
and all its plugins are already in package.json from the TailAdmin
template; no new npm install is needed for this phase.

2\. Migration

\-- supabase/migrations/031_scheduling.sql

CREATE TABLE IF NOT EXISTS public.staff_shifts (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

assigned_to UUID REFERENCES auth.users(id),

role_label TEXT NOT NULL,

shift_date DATE NOT NULL,

start_time TIME NOT NULL,

end_time TIME NOT NULL,

status TEXT NOT NULL DEFAULT \'scheduled\'

CHECK (status IN
(\'scheduled\',\'open\',\'trade_pending\',\'completed\',\'no_show\')),

notes TEXT,

created_by UUID REFERENCES auth.users(id),

created_at TIMESTAMPTZ NOT NULL DEFAULT now()

);

CREATE INDEX IF NOT EXISTS idx_staff_shifts_date ON
staff_shifts(shift_date);

CREATE INDEX IF NOT EXISTS idx_staff_shifts_assignee ON
staff_shifts(assigned_to);

CREATE TABLE IF NOT EXISTS public.shift_trade_requests (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

shift_id UUID NOT NULL REFERENCES staff_shifts(id) ON DELETE CASCADE,

requested_by UUID NOT NULL REFERENCES auth.users(id),

requested_to UUID REFERENCES auth.users(id),

reason TEXT,

status TEXT NOT NULL DEFAULT \'pending\'

CHECK (status IN
(\'pending\',\'approved\',\'denied\',\'claimed\',\'cancelled\')),

decided_by UUID REFERENCES auth.users(id),

decided_at TIMESTAMPTZ,

created_at TIMESTAMPTZ NOT NULL DEFAULT now()

);

CREATE INDEX IF NOT EXISTS idx_trade_requests_shift ON
shift_trade_requests(shift_id);

CREATE TABLE IF NOT EXISTS public.team_announcements (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

title TEXT NOT NULL,

body TEXT NOT NULL,

posted_by UUID REFERENCES auth.users(id),

posted_by_name TEXT,

pinned BOOLEAN NOT NULL DEFAULT false,

created_at TIMESTAMPTZ NOT NULL DEFAULT now()

);

\-- New permission keys

INSERT INTO permissions (key, label, group_name) VALUES

(\'pages.schedule\', \'View Schedule page\', \'Schedule\'),

(\'schedule.manage\', \'Create/edit/delete/assign shifts\',
\'Schedule\'),

(\'shift_trade.request\', \'Request a trade on own shift\',
\'Schedule\'),

(\'shift_trade.manage\', \'Approve/deny trade requests\', \'Schedule\'),

(\'pages.team_board\', \'View team announcements\', \'Team Board\'),

(\'team_board.post\', \'Post a new announcement\', \'Team Board\')

ON CONFLICT (key) DO NOTHING;

\-- pages.schedule, shift_trade.request, pages.team_board: every role

INSERT INTO role_permissions (role_id, permission_id)

SELECT r.id, p.id FROM roles r, permissions p

WHERE p.key IN
(\'pages.schedule\',\'shift_trade.request\',\'pages.team_board\')

ON CONFLICT DO NOTHING;

\-- schedule.manage, shift_trade.manage, team_board.post: Manager +
Super Admin only

INSERT INTO role_permissions (role_id, permission_id)

SELECT r.id, p.id FROM roles r, permissions p

WHERE r.name IN (\'Manager\',\'Super Admin\')

AND p.key IN
(\'schedule.manage\',\'shift_trade.manage\',\'team_board.post\')

ON CONFLICT DO NOTHING;

**✓ Checkpoint:** Migration applies cleanly; all six new permission keys
exist and are seeded correctly; logging in as each existing role shows
no unexpected new UI yet (routes/pages come in the next steps).

3\. Schedule Page

3.1 Adapt TailAdmin's Calendar.tsx

-   Copy pages/Calendar.tsx into a new pages/Schedule/Schedule.tsx as
    your starting point --- keep the FullCalendar setup (plugins,
    dayGrid/timeGrid/list views, the Modal + useModal hook) but replace
    its hardcoded useEffect sample-events array with a real fetch from
    staff_shifts.

-   Map staff_shifts rows to FullCalendar EventInput objects: title =
    \"{role_label} -- {assignee name or \'Open\'}\", start/end built
    from shift_date + start_time/end_time, and extendedProps.calendar
    set by status (scheduled → Primary, open → Warning, trade_pending →
    Danger, completed → Success) so the template's existing color-coding
    does the visual work for free.

-   handleDateSelect (clicking an empty range) → only open the add-shift
    modal if usePermissions().can(\'schedule.manage\'); otherwise no-op
    for everyone else.

-   handleEventClick → branch on who's viewing: Manager/Super Admin get
    the full edit/delete/reassign modal; the shift's own assigned_to
    sees a read-only detail view plus a \"Request Trade\" button;
    everyone else sees read-only detail with no actions.

3.2 Trade requests

-   \"Request Trade\" opens a small form (reuse
    components/ui/modal/index.tsx) with a segmented choice --- \"Drop to
    open\" vs. \"Offer to a coworker\" (Select.tsx populated with staff
    matching the shift's role_label) --- plus an optional reason
    TextArea.

-   On submit: insert into shift_trade_requests (status=\'pending\'),
    update the shift's status to \'trade_pending\' so it re-renders in
    the Danger color immediately.

-   Add a small pending-requests panel/badge on the Schedule page,
    visible only with shift_trade.manage, listing open trade requests
    with Approve/Deny buttons.

-   Approve on a \"drop to open\" request: set staff_shifts.assigned_to
    = null, status = \'open\'; set the trade request to \'approved\'.
    Approve on a direct offer: set assigned_to to the requested_to user,
    status back to \'scheduled\'.

-   Deny: set the trade request to \'denied\', revert the shift's status
    to \'scheduled\'.

-   On an \"open\" shift, render a \"Claim Shift\" button for any staff
    member whose role matches role_label --- clicking it sets
    assigned_to to themselves and status to \'scheduled\' directly (no
    separate manager approval needed here, since the manager already
    approved the drop).

**✓ Checkpoint:** As Manager/Super Admin: create a shift, edit it,
delete it, and approve/deny a trade request. As a Trainer: see the
calendar, request a trade only on your own shifts, and claim an open
shift matching your role. As Front Desk: same read/claim/trade-request
behavior scoped to Front Desk shifts.

4\. Team Board Page

-   New route /team-board, new sidebar item gated on pages.team_board
    (granted to every role).

-   Feed layout → TailAdmin's components/common/ComponentCard.tsx per
    announcement, pinned posts sorted first then newest-first.

-   \"New Announcement\" button + form (InputField.tsx for title,
    TextArea.tsx for body) rendered only when
    usePermissions().can(\'team_board.post\') is true.

**✓ Checkpoint:** Manager/Super Admin can post and pin; every other role
sees the feed read-only with no post button rendered.

5\. Sidebar

Add \"Schedule\" and \"Team Board\" to AppSidebar.tsx's nav array,
filtered the same permission-driven way as the Phase 1/2 items --- both
should appear for every role since pages.schedule and pages.team_board
are granted broadly; only the in-page actions differ by role.
