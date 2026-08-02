# 17 — Feature Reference

> **Version:** 0.1.0 · **Status:** current · **Owner:** Product / Platform ·
> **Last verified:** 2026-07-25 against `main`.
>
> The feature catalogue, organised by audience. Each entry states the business
> value, the user workflow, and the implementing routes/components/actions so a
> reader can jump from "what it does" to "where it lives". Access is enforced by
> [`src/lib/roles.ts`](../src/lib/roles.ts) and
> [`src/lib/event-access.ts`](../src/lib/event-access.ts) at the app layer and by
> RLS at the database. Route inventory: [`docs/05`](05-information-architecture.md);
> endpoints: [`docs/16`](16-api-and-actions-reference.md).

## Audience → what they can do

| Audience | Roles | Primary surfaces |
|----------|-------|------------------|
| Public prospect | none | `/`, `/catalog/*`, `/quiz`, `/book/*`, `/proposal/*`, `/report/:token` |
| Customer | `customer_user`, `customer_admin` | `/`, `/events/:id/*` (journey subset) |
| Creative | `creative_lead` | `/events/:id/*` (creative lane), `/studio`, catalog back-office |
| Operations | `operations_lead` | `/events/:id/*` (delivery lane) |
| QA | `qa_lead` | `/events/:id/*` (build + readiness) |
| Events lead / Admin | `events_lead`, `admin` | Everything; `admin/*` for admin only |
| Partner | `partner_member`, `partner_admin` | `/partners/:slug/*` |
| Venue operator | `partner_*` where `partner.type==="venue"` | `/venues/:slug/*` |
| Show organizer | `partner_*` where `partner.type==="organizer"` | `/organizers/:slug/*` |
| Sponsor (tokened) | none | `/sponsor/:token` |

---

## 1. Public prospect

### Catalog & explainer
- **Value:** self-serve discovery of machines, games, packages, case studies.
- **Workflow:** browse `/catalog/*`, read `/how-it-works`.
- **Where:** `src/app/(public)/catalog/**`; reads via `src/lib/queries/`
  (`machines`, `games`, `packages`, `case-studies`).

### Recommendation quiz
- **Value:** turns a cold prospect into a scoped, pre-configured request.
- **Workflow:** answer objective / event type / audience / industry → see a
  capability match (`QuizMatchCard`) → hand off to book or proposal.
- **Where:** `/quiz`; capability pre-selection in
  [`src/lib/capabilities.ts`](../src/lib/capabilities.ts) (`preSelect`).
- **Rules:** 4 always-on + 9 tailorable capabilities; system pre-selects 3–5
  tailorable ones from `QuizSignals`.

### Book-now track
- **Value:** instant, priced booking for standard packages.
- **Workflow:** `/book → /book/configure → /book/checkout → /book/confirmation/:id`.
- **Where:** `src/app/(public)/book/**`; actions in
  [`src/app/actions/quotes/`](../src/app/actions/quotes/). Rate-limited
  (`quoteLimiter`).
- **Persistence:** `Quote` with `track="book_now"`.
- **Receipt:** the buyer gets `sendBookingConfirmationEmail` — package, dates,
  total, link back to the booking. A Book Now buyer has no portal account, so
  the email is their only record. It is not an invoice; nothing is charged until
  the team confirms availability.

### Proposal track (intake → gated proposal)
- **Value:** guided intake for variable-priced/experiential work; premium,
  concierge feel.
- **Workflow:** `/proposal` intake wizard (`IntakeWizard`, seeded by quiz) →
  confirmation card echoing answers + video-call booking → `/proposal/:id`
  narrative document.
- **Pricing reveal:** exact price hidden until `walkthrough_completed_at` is set
  or the quote is accepted; an indicative band shows beforehand
  ([`price-band.ts`](../src/lib/proposals/price-band.ts)).
- **Decision:** Accept / Request changes on the proposal page (rate-limited via
  `decisionLimiter`); acceptance provisions an event.
- **Where:** `src/app/(public)/proposal/**`,
  `src/components/quotes/**`, `src/lib/proposals/build-proposal.ts`. PDF at
  `GET /api/quotes/:id/proposal-pdf`.

### Public report
- **Value:** shareable proof of performance without a login.
- **Workflow:** open `/report/:token`.
- **Rules:** tokened access; shows a retention notice + capture-quality card.
- **Where:** `src/app/(public)/report/[token]/`.

### Sponsor pitch / proof link
- **Value:** an organizer sells a machine at their show by sending one link;
  the same link becomes the sponsor's proof of performance once the show runs.
- **Workflow:** open `/sponsor/:token` — before the start date it reads as a
  sales kit (placement and mission, the machine's own photo and specification,
  an expected-performance range drawn from `benchmarks`, what the slot includes,
  a case-study strip, then the price); from the start date it shows plays,
  leads, prizes, and opt-in rate for that machine over that sponsor's dates.
- **Honesty rules on the pitch half:** performance is always a *range* carrying
  its sample size, never a single number, and renders nothing at all when no
  comparable benchmark exists. Case studies only appear when they carry a hard
  stat (`toCaseStudyProof`). Inclusions are capabilities the platform actually
  ships, held in one exported constant so the pitch and the organizer's own rate
  card can't drift apart.
- **Saying yes:** the pitch half ends in a short form (name, email, company,
  optional note). Submitting it moves the slot to `reserved`, stores the enquiry
  on `game_config_json`, and raises a `sponsor.interest_received` notification to
  the organizer's own users plus the show's internal owner. The action is
  unauthenticated, so it re-validates the token server-side, rate-limits by IP,
  and only ever touches the one slot the token resolves to.
- **Rules:** the token is a capability URL. Server-validated on every request
  (match + expiry, default 30 days), rotatable and revocable by the organizer,
  `noindex` + `no-store`, and aggregate counters only — no lead row ever
  reaches this surface.
- **Where:** `src/app/(public)/sponsor/[token]/`,
  [`src/lib/sponsor-pitch.ts`](../src/lib/sponsor-pitch.ts),
  [`src/app/actions/sponsor-pitch.ts`](../src/app/actions/sponsor-pitch.ts),
  `getSlotByPitchToken` / `getSlotPerformance` in
  [`src/lib/queries/organizers.ts`](../src/lib/queries/organizers.ts).

---

## 2. Customer (`customer_user`, `customer_admin`)

Sections (`CUSTOMER_SECTIONS`): overview, briefing, assets, approvals, actions,
communications, live, leads, reports, timeline, configuration, logistics.
`customer_admin` additionally sees **studio**. Deadlines is intentionally folded
into Tasks. Navigation is the four-phase bar (Create → Prepare → Event day →
Results, `CUSTOMER_PHASES`).

| Feature | Value | Where | Rules |
|---------|-------|-------|-------|
| Event overview | One calm answer to "where's my event / what's on me / the journey / the proof" | `CustomerEventBody`, `OverToYou`, `EventJourney` | Mirrors the customer home dashboard |
| Briefing | Capture brand guidelines, tone, messaging for creative | `/events/:id/briefing`, `BriefingForm`; `actions/briefing.ts` | Change requests via `RequestChangePanel` |
| Assets | Upload required materials; track review state | `/events/:id/assets`; `actions/assets.ts` | Optional virus scan (`storage/scan.ts`) |
| Approvals | Review + sign off deliverables | `/events/:id/approvals`; `actions/approvals.ts` | — |
| Tasks | Single "what's on my plate" list, by due date | `/events/:id/actions`; `actions/tasks.ts` | — |
| Configuration | Confirm prize details/quantities (customer-safe form) | `/events/:id/configuration` | Customer sees editable prize/setup subset only |
| Logistics | Read-only delivery summary + onsite contact capture | `/events/:id/logistics` | — |
| Live | Real-time plays/leads/stock during the event | `/events/:id/live`; `GET /api/events/:id/live` (poll 20s) | Event-scoped auth |
| Leads / Reports | Captured leads + proof of performance | `/events/:id/leads`, `/reports`; export via `/api/events/:id/export` | Retention window applies |
| Studio (admin only) | Order Bright.Studio creative services | `/events/:id/studio`; `actions/studio.ts` | Gated to `customer_admin` + `studio.order` |
| Team | Add/manage teammates | `/settings/team`; `actions/team.ts`, `invites.ts` | `customer_admin` |

---

## 3. Creative (`creative_lead`)

Sections: overview, briefing, assets, approvals, actions, deadlines,
communications, studio, configuration.

| Feature | Value | Where |
|---------|-------|-------|
| Asset review queue | Triage + decide on customer uploads across events | `/admin/asset-reviews`; `actions/asset-review.ts`, `asset-annotations.ts` |
| Studio fulfilment | Deliver ordered creative work | `/events/:id/studio`, `/studio`; `actions/studio.ts` |
| Game/prize config | Set the creative-adjacent game configuration | `/events/:id/configuration`; `actions/game-config.ts` |
| Catalog back-office | Maintain machines/games/packages/case-studies | `/admin/catalog/*`; `actions/catalog.ts`, `catalog-content.ts` |

---

## 4. Operations (`operations_lead`)

Sections: overview, logistics, configuration, machine, compliance, qa. **No
creative surfaces** — ops doesn't act on them.

| Feature | Value | Where | Rules |
|---------|-------|-------|-------|
| Logistics | Delivery windows, slots, location, onsite contact | `/events/:id/logistics`; `actions/logistics/`, `logistics-entries` | — |
| Machine build | Configure the physical unit | `/events/:id/machine` | — |
| Capture-quality config | Business-email-only, blocklist, dedupe, consent, retention, branded landing | `CaptureQualitySection` in the config form; `actions/game-config.ts` | Portal **authors** rules; **enforcement is machine-side** |
| Config sync | Push event config to the machine stack | `buildEventConfigPayload` → `pushEventConfig` (`PUT /events/:id/config`) | Fires on submit, not draft |
| Compliance | Insurance / DPA / RAMS with expiry | `/events/:id/compliance`; `actions/compliance.ts` | — |

---

## 5. QA (`qa_lead`)

Sections: overview, actions, deadlines, live, timeline, configuration, machine
(read-only), qa.

| Feature | Value | Where |
|---------|-------|-------|
| Readiness checklist | Pass/fail/fixed QA items + sign-off | `/events/:id/qa`; `actions/qa.ts` |
| Build verification | Read-only machine + config check before go-live | `/events/:id/machine`, `/configuration` |
| Live verification | Confirm telemetry flows once live | `/events/:id/live` |

---

## 6. Events lead & Admin (`events_lead`, `admin`)

`events_lead` and `admin` see **every** event section (`FULL_ACCESS_ROLES`),
grouped into internal nav clusters (Deliver / Ops / Data / Manage). `admin`
additionally holds the sensitive back-office (`isAdminRole()`).

| Feature | Value | Where | Rules |
|---------|-------|-------|-------|
| Stage advancement | Move the event through the 10-stage pipeline | `actions/stages.ts` (`canAdvanceStage`) | Gated by blocking tasks/milestones; emits notifications + Pipedrive write-back |
| Quote queue + proposal prep | Turn intake into a priced, sent proposal | `/admin/quotes[/:id]`; `actions/quotes/proposal-admin.ts` | `prepareProposal` sends `sendProposalReadyEmail` |
| Customer queue | Triage incoming requests | `/admin/customer-queue` | — |
| Delivery health flag | Mark an event at risk or blocked, with a reason, and clear it again | Overview → Internal → Delivery health; `setEventHealth` in `actions/events.ts` | Internal only, reason required on amber/red, audited. Feeds the "events at risk" queues. Customers see a calm "In progress" and never the reason |
| Provisioning | Accepted quote → live event | `server/provisioning.ts` | Creates event at stage `confirmed`, plus the account and the customer's invite |
| Convert a quote by hand | Create the event workspace for a booking or accepted proposal | Quote detail → Event workspace; `convertQuoteToEvent` in `actions/quotes/conversion.ts` | `BOOKING_AUTO_PROVISION` is off by default, so this is the normal path. Commercial roles only, idempotent (a quote with an `event_id` links to it instead of provisioning again), refused on a draft / declined / expired quote, audited as `quote_converted` |
| Templates | Reusable event blueprints | `/admin/templates/*`; `actions/templates.ts`, `expand-template.ts` | — |
| Accounts / users / invites | Manage customers and staff | `/admin/accounts`, `/admin/users`, `/admin/invites`; `actions/admin-users.ts` | `isAdminRole()` |
| Locations / benchmarks / recommendations | Pricing tiers, report benchmarks, quiz tuning | `/admin/locations`, `/benchmarks`, `/recommendations` | — |
| Invoices (display-only) | Mirror finance-system invoice status | `/admin/invoices`; `actions/invoices.ts` | Intentionally unwired for raising/settling |
| API keys + Pipedrive | Integration configuration | `/admin/api`, `/admin/integrations/pipedrive`; `actions/api-management.ts`, `pipedrive-config.ts` | `isAdminRole()` |
| Reports | Generate/publish/unpublish proof of performance | `actions/reports.ts` | Auto-generated nightly (`/api/cron/reports`) |

---

## 7. Partner (`partner_member`, `partner_admin`)

Data-scoped to the partner slug. `partner_admin` adds commission management.

| Feature | Value | Where |
|---------|-------|-------|
| Dashboard | Portfolio + attribution overview | `/partners/:slug/dashboard` |
| Clients / quotes | Referred accounts and their quotes | `/partners/:slug/clients`, `/quotes`; `queries/partner-attributions.ts` |
| Commissions | Attribution + commission status (`partner_admin`) | `/partners/:slug/commissions`; `actions/partners.ts` |
| Resources | Downloadable sales collateral (XLSX/Markdown) | `/partners/:slug/resources`; `GET /api/partner-resources/:key` |

> Depth gated on volume: statements, payout runs, and white-label theming wait
> for a signed reseller (see `HANDOFF.md`).

---

## 8. Venue operator (`partner_*`, `partner.type === "venue"`)

| Feature | Value | Where |
|---------|-------|-------|
| Dashboard | Venue placements + performance | `/venues/:slug/dashboard` |
| Packages / placements | Machines at the venue over date ranges | `/venues/:slug/packages`, `/placements`; `actions/venues.ts` |
| Sponsorships | Bookable sponsor windows | `/venues/:slug/sponsorships` |
| Advertise (public) | Public landing to attract activations. An enquiry soft-holds the slot (available → reserved) and notifies the operator (`sponsor.slot_requested`) so the hold isn't waiting to be noticed. Throttled — it's an unauthenticated write taking a raw slot id | `/venues/:slug/advertise`; `requestVenueSlot` in `actions/venues.ts` |
| Embed | Iframe surface for the venue's own site | `/venues/:slug/embed` |

> Runway depth (slot scheduling, recurring rotation) is deliberately shallow
> until a venue is signed.

---

## 9. Show organizer (`partner_*`, `partner.type === "organizer"`)

The conference producer running the show (Informa, RX, Clarion). They host the
machines but do **not** own the leads: captured contacts belong to the brand
that ran the activation, and RLS enforces that line rather than the UI.

| Feature | Value | Where |
|---------|-------|-------|
| Shows | Portfolio header (hardware, what needs setting up, sponsorship sold and left) plus a card per show. Upcoming cards read "X of Y ready" and a countdown to the doors instead of today's zeroed counters | `/organizers/:slug/shows`; `lib/metrics/organizer-portfolio.ts`, `lib/metrics/show-schedule.ts` |
| Show Command | Live per-machine performance by zone, plus sponsor inventory. Before the show opens it leads with the run-up: key dates (install / doors / close / collection) and a readiness board naming what every unit still needs | `/organizers/:slug/shows/:eventId`; `KeyDates`, `ShowReadinessBoard`, `FleetLiveClient` |
| Machine detail | One unit. Pre-show: a readiness checklist that says who owns each gap, an expected-performance range, the setup story so far, key dates, the machine's own passport and the venue's site requirements. From the doors opening: live counters and activity feed. Always: zone + mission editing, the configuration it will run, and who it's sold to | `/organizers/:slug/shows/:eventId/machines/:machineId`; `UnitReadinessCard`, `ExpectedPerformance`, `SetupStoryFeed`, `UnitPassport`, `SiteRequirements`, `MachineLiveClient`, `MachineDeploymentForm`, `MachineConfigCard` |
| Venue spec sheet | A printable page of footprint, weight, power, connectivity and clearance, headed with the show, stand and dates — the thing a venue asks for weeks before move-in, without an email to us | `/organizers/:slug/shows/:eventId/machines/:machineId/spec`; `machines.footprint_mm` et al |
| Unit readiness | One derivation of "ready" behind the machine page, the show board and the portfolio card: zone, mission, game config + QA, stock, sponsor, artwork — each item owned by the organizer or by Bright.Blue | `lib/metrics/unit-readiness.ts`, `lib/metrics/show-readiness.ts` |
| Expected performance | What a unit like this usually does, from `benchmarks` matched on event and machine type. Always a range with its sample size; renders nothing when nothing comparable exists | `lib/metrics/expected-performance.ts`; `getBenchmarksForEventType` |
| Fleet | Every unit across every show, grouped by show, flagging anything still to set up | `/organizers/:slug/fleet`; `getFleetByOrganizer` |
| Per-machine deployment | Give each unit a zone and a mission (`lead_capture`, `sponsor_activation`, `welcome_gift`, `rebook_reward`, `sampling`) | `updateMachineDeployment` in `actions/organizers.ts` |
| Per-machine configuration | One show, different game/prize/capture setups per unit; units without an override inherit the show default. Organizers read it, the delivery team sets it | `/events/:id/configuration` (`FleetConfigTabs`); `lib/configuration/resolve-config.ts`; `MachineConfigCard` |
| Sponsor inventory | Open a machine as a slot from the show page (naming a sponsor reserves it, leaving it blank lists it for sale), move a slot between units, attach creative from the show's asset library | `/organizers/:slug/shows/:eventId`, `/organizers/:slug/sponsors`; `createShowSlot`, `assignSlotMachine`, `attachSlotCreatives` |
| Sponsorship book | The whole rate card across shows, grouped by show and ordered by days to doors, with anything unsold inside the three-week selling window flagged. Machine inventory is perishable and the page is built around that | `/organizers/:slug/sponsors`; `lib/metrics/sponsor-book.ts` |
| Pitch links | One tokened link per slot — pitch before, proof after. Create, copy, rotate or revoke it from wherever the slot is on screen: the rate card, the show's inventory list, or the unit's own page. The expiry is always on the row, because the link stops working | `PitchLinkControls`; `shareSlotPitch` / `revokeSlotPitch`; `/sponsor/:token` |
| Per-sponsor proof | Post-event report carries each sponsor's own machine over their own dates | `lib/reports/sponsor-proof.ts`; `SponsorProofTable` |

### Onboarding an organizer (internal, `events_lead` / `admin`)

Everything an organizer needs before their portal is worth opening. No step
requires database access, which is what makes a pilot possible.

| Feature | Value | Where |
|---------|-------|-------|
| Organizer list | Every organizer with team / show / machine counts, naming the first thing still missing (nobody can log in → no shows → no machines) | `/admin/organizers`; `getOrganizerPartners` |
| Create an organizer | Name plus optional contact; slug and partner code are minted, status is `active` immediately (an admin typing the name *is* the approval, unlike the public partner application) | `createOrganizerPartner`; `lib/partner-identity.ts` |
| Invite their team | Magic-link invite that writes both rows the portal checks — a `profiles` row with `partner_admin` (can sell and deploy) or `partner_member` (view only), and the `partner_users` membership | `inviteOrganizerUser` |
| Link shows | Hand an unclaimed show to an organizer, or take it back. A show already held by another organizer must be unlinked there first, so sponsor inventory never changes hands on a dropdown | `linkShowToOrganizer` / `unlinkShowFromOrganizer` |
| Deploy hardware | Register a serial straight onto the show, or deploy a unit already free in the register. Venue-sited units and units at another show are excluded | `createMachineInstance` / `assignMachineToShow` |
| Release hardware | Take a unit off a show, clearing zone and mission so they don't follow it. Refused while a sponsor slot points at it, and the row says who bought it | `releaseMachineFromShow` |

> Deferred pending validation with a signed organizer: rebook-reward missions
> as a first-class flow, and revenue-share statements. See `HANDOFF.md`.

---

## Cross-cutting features

| Feature | Value | Where |
|---------|-------|-------|
| Notifications | In-portal + email; per-user, per-kind preferences; hourly digest | `src/lib/notifications/*`; `/notifications`, `/settings`; `/api/cron/digest`, `/reminders` |
| Global search | Jump to events/accounts/tasks (+ profiles for internal) | `GET /api/search`; command palette |
| Live telemetry & stock | Plays/leads/prizes/stock + reload ETA + low-stock alerts | `/api/events/:id/live`, `StockCard`, `machine.stock_low` |
| Exports & PDFs | CSV/XLSX/PDF of reports/live/leads | `/api/events/:id/export`, print pages, `lib/exports/*` |
| Lead retention & purge | Auto-purge leads past the event's window | `/api/cron/purge-leads`; `retention_days` |
| Onboarding & streak | First-run guidance + engagement streak | `actions/onboarding.ts`, `streak.ts` |

## Known limitations (do not over-promise)

- **Capture-quality enforcement is machine-side.** The portal only authors and
  pushes the rules; blocking duplicates / non-business emails happens on the
  machine.
- **Live updates are polling, not Realtime** (20s `AutoRefresh`).
- **Invoicing is display-only.** Raising/settling happens in the finance system.
- **`branded-landing-page` price is unset** (`Decision required`).
- **Currency-unit inconsistency** exists across quote fields — documented in
  [`docs/08`](08-pricing-and-quoting-model.md).
