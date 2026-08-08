# UX Simplification Audit — role-by-role (17 Jul 2026)

Objective findings from a hands-on walkthrough of every role in the running
product (mock mode), judged against one benchmark: **is anything more
complicated than it needs to be, and does each surface tell the user one clear
truth?** Findings are logged with evidence so they can be verified, disputed,
or fixed — not vibes.

Severity: **HIGH** = actively confuses the user or contradicts another surface.
**MED** = adds friction or noise but the user recovers. **LOW** = polish.

---

## Customer journey (primary persona: James Chen, customer_admin)

### C1 · HIGH — The same work is counted three different ways · ✅ RESOLVED

The customer sees three different numbers for the same reality:

| Surface | Claim |
|---|---|
| Home hero | "2 things need your attention today" |
| Home CTA card + Assets page | "8 assets still required" |
| Deadlines page hero | "**12 overdue items** need attention now" |

The 12 = 10 individual asset deadlines + the "Upload brand assets" task
(which is the *umbrella* for those same 10 assets) + the briefing form. The
umbrella task and its 10 children are double-counted, and no surface explains
the relationship. A customer cannot answer "how much work do I actually have?"

**Fix direction:** pick one canonical unit (the task). Deadlines should group
asset rows under their parent task (one row: "Upload brand assets · 10 files ·
overdue") and the hero count should match the home count. Same number
everywhere, every time.

**Resolution:** `getCustomerActionItems` / `getDeadlinesByEvent` now fold
individual asset slots under their open umbrella task (`groupCustomerActionAssets`
/ `groupDeadlineAssets` in `src/lib/queries/deadlines.ts`, unit-tested). Home
"Needs you", the event overview, and the tasks hero all read the same grouped
list, so the count matches everywhere. A latent query bug that AND'd
`.in(status).or(review_status)` — silently hiding every required asset from the
count — was fixed to a single OR, so "Needs you" now equals the hero's "N assets
still required".

### C2 · HIGH — 14 navigation sections, at least 4 of them premature or overlapping · ✅ RESOLVED

Customer event nav: Overview, Briefing, Assets, Configuration, Approvals,
Studio, Tasks, Deadlines, Timeline, Logistics, Messages, Live, Leads, Reports.

- **Tasks vs Deadlines vs Timeline** are three time-flavoured views of
  overlapping data. Deadlines is Tasks sorted by date; Timeline is the stage
  history. A customer 28 days out has no reason to distinguish them.
- **Live, Leads, Reports** are all visible pre-event and all empty
  ("0 contacts captured", dashboard "will activate on event day"). Three nav
  items that do nothing for weeks.

**Fix direction:** fold Deadlines into Tasks (a "by due date" sort, not a
page); progressively disclose Live/Leads/Reports (locked state or hidden until
the relevant stage, with a "what unlocks when" hint). Target: ~8 sections
pre-event. Note: nav gating already exists per role in `event-access.ts` —
this extends it per *stage*.

**Resolution:** the customer event nav (`EventTabNav` → `CustomerPhaseNav`) is
now a two-line, never-scroll phase bar — four phases always visible, the current
phase's sections expanded inline, others collapsed to a label + count. Sections
in future phases render in a quiet stage-aware "upcoming" state (`currentStage`
passed through), so Live/Leads/Reports are discoverable at all times without
noise. Deadlines is folded into Tasks for customers (removed from
`CUSTOMER_SECTIONS`).

### C3 · MED — Stage-label grammar breaks in three templates · ✅ RESOLVED

Customer stage labels are sentence-shaped ("You're booked in") but get
composed into templates, producing:

- Home: "Currently at You're booked in. Event in 27d · 14h."
- Timeline subtitle: "Currently in You're booked in."
- Event hero (stage 1): same pattern.

Sources: `src/components/home/CustomerDashboard.tsx:121`,
`src/app/events/[id]/timeline/page.tsx:77`, `src/app/events/[id]/page.tsx:87-95`,
labels in `src/lib/customer-copy.ts`.

**Fix direction:** either noun-shaped customer stage labels ("Booked",
"Creative", "Live") or templates that don't prepend "Currently at".

**Resolution:** the home, event hero, and timeline no longer prepend "Currently
at/in" for customers — the stage label is used as its own sentence ("Creative in
progress. Event in 26d · 12h."). Internal surfaces keep the fuller framing.

### C4 · MED — The 10-stage internal pipeline leaks into customer framing · ✅ RESOLVED

"Stage 1/10" KPI reads like the project has barely started the moment they've
signed. The Progress card on the same page already shows the friendly
three-step view ("You're booked in → Getting started → Creative in progress")
— two representations of the same lifecycle, one of them internal-shaped.

**Fix direction:** customer sees phases, not the internal 10-stage count.
Keep 1/10 internal-only.

**Resolution:** customer KPIs now read "Phase 1 of 4" (via `phaseForStage` in
`src/lib/journey.ts`) instead of "Stage 1/10". Internal surfaces keep the
10-stage count.

### C5 · LOW — Date-format inconsistency on one screen · ✅ RESOLVED

Home CTA card: "Due 2026-06-28" (ISO) sits 40px above "28 Jun" (friendly) in
the same card stack. One format for customer surfaces.

**Resolution:** the home next-step hint now formats via `formatDateShort`
("Due 24 Jul"). No raw ISO dates on customer surfaces.

### C6 · LOW — Alarm fatigue by design · ✅ RESOLVED

Twelve red "OVERDUE" badges + a red banner + red dates, 28 days before the
event. Objectively true per the data, but the wall of red makes triage
impossible — when everything screams, nothing does. Grouping (C1) fixes most
of it; the rest is tone (one summary banner, calmer row states).

**Resolution:** grouping (C1) collapses the asset rows into one umbrella, and
the demo dataset is now date-relative (Workstream H) so deadlines sit in the
future — the wall of red is gone. At most a couple of items are ever a few days
overdue for realism.

### What is genuinely good (don't touch)

- Home = one hero CTA ("8 assets still required → Upload assets"), then
  supporting detail. This is the right shape.
- The Assets page is world-class: per-asset specs, safe zones, checklists,
  inline comments, brand-kit form instead of "email us a PDF".
- Messages, Approvals, and the post-event Live/Reports surfaces are clean.

---

## Internal journey (Tim Pedro, events_lead)

### I1 · MED — 19 flat event-section pills · ✅ RESOLVED

Overview, Briefing, Assets, Approvals, Tasks, Deadlines, Messages, Live,
Leads, Reports, Timeline, Studio, Logistics, Compliance, Configuration,
Machine, QA, Campaign, Activity. Power users adapt, but the flat pill row
wraps and hides items behind horizontal scroll on smaller screens.

**Fix direction:** group into 3–4 labelled clusters (Deliver / Data / Ops /
Record) or move the long tail behind a "More" overflow. Lower priority than
customer fixes.

**Resolution:** internal event sections are grouped into labelled clusters
(`INTERNAL_NAV_CLUSTERS` / `internalNavGroups` in `event-access.ts`) that wrap
rather than scroll, and the stale `SECTION_TO_SLUG` map was completed so every
section resolves.

### I2 · MED — "My work" lives in three places · ✅ RESOLVED

Cross-event Inbox, per-event Tasks ("My tasks / All tasks"), and home
"What needs you now". They are consistent in data but not in naming or
framing. A new internal hire needs the mental model explained.

**Fix direction:** naming pass ("Inbox" everywhere, or "Your work"
everywhere), and a one-line description on each surface saying how it relates
to the others.

**Resolution:** each surface now carries a one-line description of its scope and
relationship — the cross-event Inbox, the per-event Tasks page, and the home
focus list ("What needs you now" → "Open your inbox") are consistently framed.

### Good

Home focus list, command palette + G-shortcuts, optimistic task flow with
Undo, the pipeline/queue pages.

---

## Partner journey (Maya Patel, partner_admin)

Clean. Five tabs (Dashboard, Clients, Quotes, Commissions, Resources), honest
KPIs, a real "Needs your attention" list, book of business with commission
status. No overcomplication found worth logging beyond:

### P1 · LOW — "Needs your attention" mixes action and FYI · ✅ RESOLVED

"Follow up with Nike UK" (action) sits beside "commission approved" (news).
Cosmetic; consider splitting action vs update.

**Resolution:** `PartnerActionQueue` splits open quotes ("Needs your attention")
from approved-commission news ("Just so you know"), and the header count reflects
only actionable items.

---

## Venue journey (Aaron Howe, venue role)

Also clean (Dashboard, Placements, Sponsorships, Packages, Embed). Two items:

### V1 · MED — Role badge says "PARTNER ADMIN" for a venue user · ✅ RESOLVED

Top-right identity chip shows the internal role slug ("Partner admin") for a
venue persona. In a demo this reads as a bug. Label should be venue-shaped
("Venue admin" / "ExCeL London").

**Resolution:** `UserMenu` accepts a `roleLabel` override; venue pages pass
`venueRoleLabel(user.role)` so the identity chip reads "Venue admin" / "Venue".

### V2 · LOW — "Awaiting you: 7" inflates opportunities into obligations · ✅ RESOLVED

All 7 rows are "Open sponsorship slot — invite a sponsor": that's inventory
to sell, not items awaiting the user. Group into one card ("7 open slots ·
£87,000 — invite sponsors") and keep "Awaiting you" for true obligations.

**Resolution:** `VenueActionQueue` groups identical open-slot rows into one
summary card ("7 open sponsorship slots · £87,000 — invite sponsors"); genuine
obligations stay as individual rows.

### V3 · LOW — Eyebrow shows the venue's own full postal address · ✅ RESOLVED

"One Western Gateway, Royal Victoria Dock…" as the page eyebrow tells the
venue user something they know. Use the venue name; keep the address in
settings.

**Resolution:** venue page eyebrows now show the venue name (e.g. "EXCEL
LONDON"); the postal address stays in settings/details.

---

## Priority order (if fixing before/after today's demo)

1. **C3** stage grammar (minutes, demo-visible on the first screen)
2. **V1** venue role badge (minutes, demo-visible)
3. **C1** one number for customer workload (the deepest trust issue)
4. **C5** date format (minutes)
5. **C2** customer nav diet / progressive disclosure (biggest simplification)
6. **C4** hide 1/10 from customers
7. **V2, C6, I1, I2, P1** as polish passes

## Status — ✅ ALL RESOLVED (Unified Journey Redesign)

All 12 findings (C1–C6, I1–I2, P1, V1–V3) were closed by the Unified Journey
Redesign, which also introduced a shared journey spine (`src/lib/journey.ts` +
`EventJourney`) across every role and made the demo dataset date-relative so it
never goes stale (Workstream H). See the CHANGELOG entry of the same name.

*Logged by the July 2026 audit pass. Update statuses inline as items land.*

---

## Standing rule: quarterly subtraction review

Every quarter, walk the quiz, intake, pricing surfaces, and portal nav with one
explicit agenda item on the sheet: **"what did we remove?"** The Nature
subtraction research is unambiguous — people default to adding and only
consider removal when the cue is explicit, so if the question isn't written
down it will not be asked. The first thing to look for is empty-data furniture:
export buttons sitting above empty tables, columns that render nothing but
dashes, CTAs that lead nowhere for the viewer's role or stage. The rule those
findings are judged against: if it can't do anything, it shouldn't render.
