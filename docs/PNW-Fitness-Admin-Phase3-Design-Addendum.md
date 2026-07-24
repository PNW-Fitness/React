**PNW Fitness Admin Dashboard**

**Phase 3 Design Addendum**

*Staff Scheduling · Shift Trades · Team Announcements*

Prepared for Xavier Backus, Customer Relations Manager

Pacific Northwest Fitness

July 2026

*Scoped-down, Homebase-inspired module: scheduling, shift trades, and
internal team announcements only. No time clock, no payroll processing,
no PTO tracking, no hiring tools.*

Table of Contents

1\. Purpose & Scope

Xavier asked for \"a carbon copy of Homebase,\" using the calendar
already bundled in the TailAdmin React template. Homebase's actual
product surface is much broader than what's needed here --- it includes
GPS/photo time clock punches, automated payroll and tax calculation, PTO
tracking, and hiring/onboarding tools. This addendum deliberately scopes
down to three pieces, confirmed with Xavier directly:

-   Shift scheduling with a calendar view

-   Shift trades / swap requests

-   Team announcements (internal staff-facing, not the public site's
    existing Announcements page)

Explicitly not built in this phase: time clock / clock-in-out, payroll
processing, PTO/time-off request tracking, and hiring tools. Wage and
tax calculation in particular is a licensed-payroll-provider problem,
not something to homebuild regardless of timeline --- flagged here so
the scope boundary is on record, not just a verbal note.

This is being built regardless of whether Daxko Club Automation's
built-in scheduling tools would have covered the need --- confirmed
directly with Xavier, superseding the earlier \"evaluate Daxko first\"
plan.

2\. Foundation: TailAdmin's Calendar

The template already ships pages/Calendar.tsx, built on FullCalendar
(@fullcalendar/react, \@fullcalendar/daygrid, \@fullcalendar/timegrid,
\@fullcalendar/interaction, \@fullcalendar/list --- all already in
package.json, no new dependency needed). Out of the box it supports
month/week/day/list views, click-and-drag date range selection, and a
color-coded event modal --- all backed by local component state with a
handful of hardcoded sample events.

The rebuild keeps this component as the visual and interaction
foundation, but replaces its local state with real shift data from
Supabase, and repurposes its event-category color coding
(Danger/Success/Primary/Warning) to represent shift status rather than
generic event types.

3\. Data Model

3.1 staff_shifts

One row per scheduled shift.

  -----------------------------------------------------------------------
  **Column**         **Notes**
  ------------------ ----------------------------------------------------
  id                 UUID primary key

  assigned_to        FK → auth.users; nullable --- an open shift has no
                     assignee yet

  role_label         Free-text or a small fixed set (Trainer, Front Desk,
                     Manager-on-duty) --- what the shift is for,
                     independent of who's assigned

  shift_date,        When the shift runs
  start_time,        
  end_time           

  status             scheduled / open / trade_pending / completed /
                     no_show

  notes              Optional free text

  created_by,        Audit fields, same pattern as lead_notes.author_name
  created_at         
  -----------------------------------------------------------------------

3.2 shift_trade_requests

Covers both flows Homebase supports: dropping a shift back to \"open\"
for anyone to claim, and offering it directly to a specific coworker.

  -----------------------------------------------------------------------
  **Column**         **Notes**
  ------------------ ----------------------------------------------------
  id                 UUID primary key

  shift_id           FK → staff_shifts.id

  requested_by       Who wants to give up the shift

  requested_to       Nullable --- a specific coworker if this is a direct
                     trade offer; null means \"drop to open, anyone can
                     claim\"

  reason             Optional free text

  status             pending / approved / denied / claimed / cancelled

  decided_by,        Manager/Super Admin who actioned it
  decided_at         

  created_at         Timestamp
  -----------------------------------------------------------------------

3.3 team_announcements

  -----------------------------------------------------------------------
  **Column**         **Notes**
  ------------------ ----------------------------------------------------
  id                 UUID primary key

  title, body        The announcement content

  posted_by,         Author, denormalized name
  posted_by_name     

  pinned             Boolean --- pinned posts sort above the normal
                     newest-first feed

  created_at         Timestamp
  -----------------------------------------------------------------------

**⚠ Open question:** This is a bulletin-board/feed model (post →
everyone reads), not a 1:1 direct-messaging system. Homebase's \"team
messaging\" also includes private chats and read receipts, which is a
substantially larger build (presence, unread state, per-message delivery
tracking). Recommend starting with the bulletin board and treating true
DM chat as a later, separate phase if it turns out to still be needed
--- flagging so this scope-down is a visible decision, not an assumption
buried in the Build Guide.

4\. RBAC

  ----------------------------------------------------------------------------
  **Key**               **Gates**                          **Granted to**
  --------------------- ---------------------------------- -------------------
  pages.schedule        View the Schedule (calendar) page  Every role

  schedule.manage       Create / edit / delete shifts,     Manager, Super
                        assign staff to a shift            Admin

  shift_trade.request   Request a trade or drop a shift    Every role with
                        assigned to oneself                pages.schedule

  shift_trade.manage    Approve / deny a trade request     Manager, Super
                                                           Admin

  pages.team_board      View team announcements            Every role

  team_board.post       Post a new announcement            Manager, Super
                                                           Admin
  ----------------------------------------------------------------------------

**⚠ Open question:** Whether staff below Manager should be able to post
announcements themselves (Homebase allows any employee to post to the
newsfeed) or whether this stays management-only, matching the existing
public-site Announcements page's pattern. Defaulted to management-only
here since it's the safer starting point --- easy to loosen later,
harder to walk back once staff are used to posting freely.

5\. Page Specifications

5.1 Schedule (/schedule)

-   Calendar view (FullCalendar month/week/day) showing all shifts,
    color-coded by status: scheduled = primary, open = warning,
    trade_pending = danger, completed = success.

-   Clicking an empty date range (Manager/Super Admin only) opens the
    add-shift modal: role label, assigned staff (optional --- leave
    blank for an open shift), date/time range, notes.

-   Clicking an existing shift opens a detail modal. Manager/Super Admin
    see edit/delete/reassign controls. The assigned staff member sees
    their own shift details plus a \"Request Trade\" action. Everyone
    else sees a read-only view (useful for staff checking who else is on
    shift).

-   A staff member only sees \"Request Trade\" on shifts assigned to
    them --- not on shifts belonging to other people.

5.2 Requesting and approving a trade

-   \"Request Trade\" opens a small form: drop to open (anyone can
    claim) or offer to a specific coworker, plus an optional reason.
    Submitting creates a shift_trade_requests row (status=\'pending\')
    and sets the shift's status to trade_pending so it renders
    highlighted on the calendar.

-   Manager/Super Admin see pending trade requests (a small list or
    badge count on the Schedule page) and can approve or deny. Approving
    a \"drop to open\" request clears assigned_to on the shift and sets
    its status to open; approving a direct-offer request reassigns the
    shift to the target coworker.

-   If a shift was dropped to open, any staff member with a matching
    role_label can claim it directly from the calendar (a \"Claim
    Shift\" button on open shifts) --- this assigns them without
    requiring a separate manager approval step, since the manager
    already approved the drop.

5.3 Team Board (/team-board)

-   New sidebar page, simple reverse-chronological feed of
    team_announcements, pinned posts sorted to the top.

-   Manager/Super Admin see a \"New Announcement\" button (title +
    body); everyone else sees a read-only feed.
