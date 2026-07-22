**PNW Fitness Admin Dashboard**

**Phase 2 Design Addendum**

*Name Formatting · Guest Bans · Trial Passes · Lead Manager Role*

Prepared for Xavier Backus, Customer Relations Manager

Pacific Northwest Fitness

July 2026

*Source: feedback from Daniel Morales, Operations Manager. Builds on the
Phase 1 Design & Functional Specification --- read that document first.*

Table of Contents

1\. Purpose & Scope

This addendum specifies four features requested by Daniel Morales after
the Phase 1 TailAdmin rebuild went live: automatic name formatting, a
guest ban workflow, trial pass tracking, and a new lead-ownership system
for Keith. It assumes the Phase 1 Design Document as background ---
tables, pages, and RBAC concepts introduced there are not re-explained
here.

Automated notifications (overdue leads, trial end dates, unassigned
leads) were part of Daniel's original request but are explicitly
deferred: Xavier plans a separate connected app for notifications in the
future. This document defines the underlying data and events that a
future notification system will need, but does not build any delivery
mechanism (no email, no in-app notification center) in this phase.

2\. Name Formatting

Guest/lead name entries should be normalized to \"Proper Case\" ---
first letter of each word capitalized, everything else lowercase ---
matching Daniel's literal spec (equivalent to Postgres's built-in
initcap() behavior).

-   Applies to lead_submissions.name, on both manual entry (Leads page
    \"Add Lead\" form, inline edit) and any other write path into that
    column.

-   Normalize on save (client-side, before the Supabase insert/update
    call), not as a one-time bulk migration of existing rows ---
    existing historical names are left as-is unless a row is edited.

**⚠ Open question:** initcap-style formatting mangles names with
internal capitals (e.g. \"McDonald\" → \"Mcdonald\", \"DeShawn\" →
\"Deshawn\"). This matches Daniel's literal spec exactly, but is worth a
quick sanity check with him before shipping --- smarter name-casing is
possible but adds real complexity for a fairly small data-quality win.

**⚠ Open question:** Kiosk (pnw-checkin) and QR self-serve
(pnw-checkin-web) submissions bypass the admin app entirely and write to
lead_submissions directly, so client-side formatting in the admin app
won't normalize those. If consistent formatting across every source
matters, the cleaner fix is a Postgres trigger (BEFORE INSERT OR UPDATE
on lead_submissions) that normalizes name at the database level ---
covered as an option in the Build Guide, but flagged here since it's a
scope decision, not just an implementation detail.

3\. Guest Ban Workflow

3.1 Concept

A ban moves through a small lifecycle: requested → approved (or denied)
→ optionally lifted later. Any role with Guest Notes access can request
a ban; only Manager and Super Admin can approve, deny, apply (skip
straight to banned), or lift one.

3.2 New table: guest_bans

A dedicated table rather than a single status column on
lead_submissions, so the request/decision history and reasons are
preserved as an audit trail rather than overwritten each time a ban is
requested or lifted.

  -----------------------------------------------------------------------
  **Column**           **Notes**
  -------------------- --------------------------------------------------
  id                   UUID primary key

  lead_id              FK → lead_submissions.id, cascade delete

  status               requested / approved / denied / lifted

  reason               Required text --- the detailed reason entered in
                       the Request Ban pop-up, or entered directly by a
                       Manager/Super Admin when applying a ban themselves

  requested_by,        Who submitted the request (denormalized name, same
  requested_by_name    author-attribution pattern as
                       lead_notes.author_name)

  requested_at         Timestamp

  decided_by,          Which Manager/Super Admin approved, denied,
  decided_by_name      applied, or lifted it

  decided_at           Timestamp of that decision, nullable until acted
                       on
  -----------------------------------------------------------------------

lead_submissions gains one denormalized column, ban_status (none /
requested / banned), kept in sync by the app whenever a row is written
to guest_bans --- this is what powers the fast list-level
pinning/highlighting/filtering in Leads and Guest Notes without a join
on every page load.

3.3 Guest Notes: Request Ban

-   A \"Request Ban\" button appears under each guest, visible to anyone
    with Guest Notes access (front desk, trainers, managers, super
    admins).

-   Clicking it opens a pop-up with a required reason field --- the
    Submit action is disabled until text is entered.

-   On submit: inserts a guest_bans row with status = \'requested\', AND
    inserts the same reason text as a new lead_notes row for that guest
    (so it shows up in the normal notes thread, per Daniel's spec), AND
    sets lead_submissions.ban_status = \'requested\'.

-   This does not ban the guest --- it only flags the request for
    Manager/Super Admin review.

3.4 Leads: reviewing a request

-   For Managers and Super Admins only: any lead with ban_status =
    \'requested\' is pinned to the top of the Leads list and rendered in
    a distinct highlight color, above the normal sort order.

-   Two actions available on a pinned request: Approve (moves the guest
    to Banned --- guest_bans.status → \'approved\',
    lead_submissions.ban_status → \'banned\') or Remove/Deny the request
    (guest_bans.status → \'denied\', lead_submissions.ban_status reverts
    to \'none\', guest returns to normal Leads/Guest Notes sorting).

-   Managers and Super Admins can also apply a ban directly at any time,
    without a prior request --- same pop-up/reason flow as Request Ban,
    but writes status = \'approved\' immediately rather than
    \'requested\'.

-   Managers and Super Admins can lift a ban from the Banned Guests page
    (or from the highlighted card wherever it appears) --- sets
    guest_bans.status = \'lifted\', lead_submissions.ban_status =
    \'none\', and the guest returns to normal Leads/Guest Notes search
    and sorting.

3.5 New page: Banned Guests

-   New sidebar item, new permission key pages.banned_guests, granted to
    all roles by default (Daniel: \"all roles have access\").

-   Viewing is universal; the approve/deny/apply/lift actions on this
    page are gated separately (bans.manage) to Manager and Super Admin
    only --- other roles see the same list read-only.

-   Lists every lead_submissions row with ban_status = \'banned\', each
    showing the current reason and who applied it; expanding a row could
    show the full guest_bans history for that lead (request → approval
    chain) similar to how Leads shows a notes thread.

3.6 Banned-guest cards elsewhere

Once banned, a guest no longer appears as a normal row in Leads or Guest
Notes search results. Instead, a simple card appears in their place
(matched by name/email/phone against the banned list) --- clicking it
navigates to that guest's entry in the Banned Guests page. This keeps
banned guests from cluttering day-to-day lead/guest workflows while
still surfacing that a match exists if someone searches for them.

**⚠ Open question:** If the same person has multiple lead_submissions
rows (e.g. they submitted a Tour lead once and a Join lead separately),
a ban placed on one row won't automatically catch the others. Worth
deciding whether banning should match by email/phone across all of that
guest's lead_submissions rows, or intentionally stays scoped to the
single row that was banned. Flagging rather than assuming, since it
changes the ban_status sync logic materially.

4\. Trial Pass Tracking

-   lead_submissions gains two columns: trial_pass (boolean, default
    false) and trial_end_date (date, nullable).

-   A checkbox appears under each guest in Leads and Guest Notes;
    checking it reveals a date field for Trial End Date next to it.
    Unchecking clears trial_end_date.

-   Editable by front desk, managers, and super admins --- notably not
    trainers, per Daniel's spec (new permission key:
    leads.trial_pass.manage).

-   Leads gains a new filter (\"Trial Pass\" --- yes/no) and the ability
    to sort the list by trial_end_date, alongside the existing filters
    described in the Phase 1 spec.

5\. Lead Manager Role

Built as a literal new RBAC role, per Xavier's direction --- added to
the roles table exactly like Super Admin, Manager, Trainer, and Front
Desk, with its own row in role_permissions rather than a flag layered on
an existing role.

5.1 New permission keys

  -------------------------------------------------------------------------------
  **Key**                   **Gates**                      **Granted to**
  ------------------------- ------------------------------ ----------------------
  leads.assign              The assignment                 Lead Manager, Manager,
                            dropdown/control on a lead --- Super Admin
                            assign to any trainer, any     
                            Lead Manager, or themselves    

  pages.banned_guests /     Read access to the Banned      Every role
  bans.view                 Guests page                    

  bans.manage               Approve / deny / apply / lift  Manager, Super Admin
                            a ban                          only

  leads.trial_pass.manage   Trial pass checkbox + end date Front Desk, Manager,
                            field                          Super Admin
  -------------------------------------------------------------------------------

5.2 Assignment targeting

-   The \"assign to\" dropdown lists Trainers and Lead Managers (i.e.
    anyone assignable) --- Managers and Super Admins never appear in
    that list, even though they retain full ability to view and change
    any lead's assignment via leads.assign.

-   This is a UI-level filter on who populates the dropdown (by role
    name), not a further RBAC permission --- there's no meaningful
    difference in what a Manager vs. a Lead Manager can technically do
    with leads.assign, only in whether they show up as a target.

5.3 What Lead Manager does not change

Daniel was explicit that this \"will not change anything they see.\"
Lead Manager's page-level access mirrors Trainer's (Leads and Guest
Notes only, no Vendor Log / Activity Log / Users & Roles) --- the role
only adds leads.assign on top of the same baseline Trainer already has.

**⚠ Open question:** The one place this needs a concrete answer:
Trainer's Leads view today is hard-filtered to assigned_to = self
(Design Document Section 7.1). If Lead Manager keeps that exact same
filter, they can't see unassigned leads to assign them in the first
place --- which conflicts with the stated goal of tracking down
unassigned leads. Recommended resolution: Lead Manager's default
filtered view stays assigned_to = self OR assigned_to IS NULL (so they
can find and claim/assign unassigned leads), rather than opening up to
all leads like a Manager would see. This preserves \"won't change
anything they see\" as closely as possible while still making the
assignment feature usable. Worth a quick confirm from Xavier before
Claude Code builds it, since it's a specific interpretation of an
instruction that was genuinely ambiguous as written.

6\. Deferred: Notifications

Not built in this phase. For reference, the three notification triggers
Daniel described (assigned lead stuck in New/Contacted for 2+ weeks,
trial end date arrived, unassigned New lead older than 7 days) all key
off columns that already exist or are being added in this phase (status,
created_at, assigned_to, trial_end_date) --- so no additional data
modeling is required now to support a future notification app. That app
will simply need read access to lead_submissions and a way to identify
who's a Lead Manager (WHERE role = \'Lead Manager\' via user_roles →
roles, once this phase ships).
