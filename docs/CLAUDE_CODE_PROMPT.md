# Task: Rebuild the PNW Fitness Admin Dashboard on TailAdmin React

You are working in the `PNWFitness Web Pages/React/` directory, which contains several
sibling apps sharing one Supabase backend. Your job is to build a new admin dashboard,
`pnw-fitness-admin-v2`, that reproduces five pages from the existing `pnw-fitness-admin`
app on top of the TailAdmin React template, per the plan in the two reference documents
below. **Read both reference documents in full before writing any code.**

Do not start writing code until you have read Sections 0–3 of this prompt and both
reference documents. Then propose a short plan back to me and wait for my go-ahead
before starting Phase 0.

---

## 0. Reference documents (read these first, in this order)

1. `./docs/PNW-Fitness-Admin-Design-Document.md` — the functional/technical spec of the
   *current* dashboard: architecture, RBAC model, data model, edge functions, and a
   page-by-page functional spec for the five pages in scope. This is the source of truth
   for **what each page must do** — treat any behavior it describes as a requirement,
   not a suggestion.
2. `./docs/PNW-Fitness-Admin-TailAdmin-Build-Guide.md` — the phased build plan: which
   TailAdmin components map to which current-app elements, in what order to build the
   five pages, and the risks/watch-outs to keep in mind. This is the source of truth for
   **how to build it**.

Both were reverse-documented directly from the real `pnw-fitness-admin` codebase, so
treat them as accurate — but if anything in them appears to conflict with what you find
in the actual source files (Section 1 below), the actual source file wins. Flag the
discrepancy to me rather than silently picking one.

---

## 1. Where things are on disk

| What | Path |
|---|---|
| Current admin app (read-only — reference source, do not modify) | `./pnw-fitness-admin/` |
| TailAdmin React template (already extracted, this is your starting point) | `./pnw-fitness-admin-v2/` |
| Reference documents | `./docs/` |
| Shared Supabase env values | `./pnw-fitness-admin/.env` (copy values, don't move the file) |

Before doing anything else, confirm all four of these exist. If `pnw-fitness-admin-v2/`
doesn't look like a fresh TailAdmin React checkout (i.e. `package.json` name isn't
`tailadmin-react`), stop and tell me rather than guessing.

**Never modify anything inside `./pnw-fitness-admin/`.** It's the live production admin
app and also your primary reference for exact current behavior — read from it freely,
write to it never.

---

## 2. Scope — five pages, nothing else

Build only these five pages in `pnw-fitness-admin-v2`, plus the shared plumbing they all
depend on (Auth, Permissions, Layout/Sidebar, routing):

1. **Leads** (`/leads`)
2. **Guest Notes** (`/guest-notes`)
3. **Vendor Log** (`/vendor-log`)
4. **Activity Log** (`/activity`)
5. **Users & Roles** (`/users-roles`)

Do not port Staff, Pricing, Testimonials, FAQ, Holiday Hours, or Announcements — those
are explicitly out of scope. Leave TailAdmin's own sample pages (Calendar, Forms,
UI Elements, Charts, etc.) in place and unmodified unless removing one is required to
avoid a route collision.

---

## 3. Non-negotiable constraints

- **Do not touch the Supabase schema, migrations, or edge functions.** Everything you
  need already exists in the database. `pnw-fitness-admin-v2` is a new *client* only.
- **Copy the shared logic files verbatim, don't rewrite them:** `supabaseClient.js`,
  `AuthContext.jsx`, `PermissionsContext.jsx`, `sourceLabels.js` from
  `./pnw-fitness-admin/src/lib/`. They are framework-agnostic and are proven working
  code — reskin the UI around them, don't reimplement the logic inside them.
- **Preserve every permission gate**, not just route-level ones. The Design Document
  Section 8 calls out that permission checks exist at three independent layers (route,
  nav, and individual in-page actions/buttons) — all three must be re-created for every
  page, not just the route guard. Cross-check each page you build against the
  Design Document's functional spec for that page before considering it done.
- **Keep new logic files as `.jsx`/`.js`, not `.tsx`/`.ts`**, per the Build Guide's
  recommendation in Section 2 — only write new *UI* code in `.tsx` to match the
  template's existing style. Don't spend time converting proven logic to TypeScript.
- **`react-router` (v7, library mode), not `react-router-dom`.** Same component API as
  the current app's v6 usage (`BrowserRouter`, `Routes`, `Route`, `Navigate`, `NavLink`,
  `useNavigate`) — only the import path changes. Do not adopt React Router's "framework
  mode" (file-based routing, loaders) — stay in library mode throughout.
- **Tailwind v4 is CSS-first.** Any new reusable design tokens (e.g. PNW Fitness navy
  `#0E2340` / gold `#C9A84C`) belong in the `@theme` block in `src/index.css`, not a
  `tailwind.config.js` — the template doesn't use one.
- **Two permission gates in the current app are hard-coded to `role === 'admin'`**
  rather than the RBAC permission-key system: deleting a lead / toggling its test-entry
  flag, and deleting a vendor log row. Port them as-is (still checking `role === 'admin'`)
  unless I tell you otherwise — **do not silently invent new permission keys for these**.
  Flag it to me as a decision point instead.

---

## 4. Execution plan — work in phases, stop at each checkpoint

Follow the Build Guide's phase structure. At the end of **every** phase, stop, summarize
what you did, list anything you had to deviate from the plan on or weren't sure about,
and wait for my confirmation before starting the next phase. Don't batch multiple phases
into one uninterrupted run.

### Phase 0 — Environment setup
- Confirm `pnw-fitness-admin-v2` runs (`npm install && npm run dev`) showing TailAdmin's
  default sample dashboard, before any of your code enters the picture.
- Install `@supabase/supabase-js`.

**Checkpoint:** dev server running, default TailAdmin dashboard visible, no errors.

### Phase 1 — Port shared plumbing
- Copy the four logic files listed in Section 3 into `pnw-fitness-admin-v2/src/lib/`.
- Create `.env.local` with `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, copied from
  `./pnw-fitness-admin/.env`.
- Wrap `App` in `AuthProvider` → `PermissionsProvider` in `main.tsx`.
- Port `PermissionRoute`, `NoAccess`, and `DefaultRedirect` from
  `./pnw-fitness-admin/src/App.jsx` into the new `App.tsx`, updating only the
  `react-router-dom` → `react-router` import.
- Reskin the login page: take TailAdmin's `SignIn.tsx` / `SignInForm.tsx` layout, but
  wire in the real `supabase.auth.signInWithPassword()` logic from the current
  `LoginPage.jsx`.

**Checkpoint:** can log in with a real staff account across at least two different RBAC
roles (e.g. Super Admin and Trainer), no console errors from Supabase or context.

### Phase 2 — Sidebar & routing
- Replace `AppSidebar.tsx`'s sample nav items with the five real pages, filtered live
  against `usePermissions().can(permKey)` — same pattern as the current `Layout.jsx`'s
  `ROLE_NAV` array.
- Add the five real routes in `App.tsx`, each wrapped in `PermissionRoute` with the
  correct `requiredPerms`, nested inside TailAdmin's `AppLayout`.

**Checkpoint:** log in as a limited role (e.g. Trainer) and confirm the sidebar only
shows what that role is permitted to see, *and* that manually navigating to a
disallowed URL redirects away rather than rendering the page.

### Phase 3 — Rebuild each page, in this order
Build one page at a time, in this exact order (simplest → most complex, per the Build
Guide's rationale in Section 6):

1. **Activity Log** — straight table swap, no permission-gated actions.
2. **Vendor Log** — table + Realtime subscription (copy the `supabase.channel(...)`
   logic unchanged) + inline note editing + delete confirm.
3. **Guest Notes** — today's-check-ins list + debounced search + expandable notes
   thread.
4. **Users & Roles** — three tabs (Users / Roles & Permissions / Add User); copy all
   Supabase logic unchanged, reskin with TailAdmin's Table, Select, Badge, Modal,
   Checkbox/Switch, and InputField components as detailed in the Build Guide Section 6.4.
5. **Leads** — build last. Copy all filter/fetch/mutation logic from the current
   `LeadsPage.jsx` unchanged; consider splitting it into smaller components rather than
   porting it as one large file. Use the Build Guide Section 6.5 component mapping.

For each page: after building it, re-read that page's functional spec in the Design
Document (Section 7) and check every bullet against what you built before moving to the
next page. Report to me what you verified, not just that you finished coding it.

**Checkpoint after each of the five pages**, not just at the end of Phase 3.

### Phase 4 — RBAC testing
Work through the full checklist in the Build Guide Section 7 (Super Admin, Manager,
Trainer, Front Desk, and a no-pages-assigned account) against all five rebuilt pages.
Also re-verify the 30-minute inactivity auto-logout and the last-Super-Admin protections
(can't demote/deactivate the only remaining Super Admin) — call out explicitly that you
tested these two, since they have no visible markup of their own and are easy to forget.

**Checkpoint:** report pass/fail for every role × page combination, not just "tests passed."

### Phase 5 — Do not deploy
Stop after Phase 4. Deployment and cutover (Build Guide Section 8) involve a new Vercel
project and a DNS/URL change — I'll handle that step myself once I've reviewed your work.

---

## 5. Definition of done (for Phase 4)

- [ ] All five pages present, permission-gated at route, nav, and action level
- [ ] Every behavior in Design Document Section 7 verified page-by-page
- [ ] RBAC checklist (Build Guide Section 7) passes for all roles
- [ ] Inactivity auto-logout confirmed working
- [ ] Last-Super-Admin protection confirmed working
- [ ] No changes made to `./pnw-fitness-admin/` or the Supabase schema
- [ ] Any deviations from the two reference documents flagged to me with reasoning, not
      silently decided

---

## 6. If something doesn't add up

If the current source code, the Design Document, and the Build Guide ever disagree, or
if you hit a TailAdmin component that doesn't have a clean equivalent for something the
current app does, stop and ask rather than improvising a workaround — especially around
permission logic, the two `role === 'admin'` gates called out in Section 3, or the
Front Desk role's apparent lack of Guest Notes / Vendor Log access (flagged as an open
question in the Build Guide's risk table — don't "fix" it yourself, just flag it).
