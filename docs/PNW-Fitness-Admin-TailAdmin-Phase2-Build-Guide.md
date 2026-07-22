**PNW Fitness Admin Dashboard**

**Phase 2 Build Guide**

*Name Formatting · Guest Bans · Trial Passes · Lead Manager Role*

Prepared for Xavier Backus, Customer Relations Manager

Pacific Northwest Fitness

July 2026

*Companion to the Phase 2 Design Addendum. Builds on top of the
already-live pnw-fitness-admin-v2 app.*

Table of Contents

1\. Overview

This is a database-first phase: every feature here needs schema changes
before any UI work starts. Do the migration in Section 2 first, confirm
it applied cleanly, then build the four features in Sections 3--6. Each
section ends with a checkpoint --- stop there before moving on.

2\. Migration

One new migration file, e.g.
supabase/migrations/030_bans_trials_lead_manager.sql. Run it against the
same Supabase project the admin app already points at --- no new project
needed.

\-- Trial pass + ban status on lead_submissions

ALTER TABLE public.lead_submissions

ADD COLUMN IF NOT EXISTS trial_pass BOOLEAN NOT NULL DEFAULT false,

ADD COLUMN IF NOT EXISTS trial_end_date DATE,

ADD COLUMN IF NOT EXISTS ban_status TEXT NOT NULL DEFAULT \'none\'

CHECK (ban_status IN (\'none\', \'requested\', \'banned\'));

\-- Ban request / decision audit trail

CREATE TABLE IF NOT EXISTS public.guest_bans (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

lead_id UUID NOT NULL REFERENCES lead_submissions(id) ON DELETE CASCADE,

status TEXT NOT NULL CHECK (status IN
(\'requested\',\'approved\',\'denied\',\'lifted\')),

reason TEXT NOT NULL,

requested_by UUID REFERENCES auth.users(id),

requested_by_name TEXT,

requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),

decided_by UUID REFERENCES auth.users(id),

decided_by_name TEXT,

decided_at TIMESTAMPTZ

);

CREATE INDEX IF NOT EXISTS idx_guest_bans_lead ON guest_bans(lead_id);

\-- New role

INSERT INTO roles (name, description)

VALUES (\'Lead Manager\', \'Assigns leads to trainers/self; same page
access as Trainer\')

ON CONFLICT (name) DO NOTHING;

\-- New permission keys

INSERT INTO permissions (key, label, group_name) VALUES

(\'leads.assign\', \'Assign leads to trainers or self\', \'Leads\'),

(\'pages.banned_guests\', \'View Banned Guests page\', \'Pages\'),

(\'bans.view\', \'View ban details\', \'Bans\'),

(\'bans.manage\', \'Approve/deny/apply/lift bans\', \'Bans\'),

(\'leads.trial_pass.manage\', \'Edit trial pass + end date\', \'Leads\')

ON CONFLICT (key) DO NOTHING;

\-- pages.banned_guests / bans.view: grant to every existing role

INSERT INTO role_permissions (role_id, permission_id)

SELECT r.id, p.id FROM roles r, permissions p

WHERE p.key IN (\'pages.banned_guests\', \'bans.view\')

ON CONFLICT DO NOTHING;

\-- bans.manage: Manager + Super Admin only

INSERT INTO role_permissions (role_id, permission_id)

SELECT r.id, p.id FROM roles r, permissions p

WHERE r.name IN (\'Manager\', \'Super Admin\') AND p.key =
\'bans.manage\'

ON CONFLICT DO NOTHING;

\-- leads.trial_pass.manage: Front Desk, Manager, Super Admin

INSERT INTO role_permissions (role_id, permission_id)

SELECT r.id, p.id FROM roles r, permissions p

WHERE r.name IN (\'Front Desk\', \'Manager\', \'Super Admin\') AND p.key
= \'leads.trial_pass.manage\'

ON CONFLICT DO NOTHING;

\-- leads.assign: Lead Manager, Manager, Super Admin

INSERT INTO role_permissions (role_id, permission_id)

SELECT r.id, p.id FROM roles r, permissions p

WHERE r.name IN (\'Lead Manager\', \'Manager\', \'Super Admin\') AND
p.key = \'leads.assign\'

ON CONFLICT DO NOTHING;

\-- Lead Manager gets the same baseline as Trainer

INSERT INTO role_permissions (role_id, permission_id)

SELECT lm.id, p.id FROM roles lm, roles tr, role_permissions rp,
permissions p

WHERE lm.name = \'Lead Manager\' AND tr.name = \'Trainer\'

AND rp.role_id = tr.id AND p.id = rp.permission_id

ON CONFLICT DO NOTHING;

If Xavier confirms the resolution proposed in Design Addendum Section
5.3 (Lead Manager sees assigned-to-self OR unassigned, not all leads),
no schema change is needed for that --- it's a query-level filter change
in the Leads page, covered in Section 6 below.

**✓ Checkpoint:** Migration applies with no errors; roles table shows
Lead Manager; role_permissions has rows for it; existing roles (Trainer,
Front Desk, Manager, Super Admin) are unaffected --- spot-check by
re-logging-in as each and confirming nothing changed for them yet.

3\. Name Formatting

Client-side only for this phase (per Design Addendum Section 2---the
DB-trigger option for kiosk/QR sources is flagged as an open decision,
not built by default).

1.  Add a small utility, e.g. src/lib/textFormat.js, exporting
    toProperCase(str) --- split on whitespace, capitalize first letter
    of each word, lowercase the rest, rejoin.

2.  Call it in LeadsPage / GuestNotesPage wherever a name is written:
    the \"Add Lead\" form submit handler and the inline-edit save
    handler.

**✓ Checkpoint:** Typing \"jOHN sMITH\" or \"mary o\'brien\" into the
name field and saving produces \"John Smith\" / \"Mary O\'brien\" (see
the flagged caveat on names like O\'Brien/McDonald in the Design
Addendum --- confirm this is acceptable before considering this feature
done).

4\. Guest Ban Workflow

4.1 Guest Notes: Request Ban

-   Add a \"Request Ban\" button under each guest card, visible to
    anyone with pages.guest_notes access (no separate permission needed
    --- Daniel didn't restrict who can request).

-   Use TailAdmin's Modal (components/ui/modal/index.tsx) for the
    pop-up, with a required TextArea
    (components/form/input/TextArea.tsx) for the reason. Disable the
    submit Button until the field is non-empty.

-   On submit: insert into guest_bans (status=\'requested\'), insert the
    same text into lead_notes, update
    lead_submissions.ban_status=\'requested\' --- all three in the same
    handler, matching the \"optimistic local update after a successful
    call\" pattern used everywhere else in the app.

4.2 Leads: pinning + review

-   Extend the existing sort logic so any row with
    ban_status=\'requested\' sorts to the top, above the normal
    newest-first/priority order --- only for Managers and Super Admins
    (check usePermissions().can(\'bans.manage\') before applying the
    pin, otherwise render normally).

-   Highlight color → reuse the existing priority-left-border pattern
    from Phase 1, or a full-row background tint using Badge.tsx's
    \"warning\" or \"error\" color token for visual consistency with the
    rest of the app.

-   Approve / Deny buttons → TailAdmin Button.tsx, same confirm-step
    pattern as the existing lead-delete action. Approve updates
    guest_bans.status=\'approved\' +
    lead_submissions.ban_status=\'banned\'; Deny updates
    guest_bans.status=\'denied\' + lead_submissions.ban_status=\'none\'.

-   \"Apply ban directly\" (no prior request) → same Modal/reason flow
    as Request Ban, gated to bans.manage, writes status=\'approved\'
    immediately.

4.3 New page: Banned Guests

-   New route /banned-guests, new sidebar entry gated on
    pages.banned_guests (grant to all roles per the migration above).

-   Table view (TailAdmin Table components) of every lead_submissions
    row with ban_status=\'banned\'. Approve/Deny/Apply/Lift action
    buttons render only when usePermissions().can(\'bans.manage\') is
    true --- everyone else sees the same table read-only, consistent
    with the Design Addendum's \"universal view, gated actions\" split.

-   \"Lift ban\" → guest_bans.status=\'lifted\',
    lead_submissions.ban_status=\'none\'. On success, remove the row
    from this page's list and let the guest reappear in normal
    Leads/Guest Notes results.

4.4 Banned-guest cards in Leads / Guest Notes

-   Filter ban_status=\'banned\' rows out of the normal Leads/Guest
    Notes query results, and instead render a simple ComponentCard
    (components/common/ComponentCard.tsx) for any banned guest that
    matches the active search --- clicking it navigates to
    /banned-guests with that guest pre-selected/expanded (a query param
    or React Router state works fine for this).

5\. Trial Pass Tracking

-   Checkbox → components/form/input/Checkbox.tsx under each guest row
    in Leads and Guest Notes. Checking it conditionally renders a date
    field (components/form/date-picker.tsx) for trial_end_date next to
    it; unchecking clears the stored date on save.

-   Gate the whole control (checkbox + date field) on
    usePermissions().can(\'leads.trial_pass.manage\') --- render as
    plain read-only text for roles without it (e.g. Trainer), consistent
    with how other permission-gated fields degrade elsewhere in the app.

-   Leads filter row → add a Trial Pass yes/no Select.tsx alongside the
    existing filters; add trial_end_date as a sort option next to
    whatever sort control already exists.

**✓ Checkpoint:** As Front Desk, Manager, and Super Admin: can check the
box, set a date, and it persists on refresh. As Trainer: field renders
read-only, no ability to edit. Filter and sort both work against real
data.

6\. Lead Manager Role

-   Assignment dropdown (already exists in Leads per Phase 1) --- change
    its source query to include users with role Trainer OR Lead Manager,
    excluding Manager and Super Admin, regardless of who is viewing it.

-   Gate the dropdown's edit capability on leads.assign instead of (or
    in addition to) whatever currently gates trainer assignment, so Lead
    Manager, Manager, and Super Admin can all use it.

-   Leads page auto-filter: currently, Trainers are silently locked to
    assigned_to = self at the query level (Phase 1 Design Doc, Section
    7.1). For Lead Manager, per the resolution proposed in the Design
    Addendum, change that filter to assigned_to = self OR assigned_to IS
    NULL when the signed-in user's role is Lead Manager specifically ---
    leave the Trainer filter untouched. Confirm this interpretation with
    Xavier before building it; it's flagged as an open question in the
    Design Addendum for a reason.

**✓ Checkpoint:** As Keith (Lead Manager): Leads shows his own assigned
leads plus all unassigned ones, but not leads assigned to other
trainers. He can assign any visible lead to any trainer, any Lead
Manager, or himself. As Manager/Super Admin: still see and can edit
every lead's assignment as before, but do not appear as options in the
assignment dropdown themselves. As a regular Trainer: behavior is
completely unchanged from Phase 1.
