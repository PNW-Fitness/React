**Rebuilding the PNW Fitness Admin Dashboard**

**on TailAdmin React**

**Step-by-Step Build Guide**

*Companion document to the Design & Functional Specification*

Prepared for Xavier Backus, Customer Relations Manager

Pacific Northwest Fitness

July 2026

*Target template: TailAdmin/free-react-tailwind-admin-dashboard (React +
TypeScript + Tailwind v4)*

Table of Contents

1\. Goals & Approach

This guide walks through rebuilding the five pages you're keeping ---
Leads, Guest Notes, Vendor Log, Activity Log, and Users & Roles --- on
top of TailAdmin's free React template, while carrying over all existing
Supabase logic (Auth, RBAC, data access) unchanged. It assumes the
Design & Functional Specification document as the source of truth for
what each page needs to do.

Core principle for the whole rebuild: change the shell, not the engine.
Everything that talks to Supabase (AuthContext, PermissionsContext,
supabaseClient, all the query/mutation logic inside each page) is
framework-agnostic JavaScript and does not need to be rewritten --- only
re-skinned with TailAdmin's components and, optionally, ported to
TypeScript.

This is written as sequential phases with explicit stopping points. Each
phase ends with a \"checkpoint\" --- treat these as the moments to
pressure-test what's been built before moving on, consistent with how
you like to work through architectural decisions.

2\. Tech Stack Delta

What actually changes between your current app and the TailAdmin React
template. None of these are deal-breakers, but each has a small
adjustment worth knowing about up front.

  ---------------------------------------------------------------------------
  **Layer**    **Current app**      **TailAdmin React**  **Impact**
  ------------ -------------------- -------------------- --------------------
  React        18.3.1               19.0.0               Low. No use of
                                                         legacy APIs removed
                                                         in 19 (no
                                                         findDOMNode, no
                                                         string refs)
                                                         anywhere in the five
                                                         target pages.

  Routing      react-router-dom     react-router 7.1     Very low. Same
               6.27                 (library mode)       component API
                                                         (BrowserRouter,
                                                         Routes, Route,
                                                         Navigate, NavLink,
                                                         useNavigate). Only
                                                         the import path
                                                         changes:
                                                         react-router-dom →
                                                         react-router.

  Styling      Tailwind CSS 3.4, JS Tailwind CSS 4.x,    Low, since your app
               config, no theme     CSS-first \@theme    never customized
               customization        config in            tailwind.config.js
                                    src/index.css        beyond defaults.
                                                         Utility class names
                                                         you already use
                                                         (bg-blue-700,
                                                         rounded-lg, etc.)
                                                         work unchanged in
                                                         v4.

  Language     Plain JSX (.jsx)     TypeScript (.tsx)    Medium. You can keep
                                                         ported files as .jsx
                                                         --- Vite happily
                                                         mixes .jsx and .tsx
                                                         in one project ---
                                                         or type them as you
                                                         go. Recommendation
                                                         below in Section 4.

  Build tool   Vite 5               Vite 6 (via          None. Same tool,
                                    TailAdmin's config)  same mental model.
  ---------------------------------------------------------------------------

Recommendation on TypeScript: don't convert your existing logic files
(AuthContext, PermissionsContext, supabaseClient, sourceLabels) to
TypeScript. Copy them in as .jsx/.js verbatim --- they'll compile and
run fine sitting next to TailAdmin's .tsx files. Only write new UI code
in .tsx to match the template's existing pages, so it stays consistent
with itself.

3\. Phase 0 --- Environment Setup

Goal: a running TailAdmin React app on your machine, talking to nothing
yet.

1.  Clone the template into a new sibling folder next to your existing
    apps:

cd \"PNWFitness Web Pages/React/\"

git clone
https://github.com/TailAdmin/free-react-tailwind-admin-dashboard.git
pnw-fitness-admin-v2

2.  Install dependencies:

cd pnw-fitness-admin-v2 && npm install

3.  Install the one extra package your current app needs that TailAdmin
    doesn't ship: Supabase.

npm install \@supabase/supabase-js

4.  Run the dev server and confirm the default TailAdmin dashboard loads
    at localhost:5173 before changing anything:

npm run dev

**✓ Checkpoint:** You should see TailAdmin's default analytics dashboard
with its own sidebar and sample charts. Don't proceed to Phase 1 until
this loads cleanly --- it confirms Node/npm/Vite are all compatible
before Supabase or any of your code enters the picture.

4\. Phase 1 --- Port Shared Plumbing

Goal: Auth, permissions, and Supabase connectivity working inside the
new shell, with TailAdmin's own sample pages still intact (don't delete
anything yet --- you'll swap routes over page by page in Phase 3).

4.1 Copy the logic files as-is

Copy these four files from your current src/lib/ directly into the new
project's src/lib/ (create the folder). No changes needed --- they're
plain JS/JSX with no framework-specific imports beyond React and
Supabase.

-   supabaseClient.js

-   AuthContext.jsx

-   PermissionsContext.jsx

-   sourceLabels.js

Set up the same two environment variables in a new .env.local at the
project root:

VITE_SUPABASE_URL=\...

VITE_SUPABASE_ANON_KEY=\...

Use the same values from your current pnw-fitness-admin/.env --- it's
the same Supabase project, so no new backend setup is required.

4.2 Wire the providers into main.tsx

TailAdmin's main.tsx already wraps the app in ThemeProvider and
AppWrapper. Add your AuthProvider and PermissionsProvider around App, in
that order (Permissions depends on Auth):

\<ThemeProvider\>

\<AuthProvider\>

\<PermissionsProvider\>

\<AppWrapper\>

\<App /\>

\</AppWrapper\>

\</PermissionsProvider\>

\</AuthProvider\>

\</ThemeProvider\>

4.3 Rebuild the route guards

TailAdmin's App.tsx uses react-router (not react-router-dom) but the
same component names. Port the PermissionRoute, NoAccess, and
DefaultRedirect components from your current App.jsx almost verbatim ---
only the import line changes:

// Old: import { BrowserRouter, Routes, Route, Navigate } from
\'react-router-dom\'

// New: import { BrowserRouter, Routes, Route, Navigate } from
\'react-router\'

Keep the same requiredPerms pattern per route. You'll add the five real
routes in Phase 3 as each page is rebuilt; for now, stub them or leave
TailAdmin's sample routes in place so the app keeps building.

4.4 Swap the login page

Don't try to reuse TailAdmin's SignIn.tsx logic --- it has no Supabase
awareness. Instead, take its visual layout (the split-screen card + form
styling in pages/AuthPages/SignIn.tsx and
components/auth/SignInForm.tsx) and drop your current LoginPage.jsx's
supabase.auth.signInWithPassword() logic into it. This is the first real
\"reskin\" of the project --- useful as a small, low-risk first win
before tackling the five bigger pages.

**✓ Checkpoint:** You can log in with a real PNW Fitness staff account,
land on whatever TailAdmin sample page you left as the default route,
and the browser console shows no Supabase or context errors. Confirm
this works for at least two different roles (e.g. Super Admin and
Trainer) before moving on --- it proves the permission plumbing survived
the port.

5\. Phase 2 --- Sidebar & Routing

Goal: TailAdmin's sidebar shows your actual five pages, filtered by
permission, instead of its own sample nav.

5.  Open layout/AppSidebar.tsx. It holds a hard-coded nav item array
    very similar in shape to your current ROLE_NAV constant in
    Layout.jsx --- replace TailAdmin's sample entries (Dashboard,
    Calendar, Forms, Tables, etc.) with your five: Leads, Guest Notes,
    Vendor Log, Activity Log, Users & Roles.

6.  Filter that array against usePermissions().can(permKey) the same way
    your current Layout.jsx does, so the rendered list is
    permission-driven, not static.

7.  Reuse TailAdmin's icon set (src/icons/) for each nav item --- it
    ships with a broad set of outline icons that's a strict upgrade over
    your current text-only sidebar links.

8.  In App.tsx, replace the route list with your five real routes, each
    wrapped in PermissionRoute exactly as in your current App.jsx,
    nested inside TailAdmin's AppLayout element wrapper (this is what
    gives every page the sidebar + header chrome automatically).

**✓ Checkpoint:** Log in as a role with limited access (e.g. Trainer)
and confirm the sidebar only shows Leads --- not Vendor Log or Users &
Roles --- and that manually typing /vendor-log in the URL bar redirects
away rather than rendering the page. This is the same three-layer check
called out in Section 8 of the Design Document; verify all three layers
here, not just the sidebar.

6\. Phase 3 --- Rebuild Each Page

Suggested build order: simplest to most complex, so early wins build
momentum and the hardest page (Leads) benefits from patterns already
proven on the other four.

6.1 Activity Log (start here)

The smallest page in scope --- a good first exercise in the copy-logic /
reskin-markup pattern you'll repeat four more times.

-   Copy the data-fetching logic from ActivityLogPage.jsx (the
    sign_in_log select) unchanged.

-   Replace the hand-rolled \<table\> markup with TailAdmin's Table,
    TableHeader, TableBody, TableRow, TableCell components from
    components/ui/table/index.tsx --- same component TailAdmin uses in
    pages/Tables/BasicTables.tsx, which is worth opening as a live
    reference.

-   No forms, no modals, no permission-gated actions on this page ---
    it's a straight swap.

6.2 Vendor Log

-   Copy the fetch/date-filter/Realtime-subscription logic from
    VendorLogPage.jsx unchanged --- the
    supabase.channel(\...).on(\'postgres_changes\', \...) subscription
    is plain Supabase JS and has no framework dependency.

-   Table → TailAdmin's Table components, same as Activity Log.

-   Date picker → swap the native \<input type=\"date\"\> for
    TailAdmin's components/form/date-picker.tsx (built on flatpickr,
    already a dependency) for a more polished look, or keep the native
    input if you'd rather not take on the extra component right away ---
    either works with the same state logic.

-   Inline note editing → TailAdmin's components/form/input/TextArea.tsx
    in place of the raw \<textarea\>.

-   Delete confirm step → this is a good candidate for TailAdmin's Modal
    component (components/ui/modal/index.tsx) instead of the current
    inline \"Yes / No\" text, though a straight port of the existing
    inline pattern is also fine if you want to save time here.

6.3 Guest Notes

-   Copy the \"today's check-ins\" query, debounced search, and
    notes-thread logic from GuestNotesPage.jsx unchanged.

-   Guest cards → TailAdmin doesn't have an exact \"expandable list
    card\" component out of the box; the closest starting points are
    components/common/ComponentCard.tsx (card shell) combined with a
    simple expand/collapse you keep from the current implementation.
    This page is more about restyling than about finding a 1:1 component
    match.

-   Avatar circle (guest initial) → TailAdmin's
    components/ui/avatar/Avatar.tsx.

-   Note author/timestamp/text → plain styled text, no component needed
    beyond what's already there.

6.4 Users & Roles

-   Copy all three tabs' Supabase logic from UsersRolesPage.jsx
    unchanged --- this is the most logic-dense of the five pages but
    almost none of that logic is UI-specific.

-   Tab switcher → keep the current pattern (it's simple and works) or,
    if you want it to visually match TailAdmin's style more closely,
    model it on how tabs are handled in pages/Charts or
    pages/UiElements, which use a similar segmented-button pattern.

-   Users table → TailAdmin Table components; role \<select\> →
    components/form/Select.tsx.

-   Active/Inactive badge → components/ui/badge/Badge.tsx
    (color=\"success\" / color=\"light\" map directly onto your current
    green/gray badge states).

-   \"Set password\" modal → direct fit for
    components/ui/modal/index.tsx (isOpen, onClose, children props ---
    replace the current fixed-position div you're hand-rolling).

-   Permission checkboxes in the Roles tab →
    components/form/input/Checkbox.tsx, or
    components/form/switch/Switch.tsx if you'd prefer toggle switches
    over checkboxes for that screen --- either reads clearly for a
    permission matrix.

-   Invite-link / create-account forms in the Add User tab →
    components/form/input/InputField.tsx and components/form/Label.tsx
    for consistent field styling; the segmented mode-toggle button can
    reuse the same pattern as the Users & Roles tab switcher above.

6.5 Leads (build last)

The largest page by far --- tackle it last, once the component-swap
patterns above are proven, and consider breaking it into smaller
sub-components as you go rather than porting it as one 1,186-line file
(it wasn't broken up in the original either, but TailAdmin's codebase is
organized more granularly and it's a natural opportunity to split things
out).

-   Copy all data-fetching, filter-state, and mutation logic from
    LeadsPage.jsx unchanged --- this is the bulk of the file and none of
    it needs to change.

-   Search + filter row → InputField.tsx for search, Select.tsx for the
    source/status/visit-reason/trainer dropdowns, date-picker.tsx for
    the From/To range.

-   Source and status pills → Badge.tsx. Your current SOURCE_COLORS and
    statusCls color maps translate directly onto Badge's color prop
    (primary/success/error/warning/info/light/dark) --- map each
    existing Tailwind color pairing to the closest Badge color.

-   Priority left-border --- no direct TailAdmin equivalent; keep this
    as a raw inline style exactly as it is now, applied to whatever
    row/card wrapper you build.

-   Expandable row → same ComponentCard + custom expand/collapse pattern
    as Guest Notes.

-   Inline edit form and \"Add Lead\" form → InputField.tsx, Select.tsx,
    and Label.tsx throughout, replacing the current hand-styled
    \<input\>/\<select\> elements one field at a time.

-   Notes thread + add-note textarea → same TextArea.tsx pattern as
    Vendor Log.

-   Delete confirm → Modal.tsx, consistent with the choice made for
    Vendor Log.

-   Pagination controls → Button.tsx (components/ui/button/Button.tsx)
    for Previous/Next; no dedicated pagination component ships with the
    free template, so the current page-number logic carries over as-is.

**✓ Checkpoint:** Before considering Leads done, re-test every bullet in
Section 7.1 of the Design Document against the rebuilt page --- it's the
page with the most edge-case behavior (trainer auto-filtering, priority
coloring, per-source detail fields) and the easiest one to silently drop
something from during a reskin.

7\. Phase 4 --- RBAC Testing Checklist

Test each of the five pages against each role that has any access to it.
Use the role/permission table in Section 4.1--4.2 of the Design Document
as your source of truth for what should and shouldn't be visible.

☐ Super Admin --- sees and can act on all five pages, including Users &
Roles

☐ Manager --- sees all five operational pages, cannot edit
roles/permissions or manage users

☐ Trainer --- sees only Leads, auto-filtered to their own assigned
leads; cannot see Guest Notes, Vendor Log, Activity Log, or Users &
Roles in the sidebar or via direct URL

☐ Front Desk --- sees Leads (unfiltered) and, per current permission
grants, does not have pages.guest_notes or pages.vendor_log by default
--- confirm this matches what you actually want before shipping; it may
be worth revisiting these grants during the rebuild since Front Desk
seems like the natural owner of Guest Notes and Vendor Log

☐ A role with zero pages assigned --- confirm they land on a clear \"no
pages assigned\" message rather than a blank screen or an error

Also re-verify the inactivity auto-logout (30 minutes) and the
last-Super-Admin protections (can't demote or deactivate the only
remaining Super Admin) --- both are easy to lose track of during a
UI-focused rebuild since neither has any visible markup of its own.

8\. Phase 5 --- Deployment & Cutover

9.  Set up a new Vercel project for pnw-fitness-admin-v2, pointed at the
    same Supabase project via the same environment variables. Do not
    touch the existing pnw-fitness-admin Vercel deployment yet.

10. Get a preview URL live and have at least one other staff member
    (ideally covering a different RBAC role than you) run through the
    Phase 4 checklist independently.

11. Once QA passes, this is a domain/DNS-level cutover, not a data
    migration --- there's no new backend to stand up, so the actual
    switchover can happen in minutes once you're confident: point
    whatever URL/subdomain staff currently use at the new deployment.

12. Keep the old pnw-fitness-admin deployment reachable at a fallback
    URL for a week or two after cutover, in case something surfaces that
    the QA pass missed.

9\. Suggested Timeline

  -----------------------------------------------------------------------
  **Window**        **Work**
  ----------------- -----------------------------------------------------
  Days 1--2         Phase 0 (setup) + Phase 1 (shared plumbing + login
                    page)

  Days 3--4         Phase 2 (sidebar + routing) + Activity Log + Vendor
                    Log

  Days 5--7         Guest Notes + Users & Roles

  Days 8--11        Leads (the biggest single page)

  Days 12--14       Phase 4 (RBAC testing) + Phase 5 (deployment/cutover)
  -----------------------------------------------------------------------

This assumes solo, part-time build time around your other Customer
Relations Manager responsibilities --- treat it as a rough shape rather
than a commitment. Front-loading the checkpoints in Phases 0--2 is worth
the time even though they don't produce visible pages yet, since a
plumbing mistake caught there is cheap; the same mistake caught after
all five pages are built is expensive to unwind.

10\. Risks & Watch-Outs

  -----------------------------------------------------------------------
  **Risk**                          **Mitigation**
  --------------------------------- -------------------------------------
  Losing a permission check during  Work from the permission-key tables
  reskin --- easiest to drop the    in Design Doc Sections 4.2 and 7 as a
  small can(\'x\') guards on        checklist per page, not from visual
  individual buttons since they're  memory of the current UI.
  not visually obvious in the       
  current code the way a route      
  guard is.                         

  Tailwind v4's CSS-first config    Since the current app has no custom
  means any future custom           theme, this only matters if new brand
  color/spacing token has to go in  tokens (navy #0E2340 / gold #C9A84C)
  the \@theme block in index.css,   get added as reusable Tailwind
  not a tailwind.config.js --- easy classes rather than inline hex ---
  to instinctively reach for the    worth doing once, early, in Phase 1.
  old pattern.                      

  react-router 7 is used here in    Stay in library mode
  \"library mode,\" matching your   (BrowserRouter/Routes/Route as shown
  current usage --- but the same    in Section 4.3) --- there is no
  package also supports a very      reason to adopt framework mode for
  different \"framework mode\"      this rebuild.
  (file-based routing, loaders)     
  that a tutorial or AI suggestion  
  online might steer you toward by  
  mistake.                          

  Two now-formalized-nowhere-else   Worth a deliberate decision during
  permission gates (lead delete,    the rebuild: either keep the role ===
  test-entry toggle, vendor delete) \'admin\' check as-is, or formalize
  are still hard-coded to role ===  it into real permission keys (e.g.
  \'admin\' rather than the RBAC    leads.delete, vendor_log.delete)
  permission system --- easy to     consistent with everything else.
  port literally without            Either is defensible; just make it a
  questioning whether that's still  conscious choice, not a copy-paste
  the right rule.                   accident.

  Front Desk role currently lacks   Confirm with whoever owns role
  pages.guest_notes and             definitions (likely you, per your
  pages.vendor_log --- noted in     business-strategy lane) before the
  Phase 4 --- which may be a gap    rebuild ships, since it's much easier
  rather than an intentional        to fix a permission grant now than
  design.                           after staff have gotten used to a
                                    workaround.
  -----------------------------------------------------------------------
