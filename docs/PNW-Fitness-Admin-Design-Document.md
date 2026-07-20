**PNW Fitness Admin Dashboard**

**Design & Functional Specification**

*Scope: Leads · Guest Notes · Vendor Log · Activity Log · Users & Roles,
and the shared Auth / RBAC / Layout plumbing they depend on*

Prepared for Xavier Backus, Customer Relations Manager

Pacific Northwest Fitness

July 2026

*Source: PNW-Fitness/React monorepo, pnw-fitness-admin app, main branch*

Table of Contents

1\. Purpose & Scope

This document is a functional and technical specification of the PNW
Fitness admin dashboard (pnw-fitness-admin) as it exists today,
reverse-documented directly from the production codebase. It exists to
give a clean, accurate baseline before rebuilding the dashboard's visual
layer on TailAdmin React --- so nothing gets lost or silently changed in
the process.

Scope is intentionally narrowed to the five pages Xavier has confirmed
he wants carried forward into the rebuild, plus the shared application
plumbing every one of those pages depends on:

-   Leads --- CRM-style lead list, filtering, status tracking, trainer
    assignment, and notes

-   Guest Notes --- front-desk-facing daily check-in log with quick
    note-taking

-   Vendor Log --- daily vendor sign-in register with realtime updates

-   Activity Log --- read-only staff sign-in audit trail

-   Users & Roles --- user management, RBAC role/permission editor, and
    account provisioning

The other ten pages in the current app (Staff, Pricing, Testimonials,
FAQ, Holiday Hours, Announcements, and the public-content editors behind
them) are out of scope for the rebuild and are not documented here.

2\. System Architecture Overview

2.1 Where this app sits in the larger system

pnw-fitness-admin is one of four applications in the PNW-Fitness/React
monorepo, all sharing one Supabase backend (Postgres + Row-Level
Security + Realtime + Edge Functions + Auth):

-   pnw-checkin --- Tauri desktop kiosk app (front-desk tablet)

-   pnw-fitness-admin --- this app: the staff-facing admin panel

-   pnw-checkin-web --- mobile QR self-serve check-in web app

-   pnw-fitness --- the public marketing site

The Leads, Guest Notes, and Vendor Log pages in particular exist to
surface data that originates in pnw-checkin and pnw-checkin-web --- the
kiosk and the QR self-serve flow write into lead_submissions and
vendor_submissions, and this admin app is where staff triage and act on
it.

2.2 Current tech stack

  ----------------------------------------------------------------------------
  **Layer**           **Technology**           **Version (from package.json)**
  ------------------- ------------------------ -------------------------------
  Framework           React                    18.3.1

  Routing             react-router-dom         6.27.0

  Build tool          Vite                     5.4.9

  Styling             Tailwind CSS             3.4.13 (JS config, no custom
                                               theme extension)

  Backend client      \@supabase/supabase-js   2.45.0

  Hosting             Vercel                   vercel.json present, static SPA
                                               build

  Auth                Supabase Auth            email/password + magic invite
                                               links
  ----------------------------------------------------------------------------

There is no component library, CSS framework beyond Tailwind utilities,
or state management library in use --- every page manages its own state
with useState/useEffect/useCallback and talks to Supabase directly.

3\. Shared Application Plumbing

Every page in scope sits inside the same three-layer wrapper:
AuthProvider → PermissionsProvider → Layout. Understanding these is a
prerequisite for touching any individual page, because none of the five
pages re-implement auth or nav --- they all consume it.

3.1 AuthContext

File: src/lib/AuthContext.jsx. Wraps Supabase's auth session in React
context. On mount, it calls supabase.auth.getSession() and subscribes to
supabase.auth.onAuthStateChange() to keep session state live. Once a
session exists, it separately calls the get_my_role RPC to resolve a
legacy role string (used only as a fallback/display role, not the
primary permission source --- see RBAC below). Exposes { session, role }
via useAuth().

3.2 PermissionsContext

File: src/lib/PermissionsContext.jsx. This is the real authorization
engine. Once a session and role are resolved, it queries user_roles →
roles → role_permissions → permissions for the current user and builds a
flat array of permission key strings (e.g. \"leads.view\",
\"pages.vendor_log\"). Exposes { permissions, rbacRoleName,
permissionsReady, can(key) } via usePermissions().

One hard-coded exception: if the resolved role name is exactly \"Super
Admin,\" the app grants every permission in a local ALL_PERMS constant
rather than trusting whatever rows happen to be in role_permissions for
that role. This means Super Admin access cannot be accidentally narrowed
by editing that role's permission checkboxes in the UI --- the Roles tab
explicitly disables editing for Super Admin for this reason.

3.3 Routing & permission gating

File: src/App.jsx. Uses react-router-dom v6 with a single BrowserRouter
and a flat route list. Every protected route is wrapped in a
PermissionRoute component that takes a requiredPerms array; if the
current user lacks any required permission, it silently redirects them
to the first page they do have access to (checked in a fixed priority
order: Staff → Leads → Guest Notes → Vendor Log → a \"No pages
assigned\" screen as the final fallback).

There is also a 30-minute inactivity auto-logout: a global
mousemove/keydown/click/touchstart listener resets a timer; on expiry it
signs the user out and redirects to /login?timeout=1.

3.4 Layout & navigation

File: src/components/Layout.jsx. A fixed left sidebar (bg-blue-700,
208px wide) plus a scrollable main content area. The nav item list is a
hard-coded array (ROLE_NAV) of { to, label, permKey } entries; Layout
filters it live against usePermissions().can(permKey), so each signed-in
user only ever sees the nav items their role grants --- there is no
separate \"hide vs. disable\" state, items that aren't permitted simply
don't render.

4\. RBAC Model

The dashboard uses a database-backed role/permission system (introduced
in migration 019_rbac_schema.sql), not hard-coded role checks. Four
tables drive it:

  -----------------------------------------------------------------------
  **Table**          **Purpose**
  ------------------ ----------------------------------------------------
  roles              Named roles (Super Admin, Manager, Trainer, Front
                     Desk, plus any custom roles created in the UI)

  permissions        Flat catalog of permission keys, each with a label
                     and a group_name used to cluster them in the Roles
                     tab UI

  role_permissions   Many-to-many join: which permissions each role
                     grants

  user_roles         One row per user --- a user has exactly one role at
                     a time (primary key on user_id)
  -----------------------------------------------------------------------

A SECURITY DEFINER Postgres function, auth_has_permission(key), lets RLS
policies check permissions server-side without exposing the join tables
to anonymous clients. The client-side can() check in PermissionsContext
mirrors this but is not itself a security boundary --- it only controls
what renders, not what the database will allow.

4.1 Default seeded roles

  ------------------------------------------------------------------------
  **Role**     **Description**           **Default permission set**
  ------------ ------------------------- ---------------------------------
  Super Admin  Full access to everything All permissions (hard-coded
                                         client-side, not editable)

  Manager      Full operational access   Everything except roles.manage
                                         and users.manage

  Trainer      View and annotate         leads.view, leads.notes.view,
               assigned leads            leads.notes.add, schedule.view

  Front Desk   Process check-ins, view   checkin.queue.view,
               leads                     checkin.queue.manage, leads.view
  ------------------------------------------------------------------------

4.2 Permission keys used by the five in-scope pages

  -----------------------------------------------------------------------
  **Key**                     **Gates**
  --------------------------- -------------------------------------------
  pages.leads                 Route access to /leads

  pages.guest_notes           Route access to /guest-notes

  pages.vendor_log            Route access to /vendor-log

  pages.activity_log          Route access to /activity

  pages.users_roles           Route access to /users-roles

  leads.view / leads.create / Leads page: read access, manual lead
  leads.edit_status /         creation, status/assignment edits,
  leads.edit_details          contact-detail edits

  leads.notes.view /          Leads page: viewing and adding trainer
  leads.notes.add             notes

  vendor_log.notes.add        Vendor Log page: editing the Notes column

  users.view / users.manage / Users & Roles page: viewing users, changing
  roles.manage                role assignments / activating-deactivating
                              accounts, editing role/permission
                              checkboxes
  -----------------------------------------------------------------------

Two additional gates are hard-coded to the legacy role === \'admin\'
check rather than a permission key: deleting a lead and
marking/unmarking a lead as a test entry (Leads page), and deleting a
vendor log row (Vendor Log page). These are worth deciding whether to
formalize into real permission keys during the rebuild, since everything
else has moved to the RBAC table system.

5\. Data Model

Tables directly read or written by the five in-scope pages, as defined
across the migrations in supabase/migrations/.

5.1 lead_submissions

Backs the Leads and Guest Notes pages. Rows are created by the kiosk
app, the QR check-in web app, the public site, or manually by staff via
the Leads page \"Add Lead\" form.

  -----------------------------------------------------------------------
  **Column**       **Notes**
  ---------------- ------------------------------------------------------
  id               UUID primary key

  source           join / tour / booking / training_assessment /
                   nasm_partnership / checkin_app / classpass

  name, email,     Contact info; at least one of email/phone required on
  phone            manual creation

  details          JSONB --- shape varies by source (plan, visit_reason,
                   fitness_level, etc.); see SOURCE_LABELS / DETAIL_ORDER
                   in LeadsPage.jsx for the per-source field maps

  status           new / contacted / converted / not_interested / closed

  assigned_to      FK-style reference to a user_id with the Trainer role

  visit_count,     Repeat-visit tracking; \"Log Visit\" increments
  first_seen,      visit_count and stamps last_seen
  last_seen        

  is_test          Boolean flag; test entries are hidden by default
                   (Leads page only, admin-only to toggle)

  created_at       Submission timestamp
  -----------------------------------------------------------------------

5.2 lead_notes

Free-text notes attached to a lead, used by both the Leads page
(trainer-facing) and the Guest Notes page (front-desk-facing) --- they
read and write the same table.

  -----------------------------------------------------------------------
  **Column**       **Notes**
  ---------------- ------------------------------------------------------
  id               UUID primary key

  lead_id          FK → lead_submissions.id, cascade delete

  note_text        Required

  author_name      Denormalized display name captured at write time
                   (added in migration 016, so notes remain attributed
                   even if the author's account is later removed)

  created_at       Timestamp; notes list newest-first
  -----------------------------------------------------------------------

5.3 vendor_submissions

Backs the Vendor Log page. Rows are written exclusively by the QR
check-in web app (pnw-checkin-web), referencing the active
checkin_sessions token.

  -----------------------------------------------------------------------
  **Column**       **Notes**
  ---------------- ------------------------------------------------------
  id               UUID primary key

  session_token    FK → checkin_sessions.token

  name, company,   Required; captured from the vendor sign-in form
  reason           

  notes            Nullable; staff-editable from the admin table

  submitted_at     Timestamp; used to filter by day
  -----------------------------------------------------------------------

5.4 sign_in_log

Backs the Activity Log page. Read-only from the admin UI --- rows are
inserted exclusively by a database trigger on sign-in, not by any client
code.

  -----------------------------------------------------------------------
  **Column**       **Notes**
  ---------------- ------------------------------------------------------
  id               UUID primary key

  user_id          FK → auth.users, nullable on delete

  email            Denormalized at sign-in time

  signed_in_at     Timestamp
  -----------------------------------------------------------------------

5.5 admin_profiles, user_roles, roles, permissions, role_permissions

Back the Users & Roles page. admin_profiles (user_id, email,
display_name, is_active, created_at) is the app-level staff directory,
separate from Supabase's own auth.users table --- is_active is a soft
flag that does not touch the underlying auth account. The other four
tables are the RBAC system described in Section 4.

6\. Edge Functions

Four Supabase Edge Functions (Deno, in supabase/functions/) handle
operations that require the service-role key and therefore cannot run
client-side.

  --------------------------------------------------------------------------
  **Function**        **Called from**          **Purpose**
  ------------------- ------------------------ -----------------------------
  invite-admin        Users & Roles → Add User Grants a user access and
                      → \"Generate invite      returns a one-time
                      link\"                   password-setup link

  create-admin-user   Users & Roles → Add User Creates an account
                      → \"Set username &       immediately with a
                      password\"               username/password (no email
                                               required)

  set-user-password   Users & Roles → Users    Admin-driven password reset
                      tab → \"Set password\"   without sending an email
                      modal                    

  notify-lead         Public site, after a     Sends a staff notification
                      lead insert (not the     email via Resend when a new
                      admin app)               lead comes in
  --------------------------------------------------------------------------

7\. Page Specifications

7.1 Leads (/leads)

The largest and most complex page in the app (1,186 lines). A CRM-style
list of all lead_submissions rows with heavy filtering, inline editing,
and a notes thread per lead.

Key features

-   Debounced (300ms) search across name/email/phone, plus filters for
    source, status, visit reason, date range, assigned trainer, and a
    \"hide test entries\" toggle (default on)

-   Color-coded priority left-border on each row, driven by
    details.visit_reason / details.interests (membership interest = red,
    PT interest = orange, ClassPass/Event = yellow)

-   Server-side pagination at 25 rows/page via Supabase .range(), with
    an exact count for \"Showing X--Y of Z\"

-   Auto-refresh every 30 seconds (silent --- no loading spinner) so new
    kiosk/QR submissions appear without a manual reload

-   Expandable row per lead revealing: full contact details, a
    per-source detail field list (e.g. Tour shows date/time/group,
    Training Assessment shows fitness level/goals), trainer assignment
    dropdown, and a notes thread with add-note form

-   Inline edit mode (permission-gated) for
    name/email/phone/source/status/visit metadata

-   Manual \"Add Lead\" form for phone/walk-in leads that never came
    through a digital channel

-   \"Log Visit\" action that increments visit_count and bumps
    last_seen, re-sorting the lead to the top

-   Trainers viewing this page are silently locked to assigned_to =
    their own user id --- there is no UI toggle for this, it's enforced
    in the query itself

-   Admin-only: delete a lead (with confirm step), toggle an is_test
    flag

Primary Supabase calls

-   lead_submissions select with left-join count of lead_notes,
    filtered/sorted/paginated per the active filter state

-   lead_notes select/insert scoped to a single lead_id, loaded lazily
    on row expand

-   user_roles + admin_profiles queries to populate the Trainer
    filter/assign dropdowns

7.2 Guest Notes (/guest-notes)

A simpler, front-desk-oriented view over the same lead_submissions /
lead_notes tables as Leads, but reframed around \"who checked in today\"
rather than lead pipeline management.

-   Default view: everyone with last_seen ≥ today, newest first

-   A separate search box switches the list into an all-time
    search-by-name/email/phone mode (debounced, limit 15)

-   Each guest row expands into a notes thread --- identical add-note
    interaction to Leads, but without author role/color styling

-   \"Log Visit\" button available inline, same effect as on the Leads
    page

-   No filters, no pagination, no status/source management ---
    intentionally minimal for fast front-desk use

7.3 Vendor Log (/vendor-log)

A daily register of vendor sign-ins, sourced entirely from the QR
check-in web app.

-   Date picker (defaults to today, max = today) filters
    vendor_submissions by submitted_at

-   Live Supabase Realtime subscription on postgres_changes (INSERT)
    when viewing today's date --- new vendor sign-ins appear without a
    refresh

-   Table columns: Time In, Name, Company, Phone, Reason for Visit,
    Notes (inline-editable), and an admin-only Delete column with a
    confirm step

-   Notes editing is gated by the vendor_log.notes.add permission;
    delete is gated by the legacy role === \'admin\' check

7.4 Activity Log (/activity)

The simplest page in scope --- a read-only table of the most recent 100
rows from sign_in_log (email + signed-in timestamp). No filters, no
actions, no pagination beyond the fixed 100-row limit.

7.5 Users & Roles (/users-roles)

A three-tab page (832 lines) covering staff account management, RBAC
configuration, and account provisioning.

Users tab

-   Table of all admin_profiles joined to their current RBAC role, with
    active/inactive status

-   Per-row RBAC role dropdown (writes to user_roles via upsert/delete)
    --- blocks demoting or deactivating the last remaining Super Admin

-   Activate/Deactivate toggle (soft flag on admin_profiles.is_active,
    does not touch the Supabase auth account)

-   \"Set password\" --- opens a modal, calls the set-user-password Edge
    Function directly (admin sets it, no email involved)

-   \"Email reset\" --- calls supabase.auth.resetPasswordForEmail,
    redirecting to /reset-password

-   \"Remove\" --- deletes the staff_admins and admin_profiles rows
    (does not delete the underlying Supabase auth account) after a
    native window.confirm()

Roles & Permissions tab

-   Accordion list of all roles; expanding a role shows every permission
    (grouped by group_name) as a checkbox toggling role_permissions rows
    one at a time

-   Super Admin's checkboxes render disabled/opacity-reduced --- not
    editable, per the client-side ALL_PERMS override described in
    Section 3.2

-   Create new role (name + optional description) and delete role
    (blocked with a count-based error message if any user is currently
    assigned to it)

Add User tab

-   Two modes, toggled by a segmented control: \"Generate invite link\"
    (calls invite-admin, shows a copyable one-time link) and \"Set
    username & password\" (calls create-admin-user, immediate account
    creation, no email needed)

-   Neither mode assigns an RBAC role automatically --- that's a manual
    follow-up step on the Users tab, called out in both success messages

8\. Cross-Cutting Behaviors

-   Every list page follows the same interaction shape: fetch on mount →
    render collapsed rows → expand-on-click reveals detail + a
    lazily-loaded notes thread. This pattern repeats across Leads, Guest
    Notes, and (structurally) the Roles accordion, and is worth
    preserving as a shared component rather than re-implementing five
    times in the rebuild.

-   Every write (status update, note add, note edit, role toggle)
    follows optimistic local state update after a successful Supabase
    call --- none of the five pages block the UI on a full re-fetch
    after a mutation, except where a re-sort is required (e.g. Log Visit
    on Leads, which does re-fetch so the row jumps to the top).

-   Permission checks are applied at three layers independently:
    route-level (PermissionRoute in App.jsx), nav-level (Layout's
    filtered ROLE_NAV), and in-page action-level (individual can()
    checks gating buttons/forms). All three need to be re-created in the
    rebuild, not just the route guard.
