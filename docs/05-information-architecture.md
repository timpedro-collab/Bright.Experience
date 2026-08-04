# Information Architecture

> **Version:** 0.2.0 · **Status:** current · **Last verified:** 2026-08-02.
> The URL tree below mirrors the real routes under `src/app/`. There is **no
> `/internal/*` namespace** — internal and customer users share the same
> `/events/[id]/*` workspace, and each section is filtered by role via
> [`src/lib/event-access.ts`](../src/lib/event-access.ts) (route segments =
> `SECTION_META[section].route`). Sections a role can't see are genuinely
> unreachable (server-guarded), not merely hidden from the menu.

## URL Structure

### Public (unauthenticated — `src/app/(public)/`)
```
/                                   → Marketing homepage
/catalog                            → Catalog hub
/catalog/machines[/:slug]           → Machines index + detail
/catalog/games[/:slug]              → Games index + detail
/catalog/packages[/:slug]           → Packages index + detail
/catalog/case-studies[/:slug]       → Case studies index + detail
/pricing                            → Audience-aware tier pricing (persona ?for= + region toggle)
/for-venues                         → Venue role landing page (hosting economics)
/for-organizers                     → Organizer role landing page (resale motion)
/business-case                      → Cost-per-lead calculator + CFO framing
/faq                                → Plain-language FAQ
/measured-sampling                  → Measured-sampling campaign landing page
/llm-info                           → Structured product facts for people + AI assistants
/llms.txt                           → Machine-readable product summary (route handler, text/markdown)
/how-it-works                       → Explainer
/quiz                               → Recommendation quiz (capability match)
/book                               → Book-now track entry
/book/configure                     → Configure selection
/book/checkout                      → Checkout
/book/confirmation/:id              → Post-book confirmation
/proposal                           → Proposal track entry (intake wizard)
/proposal/:id                       → Customer-facing narrative proposal (gated pricing)
/report/:token                      → Public proof-of-performance report (tokened)
/sponsor/:token                     → Sponsor pitch, then proof of performance (tokened, expiring)
/p/:code                            → Short-link resolver
/partners/join                      → Partner signup
/privacy  /terms                    → Legal
```

### Event workspace (authenticated — `src/app/events/[id]/`)
Shared by customers and internal roles; sections filtered per role.
```
/                                   → Home dashboard (my events)
/events/new                         → Create event (internal)
/events/:id                         → Overview
/events/:id/briefing                → Briefing
/events/:id/assets                  → Assets
/events/:id/approvals               → Approvals
/events/:id/actions                 → Tasks
/events/:id/deadlines               → Deadlines (internal only)
/events/:id/communications          → Messages
/events/:id/timeline                → Timeline
/events/:id/live                    → Live dashboard   (+ /live/print)
/events/:id/leads                   → Captured leads
/events/:id/reports                 → Reports          (+ /reports/print)
/events/:id/studio                  → Bright.Studio requests (customer_admin + creative)
/events/:id/logistics               → Logistics
/events/:id/configuration           → Game/product configuration
/events/:id/machine                 → Machine build (ops)
/events/:id/compliance              → Compliance (ops)
/events/:id/qa                      → QA / readiness
/events/:id/campaign                → Campaign
/events/:id/activity                → Activity log
```
Section→route mapping and per-role visibility: `SECTION_META` and
`ROLE_SECTIONS` / `CUSTOMER_SECTIONS` in `event-access.ts`. Export is not a
page — it is the `GET /api/events/:id/export` handler
([`docs/16`](16-api-and-actions-reference.md)); print views are dedicated
`/…/print` pages used by the PDF renderer.

### Admin (internal — `src/app/admin/`)
```
/admin/quotes[/:id]                 → Quote queue + detail (proposal prep)
/admin/customer-queue               → Incoming customer requests
/admin/asset-reviews                → Cross-event asset review queue
/admin/accounts[/:id]               → Account management
/admin/users   /admin/invites       → User + invite management
/admin/templates[/new|/:id/edit]    → Event templates
/admin/catalog[…]                   → Catalog admin (machines, games, packages, case-studies, machine-placements)
/admin/campaigns[/new|/:id]         → Campaigns
/admin/partners[/:id]               → Partner administration
/admin/organizers                   → Show organizers: list + create
/admin/organizers/:id               → Organizer setup console — invite their team,
                                      link shows, deploy/release machines
/admin/locations                    → Pricing tiers / locations
/admin/benchmarks                   → Report benchmarks
/admin/recommendations              → Recommendation tuning
/admin/invoices                     → Invoice mirror (display-only by design)
/admin/api                          → API key management
/admin/integrations/pipedrive       → Pipedrive configuration
```

### Partner portal (`src/app/partners/[slug]/`)
```
/partners/:slug/dashboard  /clients  /quotes  /commissions  /resources
```

### Venue portal (`src/app/venues/[slug]/`)
```
/venues/:slug/dashboard  /packages  /placements  /sponsorships
/venues/:slug/advertise             → Public advertise landing
/venues/:slug/embed                 → Embeddable iframe surface
```

### Organizer portal (`src/app/organizers/[slug]/`)
```
/organizers/:slug                   → Redirects to /shows
/organizers/:slug/shows             → Portfolio: totals + a card per show
/organizers/:slug/shows/:eventId    → Show Command: run-up (key dates + unit
                                      readiness) or live fleet by zone, plus
                                      sponsor inventory (#inventory anchor)
/organizers/:slug/shows/:eventId/machines/:machineId
                                    → One unit: readiness, expected performance,
                                      setup story, zone + mission editing,
                                      configuration (read-only), sponsor, and
                                      the machine's own specification
/organizers/:slug/shows/:eventId/machines/:machineId/spec
                                    → Printable venue spec sheet (no portal
                                      chrome; built to be forwarded)
/organizers/:slug/fleet             → Every unit across every show they run
/organizers/:slug/sponsors          → The sponsorship book: slots grouped by
                                      show, ordered by days to doors
/organizers/:slug/deals             → Deal registration board: claim a sponsor
                                      conversation; approval = 14-day exclusivity
/organizers/:slug/earnings          → Margin roll-up: earned vs pipeline across
                                      every sold slot (sponsor price − wholesale)
/organizers/:slug/shows/:eventId/slots/:slotId/prospectus
                                    → Printable prospectus block for one slot
/organizers/:slug/shows/:eventId/slots/:slotId/one-pager
                                    → Co-branded printable sales one-pager
```

Internal counterpart: `/admin/deals` is the review queue for registrations
(24 h SLA; approve starts the window, reject sends the typed reason to the
organizer's board verbatim).

Show pages switch between two modes on the show's dates: while a show is open
they poll for live telemetry; before it opens they show the run-up — the dated
spine of the show (install, doors, close, collection) and a readiness board
naming what each unit still needs — rather than describing a warehoused machine
as offline. Machine pages do the same at unit scale, replacing zeroed counters
with a readiness checklist, a benchmark-backed expectation, and the unit's
setup history.

Readiness is derived, never stored: `src/lib/metrics/unit-readiness.ts` decides
what "ready" means for one unit and `show-readiness.ts` feeds it the rows a page
already loaded, so the machine page, the show board and the portfolio card can
never disagree. Delivery tasks and milestones are deliberately *not* surfaced to
organizers — those belong to the brand whose activation it is, and RLS gives
organizers no access to them.

An organizer is created and wired up from `/admin/organizers/:id`: nothing in
this portal can be reached until an admin has invited at least one of their
people, linked a show, and deployed hardware to it. That console is the only
supported onboarding path — no step of it requires database access.

### Account & system
```
/login  /auth/*  /welcome           → Auth + onboarding
/settings                           → Profile + notification preferences
/notifications                      → Notification centre
/inbox  /pipeline  /ops  /studio    → Internal ops surfaces
/help                               → Help
```

---

## Navigation Model

Every role shares the same **journey spine** — four phases (Create → Prepare →
Event day → Results) derived from the ten internal stages
(`src/lib/journey.ts`). The event nav (`EventTabNav`) is stage-aware: it receives
`currentStage` and renders future-phase sections in a quiet "upcoming" state
rather than hiding them.

### Customer Navigation
Per-event nav is a **two-line, never-scroll phase bar** (`CustomerPhaseNav`):
the four phases are always visible; the current phase's sections expand inline
while other phases collapse to a label + count and expand on tap.

- **Create** — Briefing, Assets, Configuration, Approvals, Studio
- **Prepare** — Actions, Timeline
- **Event day** — Logistics, Communications, Live
- **Results** — Leads, Reports

Overview is the anchor tab, and Timeline (in the Prepare phase) is the full
journey detail. Deadlines is *not* a customer section — it is folded into Actions
as a "by due date" view; any `/deadlines` customer link redirects to
`/timeline`/`/actions`.

### Internal Navigation
Per-event sections are grouped into **labelled clusters** that wrap instead of
scroll (`INTERNAL_NAV_CLUSTERS` / `internalNavGroups` in `event-access.ts`):

- **Deliver** — Briefing, Assets, Approvals, Studio, Configuration
- **Ops** — Logistics, Machine, Compliance, QA
- **Data** — Live, Leads, Reports, Campaign
- **Manage** — Actions, Deadlines, Communications, Timeline, Activity

(Overview is the anchor tab; any visible section not named in a cluster falls
into a trailing "More" group.)

Internal keeps the standalone Deadlines page and the 10-stage count; customers
see phase framing ("Phase 1 of 4").

### Global
- Notifications (bell icon)
- User profile / settings
- Role switcher (for testing/demo, admin only)

---

## Page Hierarchy — MVP Screens

### Screen 1: Dashboard / Event List
**Customer:** Shows all events for their account with stage, health, next action.
**Internal:** Shows all events across all accounts with filters for stage, health, owner, date.

Key elements:
- Event cards with: name, customer, date, stage badge, health indicator
- Sort by: date, stage, health
- Filter by: stage, health, account (internal only)
- Quick action: open event

### Screen 2: Event Overview
The "home page" of an event workspace.

**Customer** (`src/components/events/CustomerEventBody.tsx`) — a single calm
column that answers four questions once each, top to bottom. The customer home
(`CustomerDashboard`) renders the *same* body so the two surfaces mirror each
other exactly:

1. **Where's my event?** — one hero status line via `customerStatusLine`
   ("You're booked in · Live in 12 days at ExCeL London"). No stage badge.
2. **What's on me?** — the `OverToYou` block: the top task as a loud cobalt CTA,
   the rest as quiet rows, each with a plain "why it matters" line
   (`actionWhyLine`). When nothing's outstanding it reassures and previews the
   next milestone (`nextCustomerMilestone`).
3. **What's the journey?** — `EventJourney variant="steps"`: a clean four-node
   bar with a "Your move" cue and a link to the full timeline.
4. **The proof/details?** — a quiet lower zone: "Your team", then
   `CollapsibleSection` disclosures for "Event details" and (overview only)
   "The numbers". No KPI grid, no right rail on the customer path.

**Internal** keeps the operational layout unchanged: next-step callout, KPI grid
(Time to event / Open actions / Assets / Stage), "Your actions", "Awaiting the
customer", "The details", the Internal card, and the `OverviewSidebar` rail.

### Screen 3: Milestone Timeline
Visual timeline showing all stages and milestones.

Key elements:
- Vertical timeline with stage grouping
- Each milestone: name, status, target date, completion date
- Current stage highlighted
- Future stages shown but muted
- Customer sees simplified version (no internal milestones)

### Screen 4: Required Actions / Checklist
Customer's clear list of what they need to do.

Key elements:
- Grouped by status: overdue, due soon, upcoming, completed
- Each item: title, description, due date, status, action button
- Action types: upload asset, complete form, approve item, provide info
- Progress bar showing completion

### Screen 5: Asset Upload Center
Where customers upload required materials.

Key elements:
- Asset slots with requirements (format, dimensions, due date)
- Upload dropzone per slot
- Status per asset: required, uploaded, under review, accepted, rejected
- Rejection feedback inline
- Version history (replace capability)
- Bulk upload support

### Screen 6: Approvals Center
Where customers review and approve deliverables.

Key elements:
- Approval cards with preview
- Approve / reject with feedback
- History of decisions
- Pending count badge
- Revision tracking

### Screen 7: Bright.Studio Request Page
Creative services marketplace and request flow.

Key elements:
- Service catalog with descriptions and indicative pricing
- Request form with brief and reference uploads
- Request status tracking
- Delivered assets accessible from here

### Screen 8: Internal Operations View
Internal-only operational controls.

Key elements:
- Product/prize readiness tracker
- Logistics status
- Scope change requests
- Internal notes (separate from customer updates)

### Screen 9: QA / Readiness View
Pre-event quality checklist.

Key elements:
- Checklist grouped by category
- Pass/fail/fixed status per item
- Failure notes and fix tracking
- Overall readiness score
- Final signoff buttons

### Screen 10: Reporting Dashboard
Post-event results.

Key elements:
- Key metrics: interactions, entries, leads, completion rate, opt-ins
- Prize/sample distribution
- Custom question results
- Time/date breakdowns
- Export buttons (CSV, XLSX)
- Event summary card
- Next-action prompts

---

## Component Architecture (Reusable)

### Layout Components
- `AppShell` — sidebar + main content area
- `Sidebar` — navigation with role-based menu items
- `PageHeader` — title, breadcrumb, actions
- `SectionCard` — glass card container for content groups

### Data Display
- `StatusBadge` — stage, health, task status
- `ProgressTimeline` — vertical milestone timeline
- `DataTable` — sortable, filterable table
- `KpiCard` — metric display card
- `ActivityFeed` — chronological event list
- `EmptyState` — helpful empty state with action

### Input Components
- `FileUpload` — drag-and-drop with requirements
- `ApprovalCard` — preview + approve/reject
- `TaskChecklistItem` — checkbox with metadata
- `FormField` — label + input + validation

### Feedback
- `Toast` — notification toasts
- `HealthIndicator` — green/amber/red dot with label
- `ProgressBar` — completion percentage
- `Skeleton` — loading placeholders
