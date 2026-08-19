# Changelog

All notable changes to the Bright.Experience platform are documented here.

---

## [Informa world-class build: products, pricing, decks, report] - 2026-08-18

The complete Informa go-to-market system, addressing all four of Jiri's
requirements (products, pricing, decks for Informa and their clients,
analytics output) plus Catherine's two-model framing, elevated with motion
and art direction from the Bright.Cloud redesign.

- **Product family** — four named rate-card products in
  `src/lib/informa/products.ts` (+ tests): The Arrival (Registration
  Takeover, $50–75k), The Draw (Floor & Lounge Activation, $30–60k), The
  Rebooker (Organizer Rebooking Engine, $35–50k flat), The Loop (Screen Ad
  Network, $3–8k per slot). Rendered in the kit as a selectable tile grid
  with a lock-step carousel detail (`ProductFamily`), a rate-card table
  (`RateCard`), and "Price this in the configurator" handoffs that preset
  the price lever and scroll to it (`KitCatalog`). The deck's SKU slide
  now names all four products.
- **Private pricing** — the Informa portfolio deal page is live at
  `/pp/informa-portfolio-<slug>` on the existing generic deal-config rails:
  70/30 split, take-or-pay pilot 12–15 units scaling to 50, floor ladder
  $15k/$13.5k/$12k, levers mapped 1:1 to the product family (The Loop sells
  slots without deploying machines). Canonical config in
  `src/lib/informa/deal.ts` (+ tests), seeded by migration
  `20260818210000_informa_portfolio_pricing_page.sql` and provisioned live
  via `scripts/provision-informa-pp.ts` (idempotent upsert).
- **Sample proof-of-performance report** — `/pitch/informa/report`:
  illustrative dataset in `src/lib/informa/sample-report.ts` (+ consistency
  tests: hours sum to days sum to headlines, all inside the reach model's
  ceilings), interactive page with recharts (engagement by hour, day by
  day, lead quality, logged ad-loop plays, fulfilment), and a pre-generated
  PDF (`public/pitch/informa-sample-report.pdf`, Playwright screen-mode
  pipeline in `scripts/informa-report-pdf/`). Linked from the kit, the
  deck's renewal slide, and the sponsor deck.
- **Sponsor-facing deck** — `/pitch/informa/sponsor`: 8 slides for the
  exhibitor audience (no organizer economics), templated per show via
  `?show=&dates=&attendees=&days=` with Connect Marketplace defaults, plus
  an inline "Set up your show" editor that retunes the deck live and mints
  shareable per-show links. Mesh-drift hook slide, sponsor play journey,
  placement picker (sponsor variant of the product family, no pricing),
  show-preloaded configurator, proof gallery + client logo marquee, report
  preview, and the three-step close.
- **Informa deck upgrades** — new two-model decision slide (resell as
  sponsor inventory vs. Informa-branded layer, "Tampa runs both") with
  portfolio-portability strip (expos, conferences, festival/town-takeover
  formats) and a compliant data posture: sponsor-owned opted-in leads,
  renewal-conversation reporting, ops telemetry (no audience-profiling or
  live-lead-dashboard claims). Renewal slide links to the sample report.
- **Motion library** — ported from the Bright.Cloud redesign into
  `globals.css` (all neutralized under `prefers-reduced-motion`):
  machine-carousel lock-step slides (720ms), mesh-drift blobs, panel-grow
  reveal. Screen-slot mockup assets copied to `public/pitch/loop/`.
- Files: `src/lib/informa/{products,deal,sample-report,sponsor-content}.ts`
  (+ tests), `src/components/informa/{ProductFamily,RateCard,KitCatalog,
  SampleReportView,SponsorDeck,sponsor-slides-story,sponsor-slides-close,
  deck-slides-models}.tsx` (+ tests), `src/app/pitch/informa/{report,
  sponsor}/page.tsx`, migration + provisioning script.

## [Informa pitch deck + seller's kit] - 2026-08-18

Two unlisted, buyer-safe surfaces for the Informa partnership push, anchored
on the Connect Marketplace showcase (Tampa, 24–26 Aug 2026: registration,
Experiential Media Lounge, and Informa-booth rebooking placements).

- **`/pitch/informa`** — fullscreen interactive pitch deck (8 slides,
  `?slide=N` deep links, keyboard/touch nav): Tampa act one, the play
  journey, the organizer-inventory gap, the Activation SKU offer, 24h
  renewal-protection reporting, and the ask (named prospectus line on 2–3
  shows next cycle).
- **`/pitch/informa/kit`** — the seller's kit for Informa's own sponsorship
  reps: 60-second script, qualifying questions, an interactive placement
  configurator (attendance/days/price levers → plays, opted-in leads, cost
  per lead, impressions), objection handling, and the deal-protection flow.
- All copy and facts live in `src/lib/informa/content.ts`; configurator maths
  in `src/lib/informa/kit-math.ts` reuses the portal reach model
  (`PLAYS_PER_DAY` and `SCREEN_MULTIPLIER` now exported from
  `src/lib/reach.ts`). Projections are labelled illustrative; no internal
  economics on either page; both are `noindex`.
- Files: `src/app/pitch/informa/{page,kit/page}.tsx`,
  `src/components/informa/*`, `src/lib/informa/*` (+ tests).
- **Kit, wave 2 (world-class pass):** the kit now covers the whole deal
  lifecycle, not just the pitch. Added a paste-ready prospectus listing with
  one-click copy (`InventoryListing`), the post-signature delivery timeline,
  site requirements ("a square metre and a socket"), a real-activation photo
  strip (`SellerKitDelivery`), and a deal brief builder
  (`DealBriefBuilder` + pure formatter `src/lib/informa/brief.ts`): the rep
  fills it during the closing conversation and ships it to Bright.Blue by
  clipboard or prefilled email (`KIT_BRIEF_EMAIL`), which is exactly what
  delivery needs to take over. Deck's kit-preview slide updated to promise
  only what the kit actually contains.

## [Homepage dark default + Let's plan wording] - 2026-08-17

- Logged-out homepage now renders dark by default (`theme-dark` wrapper in
  `src/components/public/PublicLanding.tsx`); theme toggle and all other
  surfaces unchanged.
- "Let's plan" completion renamed to "your experiential activation" and
  lifted to second (`src/components/public/landing/LetsPlanSection.tsx`).

## [Full-portal audit, wave 2: copy and number consistency] - 2026-08-14

The nine-role production journey found two real defects (guessable
`/messages` URL, "Unknown" senders) which shipped earlier the same day.
This wave is the consistency pass: one voice, one date format, one money
formatter, one role label per person.

- **One role label map.** `labelForRole` in `src/lib/roles.ts` is now the
  only source for chrome labels. The user menu and home eyebrow no longer
  disagree ("Administrator" vs "Admin", "Customer admin" vs "Customer").
- **UK dates everywhere that mattered.** Activity feed and account-created
  no longer flip format by browser locale; logistics, payout, legal, stage
  transitions, partner attributions, scheduled exports, and case-study
  published dates go through `src/lib/dates.ts`.
- **UK spelling.** User-facing "catalog" is now "catalogue"; the internal
  home is "Command centre". URLs stay `/catalog`.
- **One money helper.** Executive summary, price bands, venue revenue
  models, and the show-slot wholesale hint use `formatMoneyFromPence` /
  `formatGBP`.
- **Matching badges and list CTAs.** Messages-tab unread cap matches the
  bell (`99+`). In-app "view the full list" links say "See all".

## [Full-portal audit, wave 1: messages, nudges, booking hygiene, seed truth] - 2026-08-13

Foundations + fix wave from the whole-portal correctness audit (journey
walk-throughs by role follow as wave 2).

- **Internal notes no longer leak to customers.** Internal-only event
  messages now dispatch a dedicated `message.internal_note` archetype
  (`audience: internal`); customer-facing `message.received` fires only for
  real thread messages and emails immediately instead of waiting for the
  digest. The Messages tab shows an unread-count badge for every role,
  cleared on opening the thread (`MarkThreadRead`). The notification
  settings page now hides archetypes the viewer's audience can never
  receive.
- **The proposal follow-up chase actually sends.** `proposal.delivered`
  resolved to `customer_admins`, which is nobody for a proposal-track
  quote (no account exists yet) — the chase silently never fired. A new
  `quote_contact` resolver targets the intake contact email as an
  email-only recipient; the reminder ledger's `recipient_id` was relaxed
  from uuid+FK to text (migration applied to production) so synthetic ids
  dedupe correctly. New `proposal.walkthrough_missed` no-show reminder:
  booked walkthroughs 2+ hours past their slot with no completion mark get
  a gentle rebook email (4h first nudge, 48h interval, max 2).
- **Digest cron made honest about its schedule.** Vercel Hobby rejects
  hourly crons, so `shouldSendDigest` gained a mode: `daily` (default,
  matches the deployed `0 10 * * *`) sends everyone due on the single tick;
  `hourly` (`DIGEST_CRON_MODE`, for a Pro-plan upgrade) keeps exact
  local-hour targeting. Settings copy updated to best-effort wording.
- **Quote lifecycle cleaned.** Statuses `preparing`,
  `walkthrough_scheduled` and `delivered` (allowed but never written)
  dropped from the DB check constraint (migration applied to production);
  phantom `booked` removed from the conversion allow-lists.
- **No more placeholder Cal.com links.** `walkthroughUrlFor` returns null
  when no link is configured; the proposal page falls back to the in-app
  `WalkthroughScheduler` inline, and the proposal email + fallback booker
  copy no longer promise a calendar invite that never comes.
- **Seed truth.** Five new persona logins (break-glass admin, junior
  customer, junior partner member, Northern Events reseller, Kings Cross
  venue) created in production and `seed-users.ts`; login pills corrected;
  `seed.sql` made genuinely idempotent (ON CONFLICT or scoped delete-first
  on every insert, matching its header claim).

## [Portal pull-through, part 2: volume ladder surfaces + photos-first + SplitFlow] - 2026-08-12

Closes out the portal pull-through plan (Phases 3.2, 5.1, 5.2).

- **Volume ladder on both quote surfaces, honestly gated.** Internal quote
  builder (`/admin/quotes/[id]`) always shows a "Volume ladder (draft)"
  reference card with per-rung fees, explicitly labelled placeholder.
  Customers only see the `VolumeLadderCard` on revealed proposals when
  `VOLUME_LADDER_CUSTOMER_VISIBLE=true` (new flag in booking-flags,
  documented in `.env.example`, default off until the owner signs off the
  rungs — see OWNER-TODO).
- **Photos first.** The proposal cover now opens with a four-tile strip of
  real wrapped-machine activation photography (the cleaned gallery assets
  proven on the partner microsite) before any fact chip or number, with a
  "Real activations, not renders" caption. The machine PDP's "See it in
  action" gallery moved from below the spec tables to directly after the
  hero.
- **`SplitFlow` extracted** (`src/components/brand/SplitFlow.tsx`) from the
  NRS money-flow diagram; the NRS page renders identically through it.
  Deliberately NOT added to venue earnings: venue rates are negotiated
  per placement (`pricing_model_json`), so a single split bar would
  misrepresent the deal — the component is ready for surfaces with a
  genuine fixed split.

## [Portal pull-through: partner pricing productized + proposal explorer + media-value framing] - 2026-08-12

The NRS side quest's winning mechanics pulled into the portal proper.

- **Partner pricing pages are now a real feature, not a hardcoded page.**
  New `partner_pricing_pages` table (RLS internal-only, pgTAP test, NRS row
  seeded and applied to production) with create/revoke server actions,
  slug-credential public reads, and an `/admin/partner-pricing` queue +
  create form (linked from the Commercial nav). `/pp/[slug]` now reads from
  the DB: the live NRS page renders identically on its `nrs` template;
  new pages get a generic template driven by a JSON `DealConfig` and a new
  reusable `DealExplorer` (generalized from the NRS explorer via the new
  data-driven `src/lib/deal-config.ts`). Page views recorded as
  `partner_pricing_view` loop events.
- **Proposal deal explorer (post-reveal).** `ProposalExplorer` renders in
  the proposal's Investment section only after the walkthrough price
  reveal: customers toggle tailorable capabilities, watch the investment
  update live, and "Request this configuration" merges the add-ons onto
  the quote and pings the AE (new `proposal.config_requested` archetype).
  Nothing is charged without AE confirmation. Explorer play tracked as
  debounced `proposal_explorer_change` loop events; proposal opens as
  `proposal_view`, both surfaced on `/admin/loop-pulse`.
- **Volume ladder scaffolding.** `src/lib/pricing/volume-ladder.ts` with
  placeholder multi-event discounts (owner sign-off pending, see
  OWNER-TODO) and pricing-doc updates.
- **Media-value framing on buyer surfaces.** Conservative per-tier DOOH CPM
  benchmarks (`src/lib/pricing/dooh-cpm.ts`); sponsor pitch pages show
  "Equivalent DOOH media value" when placement footfall + dates exist,
  venue advertise heroes gain a "Weekly media value" stat, machine PDPs a
  qualitative CPM anchor line. Hard gating: no data, no stat.

## [Partner pricing microsite] - 2026-08-12

Buyer-facing interactive deal explorer for partner negotiations (first
instance: Informa / National Restaurant Show), shareable as an unguessable
capability URL.

- **`/pp/[slug]`** — chromeless, noindex page outside the `(public)`
  marketing chrome; unknown slugs 404 against a static registry
  (`src/app/pp/[slug]/page.tsx`). Added `/pp` to the middleware public-route
  allowlist with tests.
- **`src/lib/partner-pricing.ts`** — buyer-safe deal maths (retail anchors,
  60/40 split, floor ladder, commitment terms). Documented as never carrying
  internal economics: the module ships to a negotiating counterparty's
  browser.
- **`src/components/partners/NrsPricingExplorer.tsx`** — slider-driven
  inventory mix explorer (singles, retail band, takeover bundles) with live
  gross/retained figures and a volume-ladder table. Slider bounds enforce the
  negotiating floors — the UI cannot express a price below them.
- **`src/components/ui/slider.tsx`** — new shadcn primitive; `aria-label`
  forwarded to the Radix `Thumb` (where `role="slider"` lives) so sliders
  have accessible names.
- Follow-up same night: "Recommended retail" labelling on all price
  surfaces, Europa activation photo gallery (real wrapped machines from
  `/catalog/machines/europa`), and an embedded-DOOH media value section
  (6×10s slots, ~1,800 plays, 55,000+ verified NRS audience) framed against
  the show's own rate card rather than street DOOH CPMs.
- Activation gallery moved to the top of the page — the product now leads,
  before any numbers.
- Dark-mode fixes: the page's wordmark swap and the explorer's pilot-minimum
  note keyed off Tailwind's OS-level `dark:` variant instead of the app's
  `.theme-dark` class, and the two wordmark assets were mapped backwards
  (`-light.png` is white-ink for dark surfaces, `-dark.png` navy-ink for
  light). Both fixed; the logo now renders in either theme regardless of OS
  setting.
- Gallery photos cleaned: the Europa activation shots had dark-navy deck
  frames baked into the JPEGs (exported from a slide deck). Cleaned copies
  live under `public/partners/nrs/gallery/` (generated by
  `scripts/clean-nrs-gallery.py`); the page crops each tile around the
  machine via per-photo `object-position`. Catalog originals untouched.
- Page locked to dark mode: `.theme-dark` is applied on the page root so
  every visitor sees the dark treatment regardless of app theme or OS
  setting; the wordmark swap collapsed to the single white-ink asset.
- Copy pass: every em-dash removed from buyer-facing text (rewritten as
  full sentences), hero headline now "sold the way you already sell",
  proof heading now "Your own shows already sell this" (both user-approved),
  and the production-lock example date corrected from mid- to late November
  (25 weeks before 15 May is 21 November).
- Revenue split repositioned from 60/40 to **70/30** (opening negotiation
  position, decided with the CMO before the page was shared externally):
  `REVENUE_SPLIT` in `partner-pricing.ts`, the money-flow diagram, the
  volume-ladder table, the partnership-terms card and all tests. Floors
  and retail bands unchanged. The internal commercial spec records the
  concession ladder (settle target 60/40, absolute floor 55/45, every
  step traded for term or volume).
- Campus schematic lines brightened (hall outlines, takeover trio,
  dashboard feed lines) after review feedback that they were too faint
  on the dark theme.
- Corridor placements added as a third explorer lever with their own
  $25k–$40k retail band (suggested $30k): they were previously a static
  card only, so buyers couldn't model Model 1 revenue or see corridor
  volume push the mix into cheaper floor tiers. All placements draw from
  the shared 50-unit fleet ceiling. "The split never moves" removed from
  the ladder footnote (it is exactly what's being negotiated).
- Corridor lever physically capped at 4 units (two connecting corridors,
  two machines each) so the calculator can't express an unreal mix of
  cheap corridor units, with an explicit note that corridor placement
  rights (MPEA) sit outside this structure and are agreed separately.
- Explorer slider thumbs now carry the campus schematic's marker key
  (gray dot = singles, solid blue = takeover, blue outline = corridor) so
  the diagram legend and the levers read as one system; each retail
  slider matches its placement type. Implemented via a new optional
  `thumbClassName` prop on the shared `Slider` primitive.
- Post-meeting pass (12 Aug): takeover retail slider now always mounted
  (disabled at 0 bundles) — conditionally inserting it mid-drag shifted
  the layout under the cursor and read as broken sliders on the call;
  Bright.Blue's dollar share removed from the explorer (split percentage
  only); HIMSS precedent section removed at the buyer's steer (different
  show, different clientele), with the Europa capability copy relocated
  under the photo gallery; buyer-facing spelling americanized.
- Retail ceilings raised on the audience-gap argument (HIMSS is a ~30k
  show selling a basic unit at $45k; NRS is 55k+): singles
  $45k–$70k (suggested anchor $50k), Cross-Hall Takeover $110k–$175k,
  corridor $25k–$40k. Floors unchanged.
- **`src/components/partners/NrsModelsShowcase.tsx`** — the three
  go-to-market models presented visually in the partner deck's own
  numbering (Model 1/2/3 as pilot/flagship/engine), with an SVG campus
  placement schematic (halls, corridors, takeover trio, dashboard feeds)
  and a money-flow diagram of the 60/40 split. Replaces the plain
  inventory card list on `/pp/[slug]`.

---

## [The loops: Event Wrapped, invitation footers, loop telemetry + pulse dashboard] - 2026-08-08

Experience audit Tier 3 (the loops), Part 3 (subtractions), and Part 5
(measurement).

- **Event Wrapped (3.C)** — story-format post-event page at
  `/report/[token]/wrapped` (headline number, Bright Index placement, human
  moment, pre-written share text) built by `src/lib/reports/wrapped.ts` from
  report metrics + benchmarks; LinkedIn-ready 1200×627 share card at
  `/api/reports/[token]/wrapped-card`. Linked from the public report, the
  customer Reports tab, and `ShareableReportBanner`.
- **Bright Index placement (3.D)** — `src/lib/bright-index/percentile.ts`
  places an event's leads-per-day against the pooled public benchmarks
  (quartile bands only — no "top decile" claims from quartile data);
  `IndexPlacementChip` renders the badge/band + sample size on the public
  report; methodology note added to `/bright-index`.
- **Player result card (3.C)** — public `/play/[leadId]` page + 1080×1080
  share card (`/api/play/[leadId]/card`): score, day rank, percentile from
  telemetry (`src/lib/player-result.ts`, `src/lib/queries/player-result.ts`).
  The post-play email now links each player to their own card.
- **Invitation footers (3.A)** — `InvitationFooter` ("Want results like this
  at your event?") on the public report, live dashboard, sponsor pitch,
  venue widget, and player card; UTM-tagged via `src/lib/loop/invitation.ts`;
  `/book` personalises its hero from the referring event and records the
  landing.
- **Pitch detail gate (3.F)** — sponsor pitch detailed numbers sit behind a
  light identity form (`PitchDetailGate`, `unlockPitchDetails` action,
  HTTP-only unlock cookie); viewing the pitch itself stays free.
- **Loop telemetry** — new `loop_events` table (migration
  `20260809000001_loop_events.sql`, internal-read RLS + pgTAP test) written
  via `src/server/loop-events.ts`: invitation landings, pitch unlocks,
  player-card views, and public report opens.
- **Loop-pulse dashboard (Part 5)** — `/admin/loop-pulse` (commercial roles):
  median accepted→workspace time, report published→opened rate, provable
  rebook rate, invitation CTR by artifact, fleet email-capture rate, and the
  "how did you hear about us" distribution (`src/lib/loop-pulse.ts`,
  `src/lib/queries/loop-pulse.ts`).
- **Same-day report ritual (3.H)** — the reports cron now also runs at 18:00
  UTC and drafts reports for events ending that day ("the report beats the
  client back to the office"), creating a same-day review task that
  auto-completes on publish; playbook entries (same-day publish ritual,
  QR placement, no-cash-referral policy) added to `OWNER-TODO.md`.
- **Subtractions (Part 3)** — welcome tour deferred to second login; asset
  tasks grouped into one "N brand assets · one upload flow" row; pre-event
  Leads page replaced the zero-wall with anticipation + "wire your CRM";
  intake wizard cut from five steps to four (fields the walkthrough asks
  better were removed; footfall only asked when the quiz didn't capture it);
  customer Stock tab appears only from `logistics_confirmed`; machine PDP
  hero trimmed to one killer stat + one all-in price line; export controls
  no longer render on empty tables.

---

## [Customer campaign naming + planning-month report re-send] - 2026-08-08

Experience audit items 2.F and 2.H.

- **Campaign naming (2.F)** — new `quotes.campaign_name` column (migration
  `20260808000001_campaign_naming_planning_month.sql`). The intake wizard's
  first step gains an optional "Name your campaign" input
  (`IntakeStepEvent`), persisted by `submitProposalIntake`.
  `provisionEventFromQuote` (`src/server/provisioning.ts`) now prefers the
  campaign name over the generated "{company} — {package}" event name; the
  report headline already derives from the event name, so the customer's
  name flows through to the report with no report-side change. New
  `renameEvent` server action (`src/app/actions/events.ts`, 3–80 chars,
  customers limited to their own account's events) behind a new inline
  pencil-edit control on the customer event overview title
  (`src/components/events/RenameEventControl.tsx`).
- **Planning-month re-send (2.H)** — new `quotes.planning_month` column
  ('YYYY-MM', same migration), captured via an optional month input on the
  intake contact step (`IntakeStepContact`). New lifecycle nudge
  `nudgePlanningMonthReport` (`src/lib/notifications/reminders/lifecycle.ts`,
  wired into the daily reminders cron): when a quote's planning month is the
  current month, its event is complete, and a published report exists, the
  customer gets the new `report.planning_resend` archetype ("Planning
  season? Your {event} results, one click away") — once per event, deduped
  via the notifications table like the sibling nudges.
- Tests: lifecycle nudge (5 cases), intake field persistence, `renameEvent`
  RBAC/validation, `RenameEventControl` Testing Library spec, provisioning
  name preference.

---

## [Admin quality-of-life batch: partner invites, venue creation, live-share move, ops tasks access, API empty state] - 2026-08-08

Five small independent fixes across admin and event surfaces.

- **Generic partner email invites** — new `invitePartnerUser`
  (`src/app/actions/partner-admin.ts`, admin-gated) clones the organizer
  invite flow for any partner type; `InvitePartnerUserForm`
  (`src/components/partners/`) replaces the paste-a-profile-UUID card on
  `/admin/partners/[id]`. Tests for both.
- **`createVenue` action + New venue dialog** — the previously dead
  `createVenueSchema` is now used by `createVenue`
  (`src/app/actions/venues.ts`, admin-gated), which mints a unique slug and
  inserts a `venues` row. `NewVenueDialog` on `/admin/partners` (admin-only
  button) drives it. Action + dialog tests added.
- **Live share controls moved** — the view-only stakeholder link manager
  moved from `/events/[id]/stock` to `/events/[id]/live` (below the live
  dashboard), along with its share-token fetch.
- **Ops task deep-links fixed** — `operations_lead` now has the `actions`
  section in `src/lib/event-access.ts`, so their task CTAs to
  `/events/[id]/actions` no longer bounce.
- **/admin/api no longer 404s when the public API flag is off** — admins see
  the page chrome with a "request access" empty state instead; flag-on
  behaviour unchanged.

---

## [Report-published notification + post-wrap rebook nudge] - 2026-08-08

Two customer-facing notification spine additions.

- **`report.published` archetype** (`catalogue.customer.ts`) — when an
  internal user publishes a post-event report, `publishReport`
  (`src/app/actions/reports.ts`) now dispatches "Your results are ready" to
  the event's customer admins (portal bell + immediate email via the existing
  dispatcher lanes), deep-linking to `/events/{eventId}/reports`. A failed
  dispatch never rolls back the publish.
- **`event.post_wrap_rebook` archetype + cron nudge** — new
  `nudgePostWrapRebook` in `src/lib/notifications/reminders/lifecycle.ts`
  (wired into the daily reminders cron) fires once per event, ~14 days after
  completion (anchored on `event_date_end`, falling back to
  `event_date_start`), inviting the customer back to their still-live results.
  De-duplicated via the existing `notifications` row check, same as the
  t-minus nudges.
- Tests: `publishReport` dispatch coverage in `reports.test.ts`, catalogue
  assertions in `archetypes.test.ts`, and a new
  `reminders/lifecycle.test.ts` covering fires-at-14-days, no-double-send,
  still-in-delivery, too-recent, and the `event_date_start` fallback.

---

## [Distinct browser-tab titles] - 2026-08-08

Every authenticated page now sets a distinct `<title>`, so multiple open tabs
are tellable apart. The root layout's `%s · Bright.Experience` template
appends the brand suffix exactly once.

- **New** `src/lib/queries/page-titles.ts` (+ tests) — React-`cache`d,
  RLS-scoped name lookups (`events`/`venues`/`partners`, name column only)
  plus the `entityTitle("Live", name)` → `"Live — <name>"` formatter used by
  `generateMetadata`. Missing/inaccessible entities fall back to the plain
  section name.
- **Dynamic titles** on all 22 `/events/[id]/**` pages ("Live — <event>"),
  7 `/venues/[slug]/**` pages ("Earnings — <venue>"), all 5
  `/partners/[slug]/**` pages, and 7 `/organizers/[slug]/**` pages (list
  pages use the organizer name; show/unit pages use the show name).
- **Static titles** on `/` ("Home"), `/pipeline`, `/studio`, `/events/new`,
  and 26 `/admin/**` pages named after their on-screen headings ("Quote
  queue", "Location tiers", "Game library", …).
- **Double-suffix fix** — 12 pages hardcoded "· Bright.Experience" inside
  their title (inbox, notifications, settings ×5, admin ×5), which the layout
  template doubled; the suffix is stripped so the template applies once.
- Skipped (cannot export metadata or never render): the five `"use client"`
  auth/checkout pages, the `/ops` and `/organizers/[slug]` pure redirects,
  and the public booking confirmation page.

---

## [Exceptional-experience audit] - 2026-08-07

Four parallel deep dives (codebase journey-stitching gap analysis, live
production friction crawl across four personas, sales/human-psychology
research, self-promoting product-loop research) synthesized into
`docs/22-exceptional-experience-audit.md`: a tiered program of trust repairs,
loop-closing stitches, psychology-driven moments, growth loops, and explicit
subtractions. No code changes in this entry — the document is the deliverable.

---

## [Housekeeping — performance & security hardening] - 2026-08-07

Advisor-driven hardening pass on the live database, plus a timezone bug fix.

- **Timezone bug in slot fulfilment due dates** — `computeSlotTaskDueDate` in
  `src/server/slot-fulfilment.ts` built dates at local midnight but formatted
  them with `toISOString()` (UTC), so every task due date came out one day
  early in any timezone east of UTC (including the UK in summer). Now formats
  from local date parts. Audited the rest of the codebase for the same
  pattern — all other date helpers are UTC-consistent.
- **Migration `20260807000000_performance_hardening`** (applied to production):
  covering indexes for all 50 foreign keys the performance advisor flagged as
  unindexed; rewrote 13 RLS policies to evaluate `auth.uid()` once per
  statement via a scalar subquery instead of per row; pinned `search_path` on
  `update_updated_at`; revoked client EXECUTE on `handle_new_auth_user` and
  `schema_migration_version`.
- **Leaked-password protection enabled** in Supabase Auth (HaveIBeenPwned
  check on signup/password change).
- **Dependency fix** — `npm audit fix` resolved the high-severity `pdfjs-dist`
  arbitrary-JS-execution advisory (GHSA-hq66-cqwq-w95j); 0 vulnerabilities
  remain.
- Advisor counts after the pass: security 16 → 10 warnings (the remaining 10
  are RLS helper functions that must stay executable by signed-in users — by
  design); performance errors on unindexed FKs and per-row auth calls cleared.
  The 618 "multiple permissive policies" warnings are a known structural
  refactor, tracked separately.

---

## [Ecosystem build · Stage 6 — authority & channels] - 2026-08-04

The final stage of the ecosystem build (docs/19 items 35–38): publish the
numbers nobody else in experiential will print, let partners share results
under their own lockup, and put the catalog inside AI assistants.

- **The Bright Index** — new ungated public page `/bright-index`: median +
  middle-50% quartile bands for plays, opted-in leads, samples and dwell per
  event day, by venue class, straight from the `benchmarks` table (Stage 5's
  `updateBenchmarks` writes the percentiles). Pure shaping layer
  `src/lib/bright-index/shape.ts` (14 tests) enforces a publication floor —
  no segment prints below 5 completed events — and the anon-safe read model
  `public-benchmarks` (2 tests) applies the same floor in SQL. Daily ISR.
- **State of Play 2026** — new ungated public page `/state-of-play`: the
  annual editorial report. Three headline numbers pulled live from the Index
  data, five findings, methodology, no email wall. Both pages are in the
  middleware allowlist, the public footer, `/llm-info`, and `/llms.txt`.
- **Partner white-label reports** — migration `20260806000000` adds
  `event_reports.brand_partner_id` (theming only; attribution unchanged).
  Publishing a draft report now offers a co-brand checkbox when the event has
  a linked partner (organizer link first, latest attribution as fallback —
  `partner-brand` query, 5 tests). When set, the public `/report/:token` page
  renders the partner's `PartnerCoBrand` lockup, a brand-colour accent rule,
  and "Prepared by {partner} · Powered by Bright.Experience"; when unset the
  page is unchanged (3 publish branch tests, 3 component tests).
- **Public MCP server** — `/api/mcp` (new deps `mcp-handler` v2 +
  `@modelcontextprotocol/server`, stateless streamable HTTP, no Redis).
  Tools: `search_catalog`, `get_pricing` (canonical tier bands per region),
  `get_benchmarks` (the Bright Index), and `request_proposal`, which reuses
  the rate-limited, validated `submitProposalIntake` path and warns
  assistants it creates a real enquiry. Response formatters are pure and
  tested (`src/lib/mcp/format.ts`, 7 tests). Advertised in `/llms.txt` and
  `/llm-info`; documented in docs/10 §8f. Precedent: Hire Space / RainFocus
  (docs/19 §event-tech).
- Docs: 04 (brand_partner_id), 05 (routes), 10 (§8f MCP). Gates: lint ✓,
  typecheck ✓, 2,309 unit tests across 281 files ✓, 233 pgTAP ✓, plus a
  local end-to-end MCP handshake + all four tools exercised over HTTP.

---

## [Ecosystem build · Stage 5 — measurement & proof engine] - 2026-08-04

The report becomes the product (docs/19 §agencies, §event-tech): a
three-audience story with CFO-grade unit economics, benchmark context,
procurement-defensible lead quality, real-time CRM delivery, a post-play
journey that extends the story past event day, a shareable live dashboard,
and campaign roll-ups that finally compute.

- **Foundation migration** `20260805000000_measurement_proof_engine.sql`:
  `leads.email_status` + `leads.is_repeat_player`; `events.live_share_token`
  (+ expiry, unique partial index); `webhook_subscriptions.event_id`;
  new `post_play_journeys` + `journey_touches` tables (RLS + pgTAP
  `rls_post_play_journeys.sql`, 5 tests); widens the `telemetry_events`
  event-type CHECK to admit the two capture-quality types it was rejecting.
- **Engaged minutes** — `src/lib/metrics/engaged-minutes.ts` (10 tests):
  plays × average session, plus cost-per-engaged-minute. Headlines the new
  report executive tier and the campaign KPIs.
- **Three-audience report** — the event report now opens with an executive
  summary (cost per lead, engaged minutes, cost per engaged minute, benchmark
  verdicts; `ExecutiveSummary`, 4 tests), keeps KPI detail in the middle, and
  closes with ops learnings (capture quality + the new lead-quality screen).
- **Benchmark layer** — `benchmark-compare` (7 tests) + `benchmark-context`
  query (3 tests) render "vs your last event" and "vs venues like this one"
  verdict sentences (`BenchmarkContextCard`, 4 tests; small samples are
  flagged "directional"). `updateBenchmarks` now also writes p25/p75 and the
  `plays_per_day`/`leads_per_day` rows the expectation engine reads —
  previously seed-only (3 new action tests).
- **Lead-quality scoring** — `src/lib/leads/quality.ts` (11 tests): RFC-lite
  syntax check, 40-domain disposable screen, gmail-aware dedupe. Applied at
  webhook ingest (verdict + repeat flag stamped on every new lead; 3 new
  route tests) and reported as a separate "verified leads" number
  (`LeadQualityCard`, 5 tests) on the leads page and report.
- **Real-time lead delivery** — event-scoped outbound webhooks
  (`src/server/lead-delivery.ts`, 5 tests): HMAC-signed POST per captured
  lead, 5s timeout, 5-failure circuit breaker; managed from the leads page
  (`LeadWebhookManager`, 3 tests; secret shown once at creation — actions,
  8 tests). HubSpot/Salesforce/Klaviyo recipes in docs/10 §8d.
- **Post-play journeys** — internal-configured where-to-buy / review /
  discount follow-up (`JourneyConfigCard`, 4 tests; action, 4 tests) sent to
  **verified leads only** on capture (`src/server/journeys.ts`, 9 tests;
  idempotent via the touch constraint). Open pixel + server-resolved click
  redirect at `/api/journeys/track` (allowlisted; docs/10 §8e). The report
  gains a sent→opened→clicked funnel with a first-24h split
  (`JourneyFunnelCard`, 4 tests; queries, 6 tests).
- **Shareable live dashboard** — `/live/:token` (public, expiring, noindex,
  "Powered by Bright.Experience", 60s auto-refresh): headline totals only via
  a service-role read model (`public-live`, 4 tests) — never lead rows.
  Issue/rotate/revoke from the new stock page (`LiveShareControls`, 3 tests;
  actions, 4 tests).
- **Stock telemetry page** — `/events/:id/stock`: remaining/capacity bar with
  amber/red thresholds, prizes dispensed, honest empty state
  (`StockTelemetryCard`, 3 tests), plus the share-link controls; "Stock" tab
  added to the event nav (logistics visibility).
- **Campaign workspace economics** — `campaigns.aggregate_metrics_json` was
  read by the dashboard but written by nothing; `src/server/campaign-rollup.ts`
  (4 tests) now recomputes it on membership changes and after cron report
  generation (sums latest snapshot per event, play-weighted dwell, engaged
  minutes). The campaign dashboard shows real plays/leads/engaged-minutes
  KPIs and per-event side-by-side comparisons
  (`getLatestMetricsForEvents`, 3 tests).
- **Deferred by design**: the compliance tier (age gates, consent copy,
  retention controls as a paid add-on) is conditioned on legal copy review in
  the build plan — owner decision before build (`OWNER-TODO`).
- Docs: 04 (new tables/columns), 05 (routes), 10 (§8d outbound delivery,
  §8e journey tracking). Gates: lint ✓, typecheck ✓, 2,273 unit tests across
  275 files ✓, 233 pgTAP tests across 36 files ✓.

---

## [Ecosystem build · Stage 4 — venue yield engine] - 2026-08-04

The venue channel gets the machinery that turns a hosted machine into managed,
sellable inventory (docs/19 §venues): coded SKUs with an approval step, typed
revenue models with live earnings, a dark-day calendar, and a compact
white-label embed.

- **Placement-as-SKU register** — migration `20260804000000_venue_yield_engine.sql`
  adds `sku_code` (venue-scoped unique), `location_label`, `footfall_estimate`,
  `max_slots_per_sponsor` and `sku_status` (`draft`/`live`) to `placements`
  (existing rows backfilled `live`). The placements page gains a per-row SKU
  editor + publish control (`PlacementSkuEditor`, 4 tests); only `live`
  placements appear on the public advertise page and widget. The per-sponsor
  cap is enforced in `reserveSlot` (blocked with a plain-English error).
- **Typed revenue models** — `src/lib/venues/revenue-model.ts` (10 tests)
  parses `pricing_model_json` into `revenue_share` / `fixed_fee` /
  `guarantee_overage` (guarantee vs share, whichever is greater), tolerating
  the legacy ad-hoc shapes. Venues configure it in a live-preview form on the
  placements page (`RevenueModelConfigurator`, 4 tests → new actions
  `updatePlacementPricing`, `updatePlacementSku`, `publishPlacementSku` with
  tests in `actions/venues.test.ts`, now also covering Stage 3's
  `holdSlot`/`confirmSlot`).
- **Venue earnings** — `/venues/:slug/earnings` rolls up booked vs open slot
  revenue per placement and computes the venue's share under its model
  (`venue-earnings` query, 3 tests), with a print-first monthly statement at
  `/venues/:slug/earnings/statement`.
- **Dark-day calendar** — `/venues/:slug/calendar` lists every future run of
  days inside a placement window with no slot on the market
  (`src/lib/venues/dark-days.ts`, 11 tests) and opens a gap for sponsorship in
  one click (`DarkDayBoard`, 4 tests → existing `createSponsorshipSlot`).
- **White-label embed** — new public `/venues/:slug/widget` (chrome-less
  360×420 iframe card: open-slot count, from-price, next window, attributed
  CTA; `VenueWidgetCard`, 5 tests) added to the middleware allowlist; the
  embed-code generator now offers full-page and compact-widget variants.
- Venue portal tabs gain Calendar and Earnings.
- **Three production RLS bugs found by the live smoke** (mock mode has no
  RLS, so local never saw them): (1) the hardening policy "Partner admins
  manage own partner users" selected from `partner_users` inside its own
  USING clause → "infinite recursion detected" on every non-internal read,
  bouncing every partner out of their portal — fixed with a
  `user_is_partner_admin()` SECURITY DEFINER helper
  (`20260804000001`, regression-tested in `supabase/tests/rls_partner_users.sql`);
  (2) partners had SELECT/UPDATE but no INSERT policy on `placements`, so
  "New placement" always failed live (`20260804000002`, tests added to
  `rls_venues.sql`); (3) the public advertise page and widget read venues
  with the anon client, which has no venue policy at all → 404 for every
  anonymous visitor. Rather than a blanket anon SELECT (would expose venue
  contact details over the REST API), both pages now read through
  `src/lib/queries/public-venue-media.ts` — a service-role read model that
  returns marketing-safe fields only, never raw `pricing_model_json`
  (5 tests, including a commercial-terms leak guard).
- Fixed a pre-existing `EmbedCodeGenerator` hydration mismatch + CSP
  violation (`window.location.origin` read during render) with the
  `useSyncExternalStore` pattern; the preview iframe now mounts only once
  the real origin is known.
- Live seed gains a venue-operator persona
  (daniel@westfield-stratford.com / demo-password-123) so the venue portal
  is testable in production.
- Composer delegation: earnings query + pages, dark-day board + page,
  configurator + SKU editor, and widget + embed upgrade built by four composer
  agents against exact contracts; schema, revenue-model and dark-day
  libraries, actions, cap enforcement, advertise filter, and wiring by the
  main agent.

## [Ecosystem build · Stage 3 — organizer sales engine] - 2026-08-04

The organizer channel gets the machinery that lets a show's sales team resell
Bright.Blue with confidence (docs/19 §organizers): channel protection, wholesale
economics, sales collateral, and automatic fulfilment when a slot sells.

- **Deal registration** — new `deal_registrations` table + migration
  (`20260803000000_organizer_sales_engine.sql`, pgTAP RLS tests). An organizer
  registers a sponsor conversation at `/organizers/:slug/deals`; internal
  review at `/admin/deals` (nav: Commercial → Deal registrations) inside a
  24 h SLA. Approval starts a 14-day exclusivity window on that company across
  every channel; rejection sends the typed reason to the organizer verbatim.
  Duplicate claims by the same partner return the existing claim; competing
  claims by another channel are blocked while live (service-role check that
  leaks only a boolean). Actions in `src/app/actions/deal-registrations.ts`
  (9 tests), library in `src/lib/deal-registrations.ts`, queries in
  `src/lib/queries/deal-registrations.ts` (4 tests).
- **Reverse lead push** — `pushLeadToOrganizer` creates a pre-approved deal
  shell from an inbound quote, wired to the internal quote page as
  `PushLeadCard` (4 tests): route a direct brand lead to the organizer whose
  show owns that audience, window already running.
- **Slot holds** — `holdSlot` action + `hold_expires_at`: a countdown
  reservation (default 14 days, extendable) instead of a forever-reserved
  slot. Confirm clears the hold; release clears it; an expired hold reads as
  available at query time (`src/lib/slot-holds.ts`), so no sweep cron.
- **Wholesale economics** — `wholesale_price` on show slots. The open-a-slot
  form asks for sponsor price and "your cost", suggesting rack −25%
  (`src/lib/pricing/slot-economics.ts`, 12 tests); the earnings page at
  `/organizers/:slug/earnings` rolls up earned vs pipeline margin per show
  (`organizer-earnings` query, 3 tests).
- **Fulfilment spawning** — confirming a show slot spawns the standard
  fulfilment checklist (artwork, wrap proof, prize stock, config, go-live)
  on the show event via `src/server/slot-fulfilment.ts` (idempotent,
  never blocks the sale; 5 tests).
- **Pitch-link engagement** — public pitch opens bump `pitch_view_count` /
  `pitch_last_viewed_at` (counts only, no visitor identity;
  `src/server/pitch-views.ts`, 4 tests) and the rep's link controls read
  "opened N times, last …". The pitch page gains a sponsor-side
  cost-per-lead calculator (`SlotRoiCalculator`, benchmark-bounded).
- **Print collateral** — per-slot prospectus block and co-branded one-pager
  at `/organizers/:slug/shows/:eventId/slots/:slotId/{prospectus,one-pager}`
  (print-first pages; locked performance claims with sample sizes).
- **Notifications** — four new kinds (`deal.registered` → internal admins,
  `deal.approved` / `deal.rejected` / `deal.lead_pushed` → the registering
  partner via new `registration_partner` resolver).
- Composer delegation: earnings dashboard, collateral pages + queries,
  fulfilment spawner, and ROI calculator built by four composer agents
  against exact contracts; schema, actions, holds, wholesale, pitch views,
  deals surfaces, and all wiring by the main agent. Full gate: lint +
  typecheck clean, 2,088 tests green.

---

## [Ecosystem build · Stage 2 — proposals that answer sooner] - 2026-08-02

The quote → proposal journey now answers the buyer's two questions —
"what will it cost?" and "what will it do?" — at the earliest honest moment,
and arms the internal champion who has to sell it upward (docs/19: instant
estimates, benchmark-backed forecasts, champion enablement, add-ons at
acceptance).

- **Instant estimate on submit** — `submitProposalIntake` now returns a
  best-effort estimate built by new `src/lib/pricing/instant-estimate.ts`
  (7 tests): the tier the chosen capabilities imply (telemetry → Command,
  lead capture → Lead Engine, else base) with its published UK band, plus
  benchmark plays/leads ranges via `buildExpectation`. The post-intake
  confirmation shows it as "Your early numbers" with the sample-size caveat;
  leads are never projected for a tier without the lead-capture layer.
- **Benchmark band on the proposal** — `/proposal/[id]` now fetches event-type
  benchmarks and renders "What activations like this actually do"
  (plays/leads ranges + basis label) alongside the existing modelled reach
  band. Ranges, never point estimates; the section disappears when nothing
  comparable exists.
- **Validity countdown** — new `src/lib/proposals/validity.ts` (5 tests)
  turns the already-enforced `quotes.expires_at` into an honest cover chip
  ("Valid for N more days"), shown only while the proposal is open.
- **Champion tools** — `ShareProposalButton` (prefilled mailto forward) and
  `ChampionSummaryCard` (copyable what/when/reach/investment lines for the
  person who signs it off; price appears only once revealed). 4 tests.
- **Add-ons at acceptance** — accepted proposals show `AcceptedAddOns`, a
  one-click "add a layer" card wired to the existing
  `updateQuoteCapabilities` action (4 tests). Copy is explicit that nothing
  is charged until the event lead confirms the line item.
- Composer delegation: the three microsite components were built by two
  composer agents against exact prop contracts; estimate/benchmark/validity
  logic and all wiring by the main agent. Full gate: lint + typecheck clean,
  1,998 tests green.

### Production fix: the public quote journey was dead under real RLS

The Stage 2 live smoke crawl caught the proposal microsite 404ing in
production. Root cause: every public quote surface used the cookie-bound
anon client, but `quotes` RLS only grants select/update to the owning
account or internal users — so anonymous prospects (the entire audience of
these pages) read nothing and their updates matched zero rows *while still
returning success*. Local dev never showed it because the mock store
bypasses RLS. Fixes, all following the documented `getSlotByPitchToken` /
`getBookingReceipt` pattern (service-role client + the unguessable UUID as
the credential + guards in code):

- New `getQuoteForProposal(id)` (UUID-validated, service-role) now backs
  `/proposal/[id]` and the proposal-PDF route.
- `acceptQuote` / `declineQuote` write via service role, pin the transition
  to `proposal_sent`, enforce `expires_at` server-side, and report a
  zero-row update as a failure instead of a success.
- `submitProposalIntake` / `submitBookNowQuote` insert via service role
  (anon may insert under RLS but cannot select the new row back, so the
  returned id always failed).
- `bookWalkthrough` / `updateQuoteCapabilities` write via service role,
  pinned to statuses where the write still makes sense.
- 7 new/updated action + query tests covering the status pins, expiry
  rejection, and the UUID gate.

The same crawl then found the proposal **PDF export** had never worked in
production, behind three stacked faults fixed in sequence: the route was
missing from the middleware allowlist (307 → /login); it gated on a
`proposal_content` column no code path writes (404 for every real quote —
the document is built on the fly); and the `@sparticuz/chromium` binaries
were absent from the deployed function because the `outputFileTracingIncludes`
route key used a literal `[id]`, which picomatch reads as a character
class and never matches. Verified live: the export now returns the full
8-page PDF.

## [Ecosystem build · Stage 1 — tell the story & publish the proof] - 2026-08-02

The marketing site now tells the network story and publishes real prices —
the two biggest gaps from the docs/19 comparative audit (the venue/organizer
sides were publicly invisible; pricing hid behind a call).

- **`/pricing`** — audience-aware pricing page: persona selector (brand /
  agency / organizer / venue) + UK/US/EU region toggle before any number.
  Brands see the tier grid Best-first (Lead Engine badged "Most popular") +
  a cost-per-lead strip; agencies see rack + trade terms; organizers/venues
  see no public numbers and route to partner pages. Deep-linkable
  (`?for=agency`). New `PricingExplorer`/`TierCard` components, 7 tests.
- **`/for-venues` + `/for-organizers`** — public role landing pages (hosting
  economics; wholesale resale motion) + a homepage `NetworkSection` with
  three role doors. Nav/footer rewired (Pricing in primary nav, new Partners
  footer column).
- **`/business-case`** — interactive cost-per-lead calculator
  (`CplCalculator`, 4 tests) dividing published bands by a visitor-set lead
  count, against named CEIR/LinkedIn benchmarks. **`/faq`** — plain-language
  answers (cost, speed, logistics, data). **`/measured-sampling`** — the
  "<1% measured vs 100% counted" sampling story.
- **Machine pages** now carry a commercial strip (from-price out of the tier
  model, wrap + delivery inclusions, link to /pricing) and an honest fleet
  benchmark ("175–300 plays/day · fleet benchmark · N measured events") via
  new `src/lib/metrics/machine-benchmarks.ts` (6 tests); machine cards show
  the same range on the index.
- **Response SLA** — new `RESPONSE_SLA` claim surfaced on the intake wizard's
  final step and the post-intake confirmation ("Proposal within 1 business
  day"). The intake email was inspected and left unchanged: it is an internal
  sales alert, not a customer confirmation.
- **AI surfaces** — `/llm-info` (structured product facts page) and
  `/llms.txt` (markdown route handler), both generated from the canonical
  modules (tiers, capabilities, claims) so price changes propagate.
- Composer delegation: machine pages, SLA badge, and AI surfaces were built
  by three parallel composer agents from judgment-free briefs; all files
  audited line-by-line afterwards.

## [Ecosystem build · Stage 0 — pricing & packaging foundation] - 2026-08-02

The commercial spine for the ecosystem build (docs/19 findings + Aug 2 pricing
research): a three-tier + bespoke model replacing the undervalued single-anchor
pricing (£12k UK weekend vs Freeman clearing $42–45k/show for an inferior
product).

- `docs/20-pricing-and-packaging.md` — new: evidence trail, tier table
  (Showstopper / Lead Engine / Command / Bespoke with UK/US/EU bands), fencing
  rationale (wrap in every tier; live telemetry as the deliberate Best-tier
  fence), audience-aware display rules, channel price structure
  (rack → organizer wholesale → agency terms → floor), validation plan.
- `src/lib/pricing/tiers.ts` — new code source of truth (mirrors the
  `capabilities.ts` pattern): tier definitions, capability fences, region
  bands in minor units, presentation order (Best first), band formatting,
  add-on eligibility (`isAddOnEligible`). Plus `regions.ts` (ISO country →
  price region resolver) and full test suites for both.
- Deliberate deviation from the master plan: no DB migration in this stage.
  The tier model is code-canonical; `packages.tier` ("standard"/"premium")
  is untouched until Stage 1 maps package rows onto tier slugs — this keeps
  existing quotes, provisioning, and the book-now flow working unchanged.
- `docs/08-pricing-and-quoting-model.md` — superseded pointer: docs/20 owns
  *what* is sold and at what price; docs/08 still owns *how a quote moves*.
- `OWNER-TODO.md` — new "Pricing & packaging" section: band sign-off, tier
  naming, telemetry-fence confirmation, wholesale/agency terms, floor rule,
  validation plan.

## [Market & ecosystem deep-dive research] - 2026-08-02

Documentation-only. Six parallel research passes across ~110 organizations
(trade-show organizers, venues/marketplaces, experiential agencies,
sampling/staffing + digital sampling platforms, direct hire competitors +
hardware/SaaS analogs, event-tech + reseller-enablement tooling), audited
comparatively against Bright.Experience's real flows.

- `docs/19-market-ecosystem-research.md` — the synthesis: confirmed
  whitespace ("measured physical participation" has no incumbent anywhere),
  seven cross-market patterns, a ten-gap whitespace map, a comparative flow
  audit per journey, a messaging/story architecture (network story, three
  role doors, naming), and a 38-item phased build plan with per-item
  evidence, effort, and delegation tags.
- `docs/research/2026-08-market/` — raw per-sector evidence (every claim
  URL-sourced) plus the pre-research internal flow audit baseline.
- `docs/00-documentation-index.md` — indexed the new doc.

---

## [Live audit round 1: hydration fixes] - 2026-08-02

First production audit (139-page crawl as all six personas, Supabase
advisors, Vercel runtime logs) found one bug class: React #418 hydration
mismatches on `/notifications`, `/settings/notifications`, and
`/admin/asset-reviews`.

- Root cause 1: `timeSince()` is wall-clock/timezone dependent, so the
  server (UTC) and browser render different text. New `TimeAgo` client
  component (+tests) renders the server label first and recomputes after
  mount; all twelve render sites swapped.
- Root cause 2: `NotificationTimingForm` read the browser timezone during
  render, so the server's `<option>` list differed from the client's.
  Now resolved in a `useEffect` after mount.
- Ops: `CRON_SECRET` rotated (plaintext copies of generated secrets now
  kept in `~/.bright-experience-secrets`, outside the repo, since Vercel
  stores them as sensitive/unreadable).

---

## [Marketing display font: Clash Display replaces Fraunces] - 2026-08-01

Founder review called the serif too editorial for the cutting-edge
positioning; Clash Display (Fontshare FFL, variable 200–700) won a rendered
shoot-out against Space Grotesk, Unbounded, Cabinet Grotesk, Bricolage
Grotesque, and Panchang.

- `src/lib/fonts/bright-display.ttf` (88 KB variable, 4× smaller than
  Fraunces) with licence file; still `preload: false`, marketing-only.
- Token/class renamed truthfully: `--font-display-serif`/`.text-display-serif`
  → `--font-display-grotesk`/`.text-display-grotesk` (weight 600,
  tracking −0.015em, leading 1.08). NOT `.text-display` — that is the
  portal's Nunito voice and already exists.
- Also fixed leftover dark-theme surfaces rendering as grey slabs on light
  public pages: HowItWorks step cards, GameCard, RefineDrawer footer.

Files changed: `src/lib/fonts/*`, `src/app/globals.css`, eight landing/catalog
components, `docs/09-design-system.md`.

---

## [First live deployment — Vercel + hosted Supabase] - 2026-08-01

The app is live at https://bright-experience.vercel.app for integration
testing (emails, calendar bookings, webhooks).

- Hosted Supabase project `bright-experience` (London) reset to the current
  schema (all migrations through `20260801000003`) and fully seeded: auth
  users, catalogue `seed.sql` (applied via the management API), and the
  programmatic `run-seed.ts` dataset.
- Vercel project `bright-experience` created with all ten production env
  vars. `RESEND_API_KEY` and `NEXT_PUBLIC_CALCOM_LINK` are placeholders
  pending real keys; `CRON_SECRET`, `BRIGHTBLUE_WEBHOOK_SECRET`, and
  `CALCOM_WEBHOOK_SECRET` are freshly generated secrets.
- Supabase auth `site_url`/redirect allow-list now point at the Vercel
  domain; self-signup stays disabled, mirroring `config.toml`.
- `vercel.json`: digest and Pipedrive crons moved from hourly to daily
  (`0 10 * * *` / `0 7 * * *`) — the Vercel Hobby plan caps crons at one run
  per day. Restore hourly on Pro. Runbook updated to match.
- Smoke-tested live: homepage 200, `/api/health` database check green,
  seeded events-lead login lands on the dashboard with real data.

Files changed: `vercel.json`, `docs/ops/deployment-runbook.md`,
`CHANGELOG.md`.

---

## [World-class design build — homepage + portal] - 2026-08-01

Implementation of the market-research findings in `docs/18-design-research.md`
(23 experiential/design/SaaS sites audited). Phases 0–4; full detail per phase
in that doc's Parts 5–7.

**Foundations (Phase 0).** Reduced motion is now honoured everywhere:
`MotionConfig reducedMotion="user"` at the root, duration-variable zeroing in
CSS, and `useReducedMotion()` guards in every `requestAnimationFrame` loop. New
motion tokens (expressive/sheet easings, reveal/hero durations, stagger steps),
the four-step text-grey ramp (`.text-tertiary` / `.text-quaternary`), per-size
tracking utilities, and the `Fraunces` serif display face (public marketing
surfaces only). Shared primitives: `Reveal`/`RevealGroup`/`RevealItem`,
`StatCountUp` (scroll-triggered count-up), `useInViewClass` (mobile
hover-parity), `useStableStatus` (anti-strobe status debounce).

**Homepage (Phase 1).** Serif display voice across all section headlines; hero
rebuilt around real event photography with stat chips; proof numbers stripped
of chrome and scaled to 72–96px with count-up; "Let's plan ___" self-selection
section deep-linking into the quiz (`?type=` pre-seeds step 2); case-study
tiles rebuilt with the staged brand-colour reveal (per-client `brandColor` on
`CLIENT_LOGOS`, hover on desktop / in-view on mobile); numbered mobile nav;
portal preview (a rendered live-dashboard frame, not a screenshot) in the
platform section. `publication_rights` gating on case studies — Costa Coffee
ships anonymised, with the client name scrubbed from title/description; trust
stats reframed to aggregate portfolio numbers.

**Portal (Phases 2–3).** Customer home split into "Over to you" (needs you) vs
"Recent activity" (`getRecentActivityForUser`, non-actionable notifications
only). Geist content rules swept across all tables (em-dash for unknowns,
`tabular-nums`, relative/absolute timestamp rule via `formatTimestamp`, empty
states outside tables, Title Case verb-noun CTAs); customer stage copy
completed; far dates render at month precision (`formatDateByCertainty`). Live
telemetry: threshold-derived status colours debounce over 2 polls
(`useStableStatus`); fleet/machine cards drill down into a filtered live feed.
Customer timeline gained the vertical journey (`EventJourney
variant="vertical"`); pipeline gained fixed saved-view chips (At risk / Waiting
on client / Live this week); tasks gained snooze (`snoozed_until`); annotation
pins gained the open-count badge with resolved pins receding; venue/partner/
organizer dashboards gained KPI count-ups, the grey ramp, spotlight hover, and
the what/why/CTA empty-state taxonomy.

**Creative approvals (Phase 4).** Version-compare slider (draggable/keyboard
reveal line between the two newest artwork versions) in the review queue; plus
the R3 depth pass below (lock-on-approve, reopen, CSV audit export, comment
version binding). Guest review links deliberately deferred pending an
access-token design decision.

---

## [Phase 4 · R3 creative approval depth] - 2026-08-01

- **Lock-on-approve:** `uploadAsset` rejects further uploads when `review_status = approved`; `AssetUploadZone` shows a padlock message; internal `reopenAsset(assetId, reason)` unlocks with audit + customer notification.
- **Mandatory revision feedback:** already enforced server-side in `submitAssetReview` (unchanged).
- **Decision audit export:** `getAssetDecisionLog(eventId)` plus `GET /api/events/:id/approvals/export` CSV (internal + event customer, auth-scoped).
- **Comment version binding:** migration adds `comments.asset_version_id`; new comments stamp the current version; thread UI shows `on vN` chips for older-version comments.

---

## [Remediation build: real Postgres, closed seams, visible failure] - 2026-08-01

The platform had been built and demoed almost entirely against the in-memory
mock, which accepts any password, has no RLS and no PostgREST. That made a class
of defect invisible: policies that never ran, queries Postgres would reject,
errors swallowed into empty arrays. This pass moved development onto local
Postgres and then fixed everything that surfaced.

**Local Postgres is now the default development runtime.** `npm run db:local`
starts Supabase in Docker, applies every migration and seeds users plus data;
`npm run dev:local` points the dev server at it with mock mode off. Both read
their keys back out of the Supabase CLI, so restarting the stack doesn't mean
re-pasting keys. Mock mode is still there for UI work and demos, now confined to
`.env.development` and ignored — with a logged security error — in production
builds.

**The seed pipeline only ever ran against the mock.** `supabase/seed.sql` — the
whole catalogue, locations, venues, benchmarks and the canonical asset checklist
— is disabled in `config.toml` (it references auth users created out of band) and
nothing else applied it, so a local database had none of it and `run-seed.ts`
quietly logged "skipped (table not migrated yet)" for the rows that depended on
it. Seeding is now three ordered steps (auth users → `seed.sql` →
`run-seed.ts`), with `scripts/apply-seed-sql.sh` guarding on an empty catalogue
so it can't double-insert. Applying the file for the first time immediately
found three schema drifts: a venue typed `exhibition_centre` when neither the
check constraint nor `VenueType` has ever had that value, an asset row
referencing an event only `run-seed.ts` created, and a `benchmarks` unique key
that left out `location_tier` and so made the curated tier-specific rows
illegal. The pgTAP fixtures collided with the seed too (unique partner codes and
slugs), so they are now `rls-` scoped and every count assertion is scoped to its
own fixture rows rather than the whole table.

**Seven security holes closed.** Profile bootstrap read role and account from
user-controlled `raw_user_meta_data`, so a self-signup could mint itself an
internal role; it now reads `raw_app_meta_data`, which only the service role can
write. Service-role server actions (invites, provisioning, scheduled exports,
reports, tasks) were exported and callable from the browser without an auth
check. Four storage buckets let any authenticated user read any tenant's files.
`prospect_sessions` and `scheduled_exports` were world-readable through
`using(true)`. The three RLS helper functions had no fixed `search_path`.
`/api/test/**` shipped to production. Password-reset `redirectTo` came from a
client-supplied origin. Every one has a pgTAP case that fails if the policy is
reverted.

**A fix that went too far, caught by the fresh-stack run.** Closing self-signup
set `[auth.email] enable_signup = false` in `config.toml`. That key is the email
*provider* switch (`GOTRUE_EXTERNAL_EMAIL_ENABLED`), not a signup-only one, so it
disabled email/password sign-in — every login this product has. It only surfaced
on a cold `supabase start`, because a running container keeps its old
environment. Self-signup is blocked by the top-level `[auth] enable_signup`
(`GOTRUE_DISABLE_SIGNUP`) on its own; the provider is back on, and the
deployment runbook now says explicitly that the hosted equivalent must stay
enabled. Verified both ways against the local stack: signup returns
`signup_disabled`, password sign-in returns a token.

**Failure is visible now.** 124 sites swallowed query errors into an empty
result; they route through `logQueryError` into Sentry with the entity and user
context needed to debug. Sentry client init moved to `instrumentation-client.ts`
for the current Next runtime, error and loading boundaries cover the organizer
and public capability URLs, `/api/health` reports cron liveness from a
`cron_runs` heartbeat, and `checkRequiredEnv` throws in production over an
expanded required set instead of degrading silently.

**Queries that only worked against the mock.** A missing `count_by_account` RPC,
`.select('id')` against a composite-key table, an upsert with no matching unique
constraint, two `.or()` filters across embedded relations that PostgREST rejects,
unescaped user input in filter strings, and `.in()` lists long enough to blow the
statement limit in the purge and digest crons. A new integration suite runs the
thirty hottest queries as real signed-in personas, so this class of bug can't
come back quietly.

**Wiring that went nowhere.** The approvals stage had no way to create an
approval. Sponsor pitches had no conversion CTA. Event health could be read but
never set. Buyers got no booking confirmation, sponsors no slot-request
notification, partners no application acknowledgement. A won quote could not be
turned into an event without a database write. Pitch links could not be copied or
rotated. All built, all reachable from a real screen.

**Hardening.** Next patched to 16.2.12 and the remaining advisories cleared; CSP
and HSTS with per-route `frame-ancestors` so the venue embed still works;
unspoofable client IP and a Redis-ready rate limiter; `crypto.randomBytes` API
keys; telemetry made idempotent with `external_event_id` and a unique index, and
unknown serials answered 200 so Cloud stops retrying; twelve missing indexes;
estimated counts on the unbounded list pages.

**Accessibility.** Overlays (media lightbox, the three tour screens) share a new
`useModalOverlay` hook: focus moves in on open and back to the trigger on close,
Escape and arrow keys work, focus is trapped, background scroll is locked.
Fourteen unlabelled `<select>` elements named. Sortable table headers are real
buttons with `aria-sort`.

**Cleanup.** 54 dead exports deleted and 41 more un-exported, found with
`scripts/find-dead-exports.mjs` (kept, so the next pass is a command not an
archaeology dig). The public partner form offered a "referral" tier the database
constraint rejected — added to the constraint, and the public schema tightened so
nobody can self-register as a venue or organizer.

Ten migrations, `20260728000000_profile_bootstrap_app_metadata.sql` through
`20260801000000_partner_referral_type.sql`. Gate at the end of the pass, all
against a freshly reset local stack: lint and `tsc --noEmit` clean, 1,858 unit
tests, 215 pgTAP assertions across 33 policy files, 58 integration checks.

---

## [World-class organizer machine experience] - 2026-07-27

An organizer opening a unit at a show four months out got four zeroed counters,
"No activity yet", "Nothing configured yet" and "Not sold to a sponsor". The
portal only worked on the two days a year a show was open. Meanwhile the system
already stored — and never showed them — machine photos and specifications,
performance benchmarks with a p25–p75 spread and sample size, install and
collection dates, config QA status, and case studies with hard numbers.

**Machine detail is now pre-show mission control.**

- **Readiness checklist** (`lib/metrics/unit-readiness.ts`, `show-readiness.ts`)
  — zone, mission, game config + QA, stock, sponsor, artwork. Every item says
  what is true right now, who owns it (the organizer or us), and links to where
  it gets fixed. `optional` items — a screen-only unit's stock, artwork for a
  unit nobody has bought — still render but don't count against progress, so a
  prepared unit reads 100%. One derivation feeds the machine page, the show
  board and the portfolio card, so they can't disagree.
- **Unit passport + site requirements** — the machine's own catalogue record,
  plus footprint, weight, power, connectivity and clearance from five new
  columns on `machines`, and a **printable spec sheet** at
  `…/machines/:id/spec` headed with the show, stand and dates. Every venue asks
  for this weeks before move-in; it used to be an email to us and a wait.
- **Key dates** — install, doors, close, collection, each with a countdown.
  Stored on `events` since the beginning, never shown.
- **Setup story** replaces "No activity yet" with what has actually happened to
  the unit: allocated, placed, game built, sold, artwork in.
- **Expected performance** from `benchmarks`, matched on event and machine type.
  Always a range with its sample size, and absent entirely when nothing
  comparable exists — a single confident number is a complaint waiting for the
  show to end.

**Sponsor pitch page is now a sales kit.** The pre-show branch was a date and
"price on request". It now carries the machine's photo and specification, the
expected-performance range, what the slot includes (one exported constant, so
the pitch and the organizer's rate card can't drift), and a case-study strip
built only from studies carrying a hard stat.

**Show page leads with the run-up** — countdown badge, key dates strip, and a
readiness board naming what each unit needs. **Sponsors page is a rate card** —
grouped by show, ordered by days to doors, with unsold slots inside the
three-week selling window flagged (`lib/metrics/sponsor-book.ts`). **Portfolio
cards** for upcoming shows read "X of Y ready" and a countdown instead of
"Plays today 0", and "No machines assigned yet" now names who allocates hardware
and what changes when they do.

Deliberately not built: the delivery team's task list is not surfaced to
organizers. An organizer hosting a brand's activation has no business reading
that brand's internal delivery plan, and RLS already reflects that — so the
run-up is derived from the machines, configurations and slots they own.

Migrations: `20260727000003_machine_site_requirements.sql` (five columns on
`machines`; the seeded values are **indicative placeholders**, flagged as such
on every surface — see `OWNER-TODO.md`), `20260727000004_organizer_asset_reads.sql`
(organizers read `customer_visible` assets on their own shows, which is what the
creative picker and the artwork readiness row need). New pgTAP case in
`rls_organizers.test.sql`. Mock data for the November show now demonstrates all
of it: a fully prepared unit, one mid-setup, one bare, approved and in-review
artwork, and a sold and an open slot.

---

## [Organizer onboarding console] - 2026-07-27

The organizer portal was complete but unreachable: no screen anywhere created an
organizer, gave their people a login, put a show under them, or deployed hardware
to that show. All four were database rows written by hand, so onboarding a real
organizer needed an engineer. This closes that — the only true blocker to a
pilot.

- **`/admin/organizers`** — every organizer with team / show / machine counts,
  each card naming the first thing still missing in the order it blocks them:
  nobody can log in → no shows linked → no machines deployed. Create an
  organizer from a name plus optional contact; slug and partner code are minted
  (`lib/partner-identity.ts`, shared with the public application form) and the
  record is `active` immediately, because an admin typing the name *is* the
  approval.
- **`/admin/organizers/:id`** — the setup console, in blocking order:
  - **Access** — magic-link invite writing both rows the portal checks: a
    `profiles` row with `partner_admin` (can sell and deploy) or
    `partner_member` (view only), and the `partner_users` membership
    `requireOrganizerContext` reads. Someone already on the platform keeps their
    login and just gains the membership.
  - **Shows** — link an unclaimed show, or unlink (confirmed in place). A show
    held by another organizer must be unlinked there first, so sponsor inventory
    never changes hands on a dropdown.
  - **Fleet per show** — register a serial straight onto the show, or deploy a
    unit already free. Releasing clears zone and mission so they don't follow the
    unit to its next show, and is refused while a sponsor slot points at it —
    the row names the buyer instead of offering a button that would fail.
- **Hardware guards** — units sited on the venue estate (holding an active or
  planned `placements` row) are excluded from the free-machine picker and
  refused by `assignMachineToShow`: they're earning media revenue where they
  stand. Retired units and units at another show are refused too.
- **Nav** — Organizers joins the Commercial section and the command palette.
- **`revalidatePath("/organizers", "layout")`** on every setup write, since the
  organizer's own pages sit under a dynamic slug that a path-scoped call misses.

All six actions are `events_lead`/`admin` only and write through the session
client (`is_internal_user()` policies already permit it) — no new migration, no
new service-role path. Verified end to end in a browser: create → invite → link
→ deploy → release → redeploy, then signing in as the invited person and
reaching their own portal, plus cross-tenant and non-admin refusals.

---

## [Organizer portal — depth pass] - 2026-07-27

The first cut of the organizer portal was too thin to demo: a unit on the fleet
board was a dead row, the portfolio page was two title cards, and a show that
opened in December reported its warehoused machines as offline. This pass makes
every unit openable and every page carry the numbers the reader came for.

- **Machine detail page**
  (`/organizers/:slug/shows/:eventId/machines/:machineId`) — per-unit counters
  and activity feed, zone + mission editing, the resolved configuration it will
  run (read-only, game resolved to its name), and the sponsor holding it.
  Reached from the fleet board, the attention list, the fleet tab, and the
  sponsor rows. Authorization is the event scope: a machine id belonging to
  another producer's show 404s.
- **Deployment editing** — `MachineDeploymentForm` writes zone and mission
  through `updateMachineDeployment`, with quick picks for zones already in use
  so a fleet doesn't end up with "Hall 3", "hall 3" and "Hall Three".
  Organizers may read but not write `game_configurations` /
  `product_configurations` (`20260727000002_organizer_machine_reads.sql`);
  `machine_instances` stays read-only to them, with the action as the narrow
  door that writes exactly two columns.
- **Slot creation and reassignment in the portal** — `NewShowSlotForm` opens a
  unit as inventory from the show page; naming a sponsor reserves the slot,
  leaving it blank lists it for sale. `SlotMachineSelect` moves a slot between
  units. Both use a native `<select>` styled to match shadcn, so the control
  opens the OS picker on a phone.
- **Portfolio page rebuilt** — totals across every show (hardware, units still
  needing a zone or a job, sponsorship sold and left) plus a card per show
  carrying machines, zones, sold value, and today's plays and leads, with one
  line naming anything that needs the organizer.
- **Fleet tab** (`/organizers/:slug/fleet`) — every unit across every show,
  grouped by show, flagging units still to set up.
- **Live vs prep modes** — surfaces judge a show on its dates
  (`showRunState`). While it's open they poll; before it opens they report
  readiness instead of signal, name what each unit is missing, and drop the
  zeroed counters (`FleetBoard mode="prep"`).
- **Shared telemetry labels** — `src/lib/metrics/feed-labels.ts` so the
  event-wide feed and a per-machine feed describe the same event identically;
  relative timestamps no longer read "-7315s ago" when a machine's clock runs
  ahead.

Migration: `20260727000002_organizer_machine_reads.sql`. New pure modules:
`lib/metrics/organizer-portfolio.ts`, `lib/metrics/feed-labels.ts`,
`lib/configuration/config-labels.ts`, plus `machinesNeedingSetup` /
`setupGapLabel` in `lib/metrics/fleet.ts` — all with tests.

---

## [Organizer Show Command] - 2026-07-26

Turned a multi-machine conference into a first-class scenario: a show producer
(Informa-style) hosting several units doing different jobs, selling some of them
to sponsors, and never seeing the leads those units capture.

- **Organizer portal** (`/organizers/:slug/*`) — shows list, Show Command
  (live fleet by zone + sponsor inventory), and a portfolio-wide sponsors tab.
  `partners.type` now accepts `organizer`; `events.organizer_partner_id` links a
  show to its producer; home routing sends organizer users to their portal.
- **Per-machine configuration** — `game_configurations` /
  `product_configurations` moved from one row per event to a show-wide default
  plus optional per-machine overrides (`machine_instance_id`, uniqueness via an
  expression index, read-then-write instead of `upsert`). New `FleetConfigTabs`
  scope switcher; resolution logic in `src/lib/configuration/resolve-config.ts`.
- **Machine payload v2** — `EventConfigPayload` gains `machines[]`, each entry
  fully resolved so the machine stack never implements inheritance, plus
  `capture_method` (`form` / `badge_scan` / `both`). v1 consumers keep working.
- **Per-machine live metrics** — `/api/events/:id/live` returns a per-machine
  breakdown and zone grouping (`src/lib/metrics/fleet.ts`); new `FleetBoard`
  leads with the units needing attention rather than the totals.
- **Sponsor storefront** — show-scoped `sponsorship_slots` (event + machine),
  creative attached from the show's own asset library, and a public
  `/sponsor/:token` page that reads as a pitch before the show and proof of
  performance after. Tokens expire (30 days by default), rotate, and revoke;
  `noindex` at both the metadata and header layer; aggregate counters only.
- **Per-sponsor proof in reports** — `generateEventReport` writes a `sponsors`
  block (each sponsor's own machine over their own dates), rendered by
  `SponsorProofTable`.
- **Privacy line enforced in the database** — organizers read their shows,
  fleet, slots, and aggregate telemetry but not `leads`
  (`supabase/tests/rls_organizers.test.sql`, 9 assertions).
- **Docs + demo** — badge-scan and v2 config contracts in `docs/10`, organizer
  audience in `docs/17`, routes in `docs/05`, schema notes in `docs/04`; mock
  dataset gains a live five-machine show and an organizer login (Nadia Okafor).
- **Deferred pending validation:** rebook-reward as a first-class flow and
  revenue-share statements.

Migrations: `20260727000000_organizer_shows.sql`,
`20260727000001_per_machine_config.sql`.

---

## [Comprehensive documentation suite] - 2026-07-25

Restructured the documentation into a verified, role-routed suite. No product
code changed; this is a documentation-only pass that corrects drift and fills
gaps found in a full read-only audit.

- **New canonical index** `docs/00-documentation-index.md` routes readers by
  role and lists every document with its source of truth.
- **New `SETUP.md`** with three tested paths: mock-mode demo (no accounts),
  local Supabase, and hosted Supabase.
- **New reference docs:** `docs/14-codebase-map.md` (structure/tooling/
  inventories), `docs/15-system-architecture.md` (diagrams + data flows),
  `docs/16-api-and-actions-reference.md` (route handlers + server actions),
  `docs/17-feature-reference.md` (role-based feature catalogue).
- **New operations suite** under `docs/ops/`: deployment runbook, integration
  activation, monitoring/security/DR, and maintenance/troubleshooting.
- **Corrected drift** across `README.md`, `docs/04-data-model.md`,
  `docs/05-information-architecture.md`, `docs/08-pricing-and-quoting-model.md`,
  `docs/10-integrations.md`, `docs/11-cloud-handoff.md`,
  `docs/01`/`02`/`03`, and `docs/testing.md`: five crons (not three), hourly
  per-recipient digest (not fixed 17:00 UTC), 59 migrations, current Sentry
  env vars, current `Quote`/`Asset`/`StudioRequest` fields,
  `notification_user_settings`, webhook `leads.source`, Pipedrive
  `custom_field_update`, removal of the retired `developer` role and
  nonexistent `/internal/*` routes, and the no-Realtime (polling) reality.

---

## [Capture quality, retention, live stock + machine config sync] - 2026-07-24

Built the portal side of every client-committed feature from the Adyen call
(P2.1–P2.4) plus the machine config-sync contract (P1.2) from
`docs/13-dev-handover-priorities.md`.

- **Capture-quality settings (P2.1)** — new "Capture quality" section in the
  event configuration form (`CaptureQualitySection`): business-emails-only
  toggle with an editable blocked-domain list (starter list in
  `src/lib/capture-rules.ts`), duplicate-entry blocking, GDPR consent
  checkbox with templated copy (`{brand}` / `{event}` tokens). Stored in
  `game_configurations.capture_rules_json` (migration `20260724000000`) with
  a Zod layer (`src/lib/validations/game-config.ts`). Leads now carry
  `consented_at`, stamped by the `lead.captured` webhook.
- **Lead retention purge (P2.4)** — `game_configurations.retention_days`
  (default 60, per Marta's recommendation) + a daily `/api/cron/purge-leads`
  cron that hard-deletes expired leads (per-event windows + a default sweep)
  and logs each purge. Retention policy footer (`RetentionNotice`) on the
  internal reports page and the public share view.
- **Live stock + reload estimate (P2.2)** — `event_metrics_snapshot` gained
  `stock_remaining` / `stock_capacity` (migration `20260724000002`),
  recomputed on every telemetry ingest. The live dashboard shows a stock bar
  with an "empty in ~X min at current pace" estimate, and a new
  `machine.stock_low` notification pings the ops lead when stock first
  crosses 15%.
- **Capture-quality proof on reports (P2.1)** — report generation counts
  `capture_rejected_domain` / `capture_duplicate_blocked` telemetry into a
  "Capture quality" card (`CaptureQualityCard`) on internal + public reports.
- **Branded landing page upsell (P2.3)** — new `branded-landing-page`
  capability (placeholder price, see `OWNER-TODO.md`) + a delivery toggle in
  the configuration form, carried on the config payload.
- **Machine config-sync contract (P1.2, portal side)** — versioned
  `EventConfigPayload` assembler (`src/lib/brightblue/config-payload.ts`) and
  `pushEventConfig` (`PUT /events/:id/config`) in the Cloud client; submitting
  the configuration fire-and-forgets the push (logged + skipped until Cloud
  creds are set). Contract documented in `docs/10-integrations.md` §1b.
- **`OWNER-TODO.md`** (new, root) — Tim's post-build action list (pricing,
  legal review of consent copy, Marta follow-ups, go-live account setup).
- Docs updated: `04-data-model.md`, `10-integrations.md`,
  `11-cloud-handoff.md`, `13-dev-handover-priorities.md` (shipped statuses).

---

## [Dev handover priorities doc + maintenance rule] - 2026-07-24

Turned the "what does the dev team build first" question into a maintained
artefact, driven by client feedback from the Adyen demo call (23 Jul 2026).

- **`docs/13-dev-handover-priorities.md`** (new) — the prioritized worklist
  for the incoming dev team: P0 activation wiring (Supabase, Resend, Cal.com,
  Cloud webhooks, crons, Sentry, auto-provision, Pipedrive), P1 integration
  builds (Cloud event-ID assignment push, machine config sync contract,
  distributed rate-limit store, upload AV), P2 client-committed features
  (capture-quality bundle: business-email enforcement + duplicate prevention
  + GDPR consent; live stock + reload estimate; branded capture landing page
  upsell; 60-day lead retention), P3 explicit deferrals (badge scanning,
  Salesforce/Marketo), and a full-system security checklist with per-item
  status (auth, RLS, webhooks, uploads, GDPR, secrets, hardening).
- **`.cursor/rules/handover-documentation.mdc`** — new standing rule: any
  change that completes a listed item, adds an integration point / env var /
  stub, or introduces a security consideration must update the priorities doc
  in the same change.
- **`HANDOFF.md`** — docs map and "Stubs and integrations" section now point
  at the new doc as the "start here" for build priorities.

---

## [Brief echo + confirmation screen upgrade] - 2026-07-21

Made the quiz → intake → confirmation flow visibly prove "we were listening",
and rebuilt the confirmation screen to sell the walkthrough call.

- **`src/lib/brief-echo.ts`** (new, tested) — turns raw quiz/intake answers
  into human echo lines (`The moment · Your goal · Where · When · The crowd ·
  On site`). Shared by both surfaces below.
- **Intake wizard** — a new "Already noted from your quiz" chip strip above
  the steps plays back everything carried over (event type, goal, venue,
  timeline, attendees…), so skipped questions read as attentiveness instead of
  silence.
- **`PostIntakeCard` rebuilt** — headline is now "{first name}, your proposal
  is already taking shape."; a "What you told us" panel plays the customer's
  brief back; and the AE card now carries a three-point call agenda (brand on
  the machine, projected reach, exact investment live). Projected-reach
  figures stay off this page — they're revealed on the walkthrough. New
  `PostIntakeCard.test.tsx`.
- **Fixed "Timwill"** — the AE intro sentence is now built in a single template
  string so JSX whitespace trimming can never eat the space between the name
  and the verb (regression-tested).

---

## [Cal.com booking + indicative pricing] - 2026-07-21

Unified the walkthrough booking flow around Cal.com and softened the pricing
black-box on the pre-call proposal.

- **Indicative price band** (`src/lib/proposals/price-band.ts`, new) — the
  gated Investment section now shows "Activations like this typically run
  £X–£Y" (fee −10% / +15%, snapped to round money) before the walkthrough,
  so serious buyers can budget-check without the exact figure. Exact price and
  Accept/Decline still land after the call. Band travels on
  `ProposalDocument.investment.indicativeBand`; hidden when the AE hasn't
  priced the quote yet.
- **Booked-call-aware email** — `sendProposalReadyEmail` now takes
  `scheduledSlotLabel`; when the customer already booked on the confirmation
  screen, the email confirms the call ("You're booked for Thu 2 Jul · 2:00 PM")
  with a reschedule link instead of redundantly asking them to book.
  `prepareProposal` reads `walkthrough_scheduled_at` / `walkthrough_slot_label`
  to decide.
- **Cal.com inline embed** (`src/components/quotes/WalkthroughScheduler.tsx`,
  new; `@calcom/embed-react` dependency) — when `NEXT_PUBLIC_CALCOM_LINK` is
  set, the confirmation screen renders the real Cal.com booker inline with the
  customer prefilled and the quote id as booking metadata. AEs connect their
  Google Calendar inside Cal.com for native availability + calendar sync. When
  unset, the existing preset slot picker (`WalkthroughBooker`) renders, so
  demos keep working.
- **Cal.com inbound webhook** (`src/app/api/webhooks/calcom/route.ts`, new) —
  HMAC-verified (`X-Cal-Signature-256`, `CALCOM_WEBHOOK_SECRET`).
  `BOOKING_CREATED`/`BOOKING_RESCHEDULED` write the slot onto the quote and
  ping the event lead; `BOOKING_CANCELLED` clears it; `MEETING_ENDED` sets
  `walkthrough_completed_at`, auto-revealing pricing on the proposal page.
- **Shared link resolution** (`src/lib/calcom.ts`, new) — the proposal page and
  proposal email now derive the walkthrough URL from one helper
  (per-quote override → configured Cal.com link → fallback).
- Tests: `price-band.test.ts`, `calcom.test.ts`, `WalkthroughScheduler.test.tsx`,
  `webhooks/calcom/route.test.ts`, plus new `prepareProposal` branches in
  `quotes.test.ts`. Docs: `docs/10-integrations.md` §3b, `.env.example`.

---

## [Proposal + email copy pass] - 2026-07-20

Rewrote the customer-facing proposal and delivery email so they read like a
person wrote them, not a template.

- Removed every em dash from the proposal document and the customer email;
  reworked sentences so they stand on their own.
- Tightened the narrative throughout `src/lib/proposals/build-proposal.ts`
  (brief, solution, creative, data, timeline, next steps) for a clearer, more
  professional voice.
- The "Tailored to your brief" add-on lines now pair each outcome with a short
  reason drawn from the brief, instead of restating the mechanism.
- Copy-only change: no data model, routing, or component structure changed.

---

## [Proposal delivery email] - 2026-07-20

Closed the gap where sending a proposal notified nobody on the customer side.

- **`sendProposalReadyEmail`** (new — `src/lib/email.ts`) delivers a branded email
  to the customer's `contact_email` with a "View your proposal" CTA to
  `/proposal/[id]` and a "Book your 15-minute walkthrough" link. It never quotes a
  figure, matching the page's rule that pricing stays hidden until the walkthrough
  is marked complete.
- **`prepareProposal`** (`src/app/actions/quotes/proposal-admin.ts`) now sends that
  email when an AE hits "Send Proposal" and the status flips to `proposal_sent`.
  It's fire-and-forget: a mail failure never fails the send, and no email goes out
  when the quote has no contact email.
- Tests: two new `prepareProposal` cases (customer email fires on success; no
  email without a contact address) — `src/app/actions/quotes.test.ts`.
- Docs: `docs/10-integrations.md` now distinguishes the Resend dispatch fan-out
  (portal users) from direct transactional sends (addressed by email).

---

## [Customer view clarity pass] - 2026-07-20

Reorganised the customer's home and event overview around one guiding
principle: answer four questions once each, top to bottom — where's my event,
what's on me, what's the journey, and the proof/details. The two surfaces now
share a single body so home mirrors the overview exactly. Internal views are
untouched (protected by the existing `isInternal` branch). Verified in-browser
as the customer.

### One fused action block (#1, #7, #8)
- **`OverToYou`** (new, tested) replaces the competing "big next-step CTA", the
  "Needs you" KPI, and the action list. The single most important task is the
  loud primary row with the cobalt CTA; the rest are quiet supporting rows.
- **Every item carries a plain "why it matters" line** via the new pure helper
  `actionWhyLine` (`src/lib/customer-action-copy.ts`, unit-tested) — e.g. an
  asset upload reads "So the studio can build your creative."
- **Forward-looking "all clear" state** — when nothing's outstanding it
  reassures and previews the customer's next milestone (`nextCustomerMilestone`
  in `src/lib/journey.ts`, tested) so a quiet moment never reads as
  "finished forever".

### One status line, one timeline (#2, #3, #5, #6)
- **`customerStatusLine`** (`src/lib/customer-copy.ts`, tested) composes one calm
  hero subtitle — "You're booked in · Live in 12 days at ExCeL London" — used on
  both home and overview. The stage badge is dropped from the customer hero
  (stage now lives in the line).
- **`EventJourney` gains `variant="steps"`** — a clean horizontal four-node bar
  with a single "Your move" cue under the current phase and a "See full
  timeline" link. The `"full"` variant is restyled **ownership-forward**: the
  customer's own milestones render bold/cobalt with a person icon; ours recede.
  The legacy `"mini"` variant and the "Phase N of 4" framing are removed.

### One shared body, quiet lower zone (#4, #6, #9)
- **`CustomerEventBody`** (new, tested) is the single-column body shared by the
  event overview and the home featured event: `OverToYou` → journey steps →
  your team → quiet disclosures.
- **`CollapsibleSection`** (new `<details>`-based disclosure, tested) hides the
  secondary detail — "Event details" and, on the overview only, "The numbers"
  (days to event, pending actions, approvals pending, missed milestones) — so
  the KPI grid and right rail no longer compete with the action block.
- Removed the now-superseded `HomeNextStep` and `TeamColumn` components.

---

## [Stage-aware soft-lock for submitted briefs & logistics] - 2026-07-17

Customers can now safely revise information they've already submitted, without
blindsiding the delivery team who may have planned against it. Edits stay open
early and become an acknowledged **change request** once the plan is locked for
build. 1,008 tests passing; verified in-browser as the customer.

- **New stage helper** `isStageAtOrAfter(stage, threshold)` in `src/lib/journey.ts` (unit-tested) — single source of truth for stage-gated behaviour.
- **Soft-lock model** on both briefing forms (`OpsBriefingForm`, `BriefingForm`):
  - **Before the plan locks** — a submitted brief stays editable. The submit button becomes **"Update details" / "Update brief"**, a banner explains the brief is submitted but still editable, and saving re-notifies the internal team.
  - **After the plan locks** — the brief is read-only and shows a `RequestChangePanel` instead of a dead-end wall. Ops locks at `logistics_confirmed`; creative locks at `build_configuration`.
- **`requestBriefingChange` server action** (`src/app/actions/briefing.ts`, tested) posts a clearly-labelled, customer-visible message to the event thread and notifies the right internal owner (ops for logistics, studio for creative) via the existing `sendMessage` dispatch — no silent overwrites.
- **`RequestChangePanel`** (new client component, tested) — collapsible "Request a change" affordance with confirmation state.
- **Logistics page consistency** — the customer delivery-windows, venue-access, and onsite-contact cards now gate their edit controls on the same lock and surface the change-request panel once locked, so the free-text brief and the structured logistics fields behave identically.

---

## [Unified Journey Redesign — one project, role-filtered actions] - 2026-07-17

Gave every role the same **journey spine** — four phases (Create → Prepare →
Event day → Results) derived from the ten internal stages — while decluttering
each surface to one clear flow, reconciling every workload number to a single
truth, and closing all 12 findings in the July UX audit (`docs/12-ux-simplification-audit.md`). Verified in-browser end to end; 999 tests passing.

### One number for customer workload (C1)
- **Asset deadlines group under their umbrella task** — `getCustomerActionItems` and `getDeadlinesByEvent` (`src/lib/queries/deadlines.ts`) fold individual asset slots beneath the open "Upload brand assets" task via new pure helpers `groupCustomerActionAssets` / `groupDeadlineAssets` (unit-tested). Home "Needs you", the event overview, and the tasks hero all read the same grouped list, so the count matches on every surface.
- **Fixed a latent count bug** — the asset query chained `.in("status",["required"]).or("review_status…")`, which *AND*'d the conditions and silently hid every required asset from the customer's action count (0 shown while the hero said "5 required"). Now a single OR, so the numbers reconcile.
- `DeadlineTimeline` renders grouped rows with an expandable file list.

### Shared journey spine (C)
- **`src/lib/journey.ts`** (new, tested) maps the 10 stages to the 4 customer phases (`phaseForStage`, `buildJourney`, `phaseHeadline`).
- **`EventJourney`** (new) renders the spine in a full variant (phases + milestone chips with owner "You" / "Bright.Blue" and dates) and a mini variant, used on the customer home, event overview, and timeline.

### Navigation, fully visible and stage-aware (C2, I1)
- **Customer nav** is a two-line, never-scroll phase bar (`CustomerPhaseNav` in `EventTabNav`) — four phases always visible, current phase expanded inline, future phases in a quiet stage-aware "upcoming" state (new `currentStage` prop). Discovery of Live/Leads/Reports is solved without noise.
- **Deadlines folded into Tasks for customers** — removed from `CUSTOMER_SECTIONS`/`CUSTOMER_PHASES`; `/deadlines` customer links redirect to `/timeline`/`/actions`; the tasks page gains a "by due date" view.
- **Internal nav clustered** — 19 flat pills grouped into labelled clusters (`INTERNAL_NAV_CLUSTERS` / `internalNavGroups`) that wrap instead of scroll; completed the stale `SECTION_TO_SLUG` map.

### Truth fixes (C3, C4, C5, V1)
- **Stage grammar** — customer home/hero/timeline no longer prepend "Currently at/in"; the label stands as its own sentence.
- **Phase framing** — customer KPIs read "Phase 1 of 4" instead of the internal "Stage 1/10".
- **Date format** — the home next-step hint uses `formatDateShort` ("Due 24 Jul"); no raw ISO on customer surfaces.
- **Venue role badge** — `UserMenu` takes a `roleLabel` override; venue pages pass `venueRoleLabel(user.role)` so the chip reads "Venue admin" / "Venue".

### Page recomposition & polish (E, F, C6, I2, P1, V2, V3)
- Customer overview and home recomposed around the spine (journey → what needs you now → what's coming → details); the redundant `ProgressColumn` was removed.
- **V2** venue open-slots grouped into one summary card; **V3** venue eyebrow shows the venue name; **P1** partner queue splits action items from FYI; **I2** naming pass across Inbox / Tasks / home focus list.

### Evergreen demo dates (H)
- The mock dataset is now **date-relative**: `src/lib/supabase/mock/shift-dates.ts` (new, tested) slides every date in `dataset.ts` + `extra.ts` by `(today − 2026-06-18)` at load (`store.ts`), preserving all cross-row relationships. Upcoming events stay upcoming, completed events stay recent, and the "wall of overdue" never returns.

---

## [World-class UX polish — optimistic UI, live motion, power-user chrome] - 2026-07-13

Ranked perceived-quality build: every high-frequency interaction updates the screen instantly and reconciles with the server in the background, the live dashboard visibly breathes, and keyboard users get first-class chrome. Verified in-browser end to end; 977 tests passing.

### Tier 1 — Feels instant
- **Optimistic task complete/skip with Undo** — `TaskChecklist` flips a task into its new group via `useOptimistic` before the server action resolves and reverts (with an error toast) on failure. Success toasts carry an **Undo** action backed by the new `reopenTask` server action (`src/app/actions/tasks.ts`), which restores a completed/skipped task to `pending`/`in_progress`, clears completion metadata, audits a `task_reopened` entry, and enforces that only internal roles reopen internal tasks. New `tasks.test.ts` + `TaskChecklist.test.tsx` cover the action branches and the optimistic flip/revert/undo flows.
- **Instant notification mark-read** — `NotificationList` dims and re-buckets a notification on click via `useOptimistic`; the server call follows.
- **Optimistic approvals** — `ApprovalActions` applies the decision (and fires approval confetti) immediately, reverting with an error toast if `decideApproval` fails.
- **Instant message + comment send** — `MessageThread` and `AssetCommentThread` append the new entry (with a "Sending…" state) and clear the composer immediately; a failed send restores the draft text.
- **`useProgressToast`** accepts an optional action (used for Undo) and extends toast duration so it can be clicked.

### Tier 2 — The live dashboard breathes
- **Session deltas + value pulses** — `LiveCounter` shows "+N since you opened" against a mount-time baseline and pulses brand-blue when a value ticks up (`live-value-pulse` keyframes in `globals.css`).
- **Relative freshness** — `LiveDashboardClient` replaces the static clock time with a ticking "Updated Xs ago" label and announces totals through a polite `aria-live` region.
- **Feed + status motion** — new items slide into `LiveFeed` (`feed-item-in`), and `MachineStatusCard` rings its badge on a status change (`status-pulse`). All animations are neutralised by the global reduced-motion block.

### Tier 3 — Power-user chrome
- **Global G-shortcuts** — `G then E` (home), `G then N` (notifications), `G then I` (inbox, internal only) from anywhere outside a text field, with a 1.5s sequence window.
- **`?` shortcuts overlay** — a dialog listing every shortcut, opened from any page.
- **Command palette upgrades** — a **Recent** group persisting the last five destinations to `localStorage` (new `src/lib/palette-recents.ts` + test) and role-scoped **Quick actions** (create event, invite customer/teammate). New `CommandPalette.test.tsx` covers sequences, input guards, and the overlay.

### Tier 4 — Perceived speed + finish
- **Streaming event overview** — `/events/[id]` renders the hero shell immediately and streams the heavy content behind `Suspense` with a shaped skeleton; the root `loading.tsx` swaps the spinner for a dashboard-shaped skeleton.
- **Numeric discipline** — `tabular-nums` + right alignment across money/metric columns (`PartnerPipelineTable`, `PartnerDetailView` attributions, `CommissionTracker`).
- **Skip to content** — a focus-revealed link in the root layout targeting `#main-content` in `EditionBody` and `PublicSiteChrome`.

---

## [Next 10 — security seams, Cloud handoff loop, schema debt] - 2026-07-13

Ranked fix-and-finish build: close the three open security seams, make the Bright.Blue Cloud integration provable end-to-end, clear the promised schema debt, and bring the handoff docs back to truth.

### Tier 1 — Security
- **Rate limiter fully wired** — `applyAsPartner` (new `applicationLimiter`) and the public proposal-page mutations `acceptQuote` / `declineQuote` / `bookWalkthrough` / `updateQuoteCapabilities` (new `decisionLimiter`) now throttle by caller IP; login/reset and quote intake/booking were already guarded. New `src/lib/rate-limit.test.ts` plus burst tests in the partners + quotes action suites.
- **RLS hardening** — `20260713000000_rls_qa_reports_hardening.sql`: customers can no longer SELECT `qa_items` (internal-only tool) or unpublished `event_reports` at the DB level. New pgTAP file `rls_qa_items.test.sql`; `rls_reports.sql` updated (6 assertions). Full RLS suite: 122 passing.
- **Auth callback pinned** — new `src/lib/auth/safe-redirect.ts` (+ tests): redirects pin to `NEXT_PUBLIC_SITE_URL` (request-origin fallback only in dev/preview) and `next` is restricted to same-site relative paths, closing the open-redirect seam from STUBS Phase 0.

### Tier 2 — Bright.Blue Cloud handoff loop
- **Webhook simulator** — `scripts/simulate-cloud-webhook.ts` HMAC-signs and POSTs realistic payloads for all four event types (`telemetry.batch`, `lead.captured`, `machine.heartbeat`, `report.ready`) at any URL; verified against local dev (4× HTTP 200 ingested, bad signature → 401).
- **Middleware exemption** — `/api/webhooks/*` and `/api/cron/*` added to the public prefix list; the session gate was 307-redirecting signed machine-to-machine calls to `/login` and silently dropping them.
- **Event-ID mapping contract** — new `docs/10-integrations.md` §1c: how Cloud learns the portal event UUID (join keys, recommended push-on-assignment flow, resolve-on-ingest alternative, open CTO decision).
- **Live poll route** was already Cloud-first with local fallback (`getLiveSnapshot` → DB aggregation) — verified, no change needed.

### Tier 3 — Schema debt
- **Legacy `quotes` columns dropped** — `20260713000001`: `footfall_estimate`, `location_postcode`, `dates_start/end`, `valid_until`, `budget_indication` (the reconcile migration's promised follow-up). Last code touches removed (`prepareProposal` `valid_until` write, quote-list `location_postcode` select, seed/mock rows).
- **`machine_instances.current_placement_id` FK + index** — `20260713000002`; also widens the `telemetry_events.event_type` allow-list to the vocabulary the webhook/UI already handle (`interaction`, `screen_touch`, `survey_completed`, `linkedin_follow`, `qr_scan`).
- **Duplicate migration version fixed** — `rls_workstream_tables` renamed `20260529000001` → `20260529000002` (it shared a version with `notification_digest_timing`, breaking `supabase db reset` on fresh clones). Full `db reset` now proves the 56-migration chain.

### Tier 4 — Polish & doc truth
- **Booking confirmation copy pass** — concrete, dated next steps (dates confirmed within one working day → portal invite → build kickoff) and a keep-your-reference note.
- **Handoff docs refreshed** — `docs/11-cloud-handoff.md` Part E items 1/2/6/7/8 struck as resolved (with fixing migrations), Part F counts + rate-limiter status corrected, D6 `VenuePackageBuilder` marked wired; `STUBS-TO-REPLACE.md` auth-callback, booking-copy, and QA/reports-RLS rows struck, new "Security & Cloud-handoff pass" section lists the two remaining stubs (distributed rate-limit store, Cloud assignment push).

---

## [World-class merged homepage] - 2026-07-10

One canonical marketing homepage at `/` merging the bright.blue/events story with the portal catalog; `/catalog` slimmed to a browse index. Fixes the sales-psychology audit findings: proof hierarchy, hedged claims, broken case-study visuals, CTA payoff.

### New
- **`src/lib/marketing/claims.ts` (+ test)** — single source of truth for every marketing number and quote: hero stat pills (92% rebook first), three hard-number trust stats (GDPR demoted to a caption), both full Storyblok + Adyen testimonials, honest scarcity line, quiz CTA payoff copy.
- **`src/components/public/landing/`** — homepage split into focused sections: `HeroSection` (proof-led headline "Crowd-stopping activations. Measured to the play.", widened subhead beyond exhibitions, payoff microcopy under the CTA), `PillarsSection`, `MachinesShowcase` (top-3 machines with real brand photos, anchors the hero's "Explore the machines"), `ProofSection` (case-study row + hard-stat tiles + dual testimonials), `PlatformSection` (capability tiles + Payments/Ads/Age-Verification/Telemetry/Analytics chips + Cloud live band, reordered below proof), `FinalCta` (quiz payoff + "Talk to us" → /proposal + scarcity line).
- **`logoForClient` in `client-logos.ts` (+ test)** — photo-less case studies now render the client's logo on a brand gradient instead of a grey "CS" monogram; seeds carry drop-path comments for real photography (`/catalog/case-studies/<slug>/01-hero.jpg`).

### Changed
- **`PublicLanding`** rebuilt as a thin composer fetching machines + case studies (new section order: hero → logos → pillars → machines → proof → platform → how-it-works → CTA).
- **`/catalog`** slimmed to a compact browse index (small header, machines grid, games/packages link cards, case studies, slim CTA) — the duplicated hero/trust band/logo wall removed; `CatalogHero` + `TrustBand` deleted as dead code.
- **Machine taglines** in `seed.sql` + mock dataset rewritten to outcome language (e.g. "The premium smart locker" → "Premium gifting that runs itself — no staff required").

## [Path to 10/10 — Round 2: fixes & cleanup] - 2026-07-10

Round-2 audit fixes: dead code, RBAC consolidation, validation everywhere, role-model holes, demo-visible bugs, and doc/roadmap gating. No new product surfaces.

### P0 — Landmines
- **Dead USD code deleted** — `src/lib/proposals/generate.ts` + `document.ts` (unimported, USD-formatted) and `src/components/cloud/format.ts` (USD `formatCurrency` shadowed everywhere) removed.
- **RBAC consolidated** — `src/lib/rbac.ts` deleted; the only enforced key (`studio.order`) became `canOrderStudioWork` in `src/lib/roles.ts`, now the single role model.

### P1 — Validation & role model
- **Orphaned schemas wired** — `approvals`, `assets`, `studio`, `briefing` Zod schemas now actually run inside their server actions; new shared `uuidLike` validator (`src/lib/validations/id.ts`) accepts seeded demo ids.
- **Zod validation added** to 10 more action domains (`partners`, `team`, `invites`, `venues`, `templates`, `campaigns`, `profile`, `stages`, `compliance`, `comments`) with co-located schema tests.
- **Task reassignment** — new `reassignTask` action + `ReassignTaskMenu` on task rows lets orchestrators move internal work between team lanes (audited, customer tasks excluded).
- **QA/ops queues** — internal home focus now surfaces "awaiting QA sign-off" (qa_lead + orchestrators) and flags overdue setups as critical for ops; dead `InternalWorkQueue` component deleted.
- **`developer` role merged into `admin`** — role unions, arrays, UI labels, seeds, and a remap migration (`20260710000000_merge_developer_role.sql`).
- **Partner split made real** — commissions tab, payout KPIs, and per-deal commission money now gated on `isPartnerAdmin`; member sellers see pipeline only.
- **Overview KPI/card match** — the customer "What's needed from you" card now renders the same `getCustomerActionItems` list the "Needs you" KPI counts (via `CustomerActionSummary`).

### P2 — Demo polish
- **Live hourly buckets in UTC** — poll route uses `getUTCHours()` to match SSR.
- **Empty-MIME uploads** — `AssetUploadZone` infers MIME from the file extension when the browser hands over an empty `type`.
- **Invoices frozen read-only** — edit/issue UI removed (`InvoiceActions` deleted); dashboard is a status mirror; action default currency now GBP; mock invoice rows GBP.
- **Quiz cleanup** — `quiz-data.ts` moved into `catalog/quiz/`; re-export shim deleted.

### Docs, config & gating
- **Port fallbacks** `localhost:3001` → `3000` (invites, studio, notification dispatch/email shell).
- **`engines: { node: ">=20" }`** in package.json; README / CONTRIBUTING / HANDOFF aligned.
- **Doc fixes** — Resend template path (`archetypes/` + `email-shell.ts`); docs/07 historical-snapshot banner + gating status; README env table adds `BOOKING_AUTO_PROVISION` + `FILE_SCAN_*`; README roles table drops `developer`.
- **Mock dataset honesty** — false "Auto-generated" header replaced with hand-maintained warning; HANDOFF documents the manual three-way seed sync and a new "Deferred / gated features" section (Runway depth, white-label, commission depth, display-only invoices, deferred personas); DEMO_ROADMAP gating note.
- **Test truth** — `roi.test.ts` / `bright-studio.test.ts` no longer pin USD output.

## [Path to 10/10 — Pass 5 World-class deltas] - 2026-07-09

- **Home next action** — customer home elevates `resolveEventNextStep` via `HomeNextStep` (single blocking CTA + due/consequence hint).
- **Spec-aware asset intake** — off-spec files are blocked from upload (no “Upload anyway”); checklist must pass first.
- **Board-ready reports** — reports subtitle and customer copy frame &lt;24h proof + share/export as the renew artefact.

## [Path to 10/10 — Pass 4 Demo polish] - 2026-07-09

- **GBP** — `formatMoneyFromPence` / `formatGBP` (en-GB); legacy USD helpers alias to GBP; call sites migrated.
- **Needs you KPI** — event overview uses `getCustomerActionItems` (same as home).
- **Live hourly** — seeded from telemetry or `hourlyCurveFromTotal` (no empty first paint).
- **Overview sidebar** — activity feed gated to `canViewSection(..., "activity")`.
- **aggregate-metrics API** — customers may only query their own `accountId`.
- **Login** — relative-path redirect allow-list; docstring fixed.
- **Partner resources** — clearer empty-state copy when no file URL.

## [Path to 10/10 — Pass 3 Hardening] - 2026-07-09

Tests, query bounds, capability-slug sync, and a small client seam fix.

- **Tests** — `generate-leads`, `ExportMenu`, `remindCustomerTask`, `RemindCustomerButton`, and `TourProvider` finish → localStorage.
- **SecurityForm** — uses `createClient` from `@/lib/supabase/client` (mock-mode aware) instead of raw `createBrowserClient`.
- **Lead queries** — `getLeadsByEvent` capped at 5000; `getLeadAggregates` and leads export capped at 10_000.
- **Capability slugs** — new migration `20260709120000_sync_capability_slug_check.sql` aligns DB check with `capabilities.ts`; seed + mock dataset remapped (dropped `voucher-redemption` / `app-qr-drive`, added `lead-capture`).
- **STUBS** — clarified open `qa_items` / unpublished `event_reports` RLS defense-in-depth gap.
- **Lint** — `prefer-const` in `generate-leads.ts`.

## [Path to 10/10 — Pass 2 Architecture] - 2026-07-09

Code-quality pass: pages compose, queries read, actions mutate. Split monoliths; consolidate proposal libs.

- **Queries** — extracted page-level Supabase `.from()` reads into `src/lib/queries/` (briefing, customer queue, venue packages, notification prefs, accounts, API keys, live print helpers, campaigns count, etc.).
- **RecommendationQuiz** — split into `src/components/catalog/quiz/` (`OptionGrid`, `NumberStep`, `DurationStep`, `LocationStep`, `OwnLocationsStep`, `FootfallHeat`, `ReachPreview`); old path re-exports.
- **Inbox** — `TaskGroup` / `TaskRow` moved to `src/components/inbox/`; page fetches + composes only.
- **Proposals** — `build-proposal.ts` moved from `src/lib/proposal/` → `src/lib/proposals/`; empty `proposal/` removed.
- **VenueSponsorshipBoard** — `SlotCard` + `AddSlotForm` extracted to sibling files under `src/components/venues/`.
- **Docs** — HANDOFF mock-dataset sync note (`dataset.ts` ↔ `seed.sql` / `run-seed.ts`).

## [Path to 10/10 — Pass 1 Doc Sync + Late May–Jun Catch-up] - 2026-07-09

Documentation and housekeeping pass aligning product positioning, data-model coverage, integrations, and demo ops with what actually shipped. No product behaviour change beyond dead-code removal and localhost port defaults.

### Product positioning & docs
- **`docs/01-product-definition.md`** — one-liner and "What This Product Is Not" rewritten: delivery + proof primary; catalog/quiz/quoting as intake; partners/venues secondary. Retired the "not a sales tool / events already sold" contradiction.
- **`docs/07-platform-vision.md`** — Updated Role Model marks `reseller_*` / `venue_*` / `sponsor` as **ASPIRATIONAL**; implemented partner roles are `partner_member` / `partner_admin`.
- **`docs/04-data-model.md`** — concise Phase 7/8 + May–Jun entity table (`venues`, `placements`, `sponsorship_slots`, `campaigns`, `invoices`, `compliance_documents`, `game_configurations`, `product_configurations`, `scheduled_exports`, `event_team_members`, `comments`, `notification_preferences`, `pipedrive_outbox`) with cross-link to `docs/11-cloud-handoff.md`.
- **`docs/10-integrations.md`** — digest cron hourly (`0 * * * *`); Pipedrive max 3 attempts; removed `x-vercel-cron` bypass; documented `/api/cron/reports`, Sentry, and file-scan.
- **`HANDOFF.md`** — new Day-1 CTO onboarding at repo root (Pass 1 complete; subsequent passes follow).
- **`DEMO_ROADMAP.md`** — tour is on-demand via user menu / welcome, not every sign-in.
- **`CONTRIBUTING.md`** — notification archetypes point at `archetypes/` directory.
- **`README.md`** — delivery + proof lead; port 3000; test/typecheck scripts; payments dropped from production checklist stubs.

### Late May–June product work (catch-up entry)
Shipped across late May–June and not previously summarised in one place:
- **Onboarding tour** — role-aware guided tour, launchable from the user menu ("Take the tour") and welcome flow; not forced on every sign-in.
- **Lead capture as priced capability** — `lead-capture` moved from always-on to tailorable / separately priced in `src/lib/capabilities.ts` (+ migration).
- **Proposal documents** — richer proposal / reach-model surfaces for quiz and intake.
- **Compliance vault** — `compliance_documents` + account requirements, event compliance UI.
- **Invoices** — `invoices` + account payment preferences (no in-portal card checkout; Stripe stubs removed).
- **Machine / game config** — `game_configurations` and `product_configurations` per event.
- **Focused internal home** — `FocusedHome` replaced the old internal library dashboard.
- **Customer invites & welcome** — `/admin/invites`, `/welcome`, env alignment (`NEXT_PUBLIC_SITE_URL`).
- **Bright.Blue Cloud + live dashboards** — inbound webhooks, outbound client, live polling, ops briefing tabs.
- **Notification spine** — archetypes directory, digest timing, preferences, reminder cron.
- **Venue runway & partner portals** — placements, sponsorship slots, partner commissions/resources.
- **Sentry + file-scan hooks** — observability wired; AV scan env-gated no-op until configured.

### Housekeeping
- Port defaults standardised to **3000** (`.env.example`, README, digest cron fallback).
- Deleted unused `InternalDashboard.tsx` / `MyWorkDashboard.tsx` and empty orphan route directories.
- `src/lib/capabilities.ts` docstring corrected to four always-on + eight tailorable.

---

## [Customer Invites, Env Alignment & Doc Sync] - 2026-05-27

### Customer Invite / Onboarding Flow
- **NEW server action `inviteCustomerUser`** (`src/app/actions/invites.ts`) — gated to internal users, calls `supabase.auth.admin.inviteUserByEmail` and bootstraps a profile row.
- **NEW admin page `/admin/invites`** — email + account dropdown + role select form, wired to the invite action with toast feedback.
- **NEW welcome page `/welcome`** — editorial onboarding surface greeting the user by name with a capability overview and CTA to events.
- **Sidebar** gains "Invites" link under Pipeline (internal only).

### Environment Config Alignment
- **Unified `NEXT_PUBLIC_BASE_URL` → `NEXT_PUBLIC_SITE_URL`** across `dispatch.ts`, `email-shell.ts`, `studio.ts`, `digest/route.ts`, and `vitest.setup.ts`.
- **NEW `src/lib/env.ts`** — `checkRequiredEnv()` validates required (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`) and recommended (`RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `BRIGHTBLUE_API_KEY`) vars at startup.
- **`src/app/layout.tsx`** now calls `checkRequiredEnv()` at import time.
- **`.env.example` rewritten** — grouped into Required / Recommended / Optional sections; `NEXT_PUBLIC_BASE_URL` removed; Resend setup steps documented in comments.

### Documentation Sync
- **`docs/04-data-model.md`** — added `HourlyMetrics`, `StudioPricing` entities and schema fix notes.
- **`docs/10-integrations.md`** — cron table updated to match `vercel.json` schedules; `NEXT_PUBLIC_BASE_URL` → `NEXT_PUBLIC_SITE_URL`.
- **`README.md`** — fixed port to 3001; added Required Environment Variables table; added Production Checklist section.
- **`STUBS-TO-REPLACE.md`** — struck through completed items (legal pages, legal banner).

---

## [10/10 World-Class Pass — Live Data + Task Lifecycle + Ops Briefing] - 2026-05-27

Comprehensive quality pass addressing every gap identified in the post-audit review, with a focus on CTO handoff readiness and Bright.Blue Cloud integration.

### Task Lifecycle (Complete → Skip → Start)
- New server actions: `completeTask`, `skipTask`, `startTask` (`src/app/actions/tasks.ts`) with audit trail entries and notification dispatch for blocking tasks.
- `TaskChecklist` now fully interactive — hover reveals Complete/Start/Skip buttons with optimistic transitions.
- Internal users see all tasks (including non-customer-visible); external users see only customer tasks.
- Blocking task completion triggers `task.completed` notification archetype.

### Bright.Blue Cloud Integration
- **Inbound webhooks** (`POST /api/webhooks/brightblue`): HMAC-SHA256 verified, handles `telemetry.batch`, `lead.captured`, `machine.heartbeat`, `report.ready`.
- **Outbound API client** (`src/lib/brightblue/client.ts`): pulls live snapshots, post-show reports, and validates machine serials. Gracefully returns `null` when unconfigured.
- **Webhook verification** (`src/lib/webhooks/verify.ts`): timing-safe HMAC comparison with comprehensive test coverage.
- New env vars: `BRIGHTBLUE_API_URL`, `BRIGHTBLUE_API_KEY`, `BRIGHTBLUE_WEBHOOK_SECRET`.

### Live Dashboard — Real-Time Polling
- New client component `LiveDashboardClient` polls `/api/events/:id/live` every 10 seconds.
- API route tries Bright.Blue Cloud first, falls back to local DB data from webhooks.
- Hourly chart now aggregates real telemetry data (was previously zeroed).
- Live feed shows human-readable event labels (e.g. "Game session started", "New lead captured").
- Pause/resume toggle, Cloud vs Local source badge, last-refresh timestamp.

### Ops Briefing Form
- New `OpsBriefingForm` component with venue, power, WiFi, H&S, staffing, and logistics fields.
- Briefing page now has Creative + Operations tabs via `BriefingTabs` (URL-param driven, shareable).
- Progress indicator shows "Both submitted" / "1 of 2 submitted" / "In progress".

### CTO Handoff Documentation
- New `docs/10-integrations.md`: comprehensive integration contracts covering all webhooks, APIs, crons, and env vars.
- Updated `.cursor/rules/handover-documentation.mdc` with CTO-handoff-first documentation standards.
- Updated `.env.example` with all Bright.Blue Cloud variables.

### Quality
- 616 tests passing across 57 files.
- Zero TypeScript errors, zero lint errors.
- Production build clean.

---

## [Phase 1 — Public funnel feature-complete] - 2026-05-26

The public marketing & acquisition funnel is now end-to-end real. A guest can land on the home page, take the quiz, request a tailored proposal **or** book a packaged moment, hit a confirmation, and (separately) view a shareable post-event report — all wired to real Supabase data, all server-side validated, all priced from the catalogue rather than the client.

### Catalog
- Reusable URL-param-driven filters (`src/components/catalog/CatalogFilters.tsx`): `/catalog/packages?tier=`, `/catalog/case-studies?filter=`, brand new `/catalog/games?category=`.
- Shared catalog `loading.tsx` + `error.tsx` boundaries.
- `case-studies/[slug]` now renders stats + testimonial; `packages/[slug]` shows description + linked parent machine.
- Every catalog query logs Supabase errors (no more silent empty pages).
- Public nav extended: Machines · Games · Packages.

### Quiz → proposal
- 6th brand-signal step on the quiz; recommendation engine uses real seed slugs.
- `submitProposalIntake` now resolves `packageSlug` → `package_id` server-side, records `bb_partner` attribution, and ring-fences notification dispatch with try/catch.
- `IntakeWizard` surfaces server-side validation errors inline.

### Booking → confirmation
- `book/configure` rewritten as a Server Component that hydrates a client wizard with the chosen package, add-ons (keyed by `capability_slug`), machines, and games.
- `submitBookNowQuote` re-validates the package is bookable and recomputes the total on the server (no client-trusted pricing).
- New `getBookingReceipt` (service-role) helper lets the confirmation page render a receipt-safe view for anonymous customers.
- Stripe `paymentIntent.create` is a clearly-labelled `STUB:` for now (Phase 8 to wire live keys).

### Legal & static
- New `src/components/public/LegalShell.tsx` — shared ridge hero + "REPLACE BEFORE LAUNCH" banner.
- `/privacy` and `/terms` rebuilt onto it with static last-updated dates.

### Partner landing
- `/p/[code]` rewritten as a co-branded landing (was a redirect). Pulls partner config, sets `bb_partner` httpOnly cookie (30-day, `path:/`), renders ridge artwork in partner brand colour. Friendly not-found for inactive/unknown codes.
- `recordAttribution` accepts either `partnerId` or `partnerCode`; resolves and status-checks before writing.
- New RLS policy lets `anon` `SELECT` active partners (narrow column list) via `supabase/migrations/20260403000013_partner_public_read.sql`.

### Public report share
- New `src/lib/reports/normalise.ts` — single normaliser for `metrics_json`, `predictions_json`, `highlights_json`. Reads both camelCase and snake_case keys so the action's output and the seed's snake-shaped writes both produce identical KPI numbers. 13 new unit tests.
- `/report/[token]` and `/events/[id]/reports` both routed through it. No more KPI tiles silently landing on zero.

### Tests
- Three new Playwright specs (`public-quiz-to-booking`, `public-partner-attribution`, `public-report-share`) — all guest-only, no test-mode endpoints required.
- 594/594 vitest tests green. Typecheck, lint, and `next build` all green.

See `docs/phase-1-summary.md` for the full breakdown and `STUBS-TO-REPLACE.md` for the new stub list.

---

## [World-class editorial design pass] - 2026-05-26

A months-long visual overhaul that takes Bright.Experience from "polished build" to "world-class portal". The product still does the same things — every route is the same route, every server action is the same server action — but it now feels like the bright.blue brand. Three workstreams: build the editorial design language, rebuild every surface against it, and strip the dead code that the rebuild made obsolete.

### Workstream 1 — Editorial design language
- **NEW brand primitives in `src/components/brand/`** — the canonical chassis for every authenticated surface:
  - `RidgeArtwork` — deterministic SVG ridge fingerprint, seeded by event id or route key. Replaces decorative blur orbs as the brand's visual signature.
  - `EditorialEyebrow` — tracked uppercase DM Sans Medium label, the canonical small-heading. `accent` flag swaps muted-foreground for cobalt.
  - `Hairline` — 1px gradient rule between editorial sections, with horizontal + vertical orientations.
  - `EditionShell` / `EditionChrome` / `RidgeHero` / `EditionBody` / `EditionFooter` — the full editorial page chassis.
  - `EditionPlate` — compact card for one event, with its own scoped ridge.
  - `EventPageShell` and `AdminPageShell` — helper wrappers that compose the chassis with the right defaults for `/events/[id]/*` and `/admin/*` sub-pages.
- **NEW Linen (light) theme** — `class="theme-light"` on `<html>` flips the portal to the warm linen-on-deep-ink palette used by the proposal brochure and any print surface. `EditionShell` accepts a `theme` prop so a single component can be requested in either mode.
- **Locked brand palette** — `#1E47F0` Cobalt, `#80E8FF` Cyan, `#060720` Deep Ink, `#F2EDE0` Linen, `#FAF7F0` Paper. Every UI colour reads from a CSS variable that resolves through one of these.
- **Locked typography** — Nunito Bold for display/headings, DM Sans Regular for body, DM Sans Medium for overlines. Three faces, no more. Font files dropped in `public/fonts/` and wired up via `next/font/local`.
- **shadcn primitives extended** — `Card` gained an `interactive` prop and five `tone` variants; `Button` gained the `brand` and `glass` variants alongside the default gradient; `Badge` gained `success`/`warning`/`destructive`/`info`/`muted` semantic variants.

### Workstream 2 — Rebuild every surface against the new chassis
Every authenticated and public surface in the app has been rebuilt against the editorial chassis. Functionally identical — visually a different product.

- **Authenticated surfaces** — `/`, `/notifications`, `/inbox`, `/settings/notifications`, `/events/[id]` overview, and every `/events/[id]/*` sub-page (timeline, briefing, assets, approvals, actions, communications, logistics, qa, reports, live, leads, campaign, studio) all rebuilt with `EventPageShell` or `EditionShell` directly. Two-column editorial layouts replace the previous AppShell + PageHeader pattern.
- **Internal admin surfaces** — `/admin/asset-reviews`, `/admin/quotes` (list + detail), `/admin/customer-queue`, `/admin/templates`, `/admin/partners` (list + detail), `/admin/locations`, `/admin/benchmarks`, `/admin/recommendations`, `/admin/campaigns` (list + detail), `/admin/catalog`, `/admin/api`, `/admin/integrations/pipedrive`, `/studio`, `/events/new` all converted to `AdminPageShell`.
- **Public marketing surfaces** — `/catalog`, `/catalog/machines`, `/catalog/packages`, `/catalog/case-studies`, `/quiz`, `/proposal`, `/book`, `/book/configure`, `/book/checkout`, `/book/confirmation/[id]`, `/how-it-works`, `/partners/join`, and the `(public)/layout.tsx` chrome all rebuilt with `RidgeArtwork` heroes and the editorial eyebrow.
- **Login** — single full-bleed editorial layout with a generative ridge artwork, calm copy, and the gradient B brand mark.
- **Notification list** — hairline-separated rows with left-edge cobalt accent stripes for action items, replacing the previous "glass card" treatment.

### Workstream 3 — Strip the dead code the rebuild made obsolete
The previous design exploration introduced a "book / chapter / edition" metaphor that the user explicitly rejected ("the book stuff, chapters etc kind of is random and out of place"). That entire shape has been removed.

- **Removed** `src/lib/event-chapters.ts` + its test (the chapter/stage mapping helper).
- **Removed** `RomanList`, `RomanListItem`, and `toRoman` from `src/components/brand/editorial.tsx`. Only `EditorialEyebrow` and `Hairline` remain in that file.
- **Removed** the `editionNo` prop from `EditionPlate` — plates now read as title + location + status, no "Edition No024" eyebrow.
- **Removed** every "The library", "Your other editions", "Open the edition →" string from user-facing surfaces. The vocabulary is now "events", "stages", "milestones", "next step".
- **Removed** legacy `.card` / `.card-interactive` / `.btn` / `.btn-primary` / `.btn-ghost` / `.input` / `.badge` / `.badge-{green,amber,red,blue,muted}` CSS classes from `globals.css`. Every consumer migrated to the shadcn primitive equivalents:
  - `<Card interactive>` for the legacy `card card-interactive` pattern.
  - `<Button variant="brand">` for `.btn-primary` (and the default Button variant already uses the same gradient).
  - `<Badge variant="success|warning|destructive|info|muted">` for `.badge-{colour}`.
- **Removed** the `color` field from `HEALTH_CONFIG` — it carried a legacy `badge-*` class string that no consumer was actually reading.
- **Refactored** `StudioRequestActions` from inline `btn btn-primary` strings to proper `<Button variant="brand">` calls.

### Workstream 4 — Documentation
- **NEW `docs/09-design-system.md`** — canonical reference for the editorial design language, locked palette, type scale, page chassis, brand primitives, shadcn variant cheat sheet, and banned patterns.
- **README rewritten Design System section** — covers Deep Ink + Linen themes, the brand primitives, the type scale, and the colour tokens cheat sheet.
- **`.cursor/rules/component-patterns.mdc` rewritten** — lists the editorial primitives, the shadcn variant cheat sheet, the banned patterns, and where to look first when adding a new surface.
- **CONTRIBUTING.md** gains an "Adding a new page" section pointing at the right shell helper for each page type.

### Why this matters
The portal now feels like a single product instead of a stack of features. Every page opens with the same editorial chassis, the same eyebrow voice, the same ridge fingerprint that's unique to its route. Customers, internal users, and resellers all read the same calm visual language. And the codebase no longer carries the dead exploration — there's exactly one way to build a page, one set of primitives to reach for, and one design system reference doc that tells the next contributor where everything lives.

- 460 unit + component tests passing.
- Zero references to `RomanList`, `chaptersForEvent`, `editionNo`, `event-chapters`, `toRoman`, or any legacy `.btn`/`.card`/`.badge`/`.input` class anywhere in `src/`.
- Every public route returns 200; every authenticated route correctly redirects unauthenticated visitors to `/login`.

---

## [Cross-event work hub and Pipedrive write-back] - 2026-05-16

A three-PR pass that answers a single user question — *"where should I look first when I sit down at the portal?"* — and keeps the AE's Pipedrive deal current without dual-entry. The dashboard now shows what's on you for every event in a glance, internal users get a consolidated work hub plus a dedicated `/inbox`, and Pipedrive deals stay honest as Bright.Experience writes back six high-signal delivery moments to deal notes and three custom fields.

### PR 1 — Actions-on-you pill on every event card
- **NEW query `getOpenTaskCountsForUser`** (`src/lib/queries/tasks.ts`) — one round-trip that returns a `{ eventId: openTaskCount }` map. Internal viewer counts tasks where `assigned_to = user`; customer viewer counts customer-visible-and-not-complete tasks
- **`EventCard` gains an `actionsForViewer` prop and renders a header pill** — `"{n} on you"` (internal) or `"{n} to do"` (customer) in warning tone, `"All clear"` in muted green when zero
- **`src/app/page.tsx` fetches the counts map** and passes the per-event count into each `<EventCard>` so the entire dashboard reads cross-event status without bouncing through every workspace

### PR 2 — Cross-event work hub on the dashboard (internal only)
- **`InternalWorkQueue` extended from four to six tiles** — adds "Asset reviews" (count of `assets.review_status = 'pending_review'`) and "Stuck customers" (count of approvals + briefings + asset revisions older than 7 days). Grid expands to `lg:grid-cols-3 xl:grid-cols-6` so all six fit cleanly
- **NEW shared helper `countStuckCustomerActions` + `STUCK_CUSTOMER_DAYS`** (`src/lib/queries/admin-queues.ts`) — same predicates as `/admin/customer-queue`, extracted into one place so the tile count and the page stay in lock-step
- **NEW `MyTasksPanel`** (`src/components/admin/MyTasksPanel.tsx`) — rendered below the tile grid for internal viewers. Lists up to 8 open tasks assigned to the current user, sorted "overdue → due in 3 days → everything else", each row deep-links to `/events/{id}/actions`. "See all" jumps to `/inbox` for the full view. Empty state shows "Inbox zero across every event"
- **NEW page `/inbox`** (`src/app/inbox/page.tsx`) — full filterable view of every open task assigned to the current internal user. Filters: event / category / status (open vs recently completed vs both). Renders four sections: Overdue (destructive), Due in next 3 days (warning), Everything else, Recently completed
- **NEW `InboxFilters`** (`src/components/inbox/InboxFilters.tsx`) — client component using URL search params so filters survive refresh and link-sharing
- **NEW query `getTasksAssignedToUser`** (`src/lib/queries/tasks.ts`) — joins events + accounts so every row carries parent context without a second round-trip. Optional `includeCompletedSince` window for the "recently completed" filter
- **`Sidebar` adds "Inbox" link under the Pipeline group** for internal users

### PR 3 — Pipedrive write-back integration
- **NEW migration `supabase/migrations/20260516000000_pipedrive_integration.sql`** — adds `events.pipedrive_deal_id` (+ `pipedrive_linked_at` timestamp); creates `pipedrive_outbox` (one row per pending Pipedrive write, with `kind`, `payload`, `attempts`, `last_error`, `sent_at`); creates `pipedrive_config` singleton (API token, base URL, three custom-field keys, three health option IDs, default pipeline ID). Both tables are RLS-gated to internal users
- **NEW `src/lib/pipedrive/client.ts`** — thin REST client (`addNoteToDeal`, `updateDealCustomFields`, `searchPersonByEmail`, `getCurrentPipedriveUser`, `getDeal`). Returns typed `PipedriveResult` discriminated union; never throws on transport failure. Auth flows from `pipedrive_config.api_token` with fallback to `PIPEDRIVE_API_TOKEN` env var; absent config silently no-ops every call
- **NEW `src/lib/pipedrive/format.ts`** — pure note-body formatters for the six trigger archetypes (deal kickoff, stage advance, approval decision, asset review decision, event live, event delivered). Every note carries a `<p><strong>title</strong></p><p>body</p><p>Open in Bright.Experience</p>` shape so the Pipedrive UI and email digests both render cleanly. Portal back-links honour `NEXT_PUBLIC_SITE_URL`
- **NEW `src/lib/pipedrive/drain.ts`** — `drainOutbox()` worker. Picks pending rows (max attempts = 3), routes them through the client, marks `sent_at` on success or bumps `attempts` + `last_error` on failure. Resolves an `__increment__` sentinel for the delivered-events counter by GETting the current value and PUTting `current + 1`. Used by both the inline enqueue-then-drain path and the hourly cron
- **NEW `src/lib/pipedrive/triggers.ts`** — six high-signal helpers: `enqueueDealKickoff`, `enqueueStageAdvance` (only for the five customer-visible stages: creative_assets, approvals, qa_readiness, event_live, reporting), `enqueueApprovalDecision`, `enqueueAssetReviewDecision`, `enqueueEventLive`, `enqueueEventDelivered`. Each writes one note row plus one custom-field-update row, then kicks an inline drain. Updates three custom fields on the same triggers: `bb_last_activity_at` (today), `bb_health_status` (green/amber/red), `bb_delivered_events` (++ on delivered)
- **Existing server actions wired to the new triggers:**
  - `acceptQuote` / `createEvent` → `enqueueDealKickoff` (when a deal is linked at event creation)
  - `advanceStage` → `enqueueStageAdvance`
  - `decideApproval` → `enqueueApprovalDecision` (with feedback)
  - `submitAssetReview` → `enqueueAssetReviewDecision` (with feedback)
- **NEW `/api/cron/pipedrive` route** (`src/app/api/cron/pipedrive/route.ts`) — hourly Vercel Cron that drains the outbox and fires the two time-driven triggers (event live, event delivered) on a once-per-event sentinel basis. Auth mirrors the other cron routes
- **NEW `/admin/integrations/pipedrive` page** (`src/app/admin/integrations/pipedrive/page.tsx`) — single setup screen. Paste API token (masked when stored), edit base URL, three custom-field keys, three health-option IDs, default pipeline. Three actions: Save, Test connection (round-trips `/v1/users/me`), Drain outbox now. Side panel explains the six triggers. Below the form: outbox tail of the last 20 writes with status (sent / pending / failed), kind, deal ID, attempt count, and the last error
- **NEW `src/components/admin/PipedriveSetupForm.tsx` + `PipedriveOutboxTail.tsx`** — client + server components backing the admin page
- **NEW `src/app/actions/pipedrive-config.ts`** — `saveConfig`, `testConnection`, `runDrain` server actions. All gated on internal role
- **Event creation form** (`src/app/events/new/page.tsx`) **adds an optional "Pipedrive deal" field** — accepts a deal URL or numeric ID. `createEventFromForm` normalises both shapes, persists `pipedrive_deal_id` + `pipedrive_linked_at`, and fires `enqueueDealKickoff` if a deal is supplied
- **`EventContextBar` shows a "Pipedrive deal · #1234" chip** when an event is linked, deep-linking to the deal in Pipedrive (configurable via `NEXT_PUBLIC_PIPEDRIVE_WEB_BASE_URL`)
- **`Event` type gains `pipedriveDealId` and `pipedriveLinkedAt`**; `mapEvent` reads them out
- **`Sidebar` adds "Pipedrive" link under the Platform group** for internal users
- **`vercel.json` adds an hourly cron for `/api/cron/pipedrive`**
- **`.env.example` documents `PIPEDRIVE_API_TOKEN`, `PIPEDRIVE_BASE_URL`, `NEXT_PUBLIC_PIPEDRIVE_WEB_BASE_URL`** — all three are optional; the integration is a full no-op when unset

### Why this matters
- Internal events leads now answer *"what's actually on me today across every customer?"* without clicking into five workspaces. The pill is the cross-event scan; the work hub is the consolidated answer; `/inbox` is the deep-dive
- Customers see the same pill on their own dashboard so "you have N things to do across your events" is visible the moment they sign in
- Pipedrive deals stay current without dual-entry. AEs read a clean activity feed and three custom fields tell them in one glance: when the customer last did something, what the health looks like, and how many events this customer has now delivered
- The outbox pattern means a Pipedrive outage never blocks a customer action. Anything that didn't land inline gets retried hourly; anything stuck after three attempts surfaces on the admin page with the error visible

---

## [Unified notification spine] - 2026-05-15

A three-PR pass that replaces the "million emails back and forth" pattern with a single, opinionated dispatch spine. Every domain event with a canonical archetype goes through one function (`dispatchNotification`), every recipient resolves through one resolver per archetype, and every message lands in both the in-portal lane and the email lane using one shared visual template. The customer reads outcome-line subjects ("Your asset needs a small revision"), never slugs. Class A ("action required") archetypes are unsilenceable in the portal — even when email is downgraded, the system never assumes a stuck customer chose to be stuck.

### PR 1 — Dispatcher + archetypes + email shell
- **NEW migration `supabase/migrations/20260515000001_notification_spine.sql`** — extends `notifications` with `kind`, `priority`, `entity_type`, `entity_id`, `action_required` plus indexes; creates `notification_preferences` (per-user, per-archetype, with `in_portal` + `email_mode` columns and RLS for "users see own"); creates `notification_reminders` (the dedup ledger); adds `review_status`, `review_decided_by/at`, `revision_count` to `assets`
- **NEW `src/lib/notifications/archetypes.ts`** — catalogue of 24 canonical archetypes (customer-actionable, internal-actionable, FYI, time-driven) with subject/body/link templates, owner resolver slugs, reminder cadences, defaults and Class A/B classification. Helpers `getArchetype`, `fillTemplate`, `CLASS_A_KINDS`, `CLASS_B_KINDS`
- **NEW `src/lib/notifications/dispatch.ts`** — `dispatchNotification(kind, context, options?)` resolves owners, writes one in-portal row per recipient (Class A always; Class B per preference), and sends one email per recipient via Resend (per-archetype `email_mode` with Class A reminder override). Supports a `supabaseClient` override so the cron can run with service-role
- **NEW `src/lib/notifications/resolve-owners.ts`** — pure per-archetype resolvers (`customer_admins`, `event_account_executive`, `event_creative_lead`, `event_operations_lead`, `event_members_internal`, `event_members_all`, `task_assignee`, `message_recipients`, `asset_uploader`, `approval_requester`). Falls back to the AE persona when no internal user exists for an archetype yet
- **NEW `src/lib/notifications/email-shell.ts`** — single Bright.Blue-styled email template with gradient header, eyebrow chip ("Action required" / "FYI" / "Reminder"), headline, body, optional feedback block, optional CTA, AE sign-off ("Sarah Chen · Account Manager"), and a "Manage these notifications" deep link anchored at the archetype
- **Refactored every domain action to flow through the dispatcher:**
  - `uploadAsset` → dispatches `asset.review_needed` and flips the asset into `pending_review`
  - `decideApproval` → dispatches `approval.approved` or `approval.revision_requested` with feedback inline
  - `saveBriefingResponse` (on submit) → dispatches `briefing.submitted` to creative
  - `updateStudioRequestStatus` → dispatches `studio.status_changed`
  - `createStudioRequest` → keeps the existing Resend handoff, adds `studio.request_submitted` for the in-portal queue
  - `acceptQuote` → dispatches `quote.accepted` to AE + ops
  - `submitProposalIntake` → keeps the structured AE handoff email, adds `proposal.intake_received` to the bell so the AE has an authenticated landing link
  - `advanceStage` → routes through `stage.changed` (replaces the previous `event_members` query that was silently returning nothing)
  - `sendMessage` → routes through `message.received`
- **NEW `MarkAllReadButton`** wires up the "Mark all read" affordance on `/notifications`
- **`NotificationList` rewritten to group by `action_required` first** — "Awaiting you · N" lane in warning tone, then "FYI · N" with the existing recency buckets. New camelCase mapping in `getNotificationsByUser` so the renderer doesn't need to bridge snake_case any more

### PR 2 — Asset review gate + ownership UI
- **NEW server action `submitAssetReview`** (`src/app/actions/asset-review.ts`) — internal-only (Zod-validated), flips `review_status` to `approved` or `revision_requested`, increments `revision_count` on revisions, requires non-empty feedback for revisions, and dispatches the customer-facing follow-up archetype with feedback inline
- **NEW page `/admin/asset-reviews`** — queue of every asset waiting on a Bright.Blue decision, oldest-first. Accordion rows preview the file, show spec details, capture review notes, and post approve/request-revision decisions
- **NEW `AssetReviewBadge`** rendered on every asset row in `/events/[id]/assets` — amber "Pending Bright.Blue review", green "Approved", or red "Revision requested" pill. Revision feedback surfaces as a "Note from Bright.Blue creative" block on the customer-side asset card
- **`AssetUploadButton` now shows "Uploaded — pending Bright.Blue review"** as a pill instead of a small line of text, so the customer reads the next step the second the upload completes
- **NEW `src/lib/ownership.ts`** — pure `ownerForMilestone`, `groupOpenTasksByOwner`, and `ownerLabelFor` helpers that translate task categories into customer-facing owner labels (`customer` / `creative` / `operations` / `qa` / `development` / `logistics` / `reporting` / `ae`), with the personalised "Waiting on you" variant when the viewer matches the owner
- **`MilestoneTimeline` extended** with optional `tasks` + `viewerRole` props — when supplied, each active milestone gets a small "Waiting on …" pill (`Waiting on you` in warning tone for the viewer's items, neutral for everyone else). Wired into both the event overview sidebar and the standalone `/events/[id]/timeline`
- **NEW `EventOwnershipPanel`** on the event overview — "Right now, here's where things sit" panel listing every open-task bucket with the customer-side row highlighted in warning tone when the viewer is the customer
- **NEW `Textarea` shadcn primitive** (`src/components/ui/textarea.tsx`) — matches the existing `Input` design language; used by the review queue for feedback notes
- **Asset query extensions** — `getAssetsByEvent` exposes `reviewStatus`, `revisionCount`, `reviewDecidedBy/At`, `uploadedBy`; new `getAssetsPendingReview` joins events + uploader profile for the queue; new `getAssetById` for direct lookups
- **`Asset` type** gains `reviewStatus`, `reviewDecidedBy/At`, `revisionCount`, `uploadedBy`. Mock data updated to set sane defaults
- **Sidebar adds "Asset reviews" link** under the Pipeline group (internal only)

### PR 3 — Reminders + per-user preferences + AE backstop
- **NEW cron `/api/cron/reminders`** (daily 09:00 UTC) — auth via `x-vercel-cron` header or `Authorization: Bearer ${CRON_SECRET}`. Scans every archetype with a `reminderCadence`, consults `notification_reminders` per (subject, recipient, kind) to avoid duplicate nudges, escalates `escalation_level` on each send. Applies the Class A override (`overrideEmailOff: true` at level 2+) so Class A reminders bypass `email_mode: "off"` once the action has sat long enough. CC's the AE at the configured escalation level (default 2 = 72h on a 48h cadence). Also wires the time-driven `event.t_minus_30/14/7/3` archetypes so events are pinged automatically at each milestone
- **NEW cron `/api/cron/digest`** (daily 17:00 UTC) — bundles every unread FYI notification from the last 24h into one email per recipient (max 8 line items + "and N more in the portal"). Reads `notification_preferences` to honour each recipient's per-archetype `digest` mode; falls back to archetype defaults when no row exists
- **NEW `src/lib/supabase/service-role.ts`** — privileged client used by the crons so they can scan and write across all rows regardless of RLS. Throws a clear error if `SUPABASE_SERVICE_ROLE_KEY` isn't set
- **`vercel.json` declares both cron schedules** — `/api/cron/reminders` at `0 9 * * *` and `/api/cron/digest` at `0 17 * * *`
- **NEW page `/settings/notifications`** — split into "Action items" (Class A) and "FYI" (Class B) sections. Class A rows show the in-portal lane as a non-editable "Always on" pill and a three-way Immediate / Daily digest / Off control for email. Class B rows expose both lanes. A standing footnote sets honest expectations: *"Action items always show up in the portal. Reminders may email you anyway if something stays stuck — we'd rather knock twice than let your event stall."*
- **NEW server action `updateNotificationPreference`** — Zod-validated, upserts into `notification_preferences`. Always writes `in_portal=true` for Class A regardless of what the caller sent so the row stays a faithful record of "what the UI showed"
- **NEW page `/admin/customer-queue`** — every customer-side action item (pending approval, unsubmitted brief, awaiting re-upload) that has sat > 7 days, oldest-first. One click takes the AE to the relevant event surface to chase by phone. Surfaces the rows the system has already emailed twice
- **Sidebar additions** — "Customer queue" under Pipeline (internal), "Notifications" in the footer beside Settings for every persona
- **`.env.example` extended** — documents `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, and `SALES_TEAM_EMAIL`

### Acceptance highlights
- Every domain action listed above now produces both an in-portal notification and an email to the right person (when Resend is configured)
- The customer reads outcome-line subjects ("Your asset needs a small revision"), never slugs
- Asset uploads land in `/admin/asset-reviews` immediately; approval clears the customer's badge; revision pings the customer with feedback inline and writes a "Note from Bright.Blue creative" block on the asset card
- A Class A action sitting 48h sends a second email even if the recipient has set email to "off" (the override is what makes it a reminder, not spam)
- `/settings/notifications` lets any user toggle email mode per archetype; the in-portal lane for Class A archetypes is "Always on" and not editable
- The `EventOwnershipPanel` shows every party which actions sit on their plate today, with "On your plate" highlighted for the viewer
- `npm run build` clean

---

## [World-class buying experience] - 2026-05-15

A three-PR pass that rewrites the discovery-to-acceptance journey to feel like a conversation, not a configurator. The customer never sees a checkbox graveyard, never re-decides anything they've already decided, and never reads the word "configure" or "add-on." Brand voice ("Make Your Moment Count") surfaces twice — once at match, once at confirmation.

### PR 1 — Capability foundation (zero visible change to customer)
- **NEW `src/lib/capabilities.ts`** — single source of truth for nine canonical tailorable capabilities (`live-telemetry`, `sampling-unlock`, `voucher-redemption`, `linkedin-follow`, `survey-layer`, `dynamic-sponsors`, `app-qr-drive`, `age-verification`, `payments-onunit`) plus five always-on inclusions. Each capability carries a customer-facing outcome line, a quiet mechanism caption, the bright.blue product surface it maps to, a default price in pence, and a pre-select rule predicate. Helpers: `getCapability`, `getCapabilities`, `sanitiseCapabilitySlugs`, `preSelectCapabilities`, `encodeCapabilityParam`, `decodeCapabilityParam`
- **NEW migration `supabase/migrations/20260515000000_capability_vocabulary.sql`** — adds `package_addons.capability_slug` (nullable, with check constraint scoping to the nine canonical slugs and an index) and `quotes.addons jsonb default '[]'::jsonb` with a GIN index. Existing ad-hoc add-ons remain valid with null slug
- **`submitProposalIntake` extended** — accepts `addons: string[]`, sanitises against the canonical set, persists to `quotes.addons`. `submitBookNowQuote` now sanitises its existing `addons` field through the same gate
- **NEW `RequestedCapabilities` component** (`src/components/quotes/RequestedCapabilities.tsx`) — renders the customer's chosen slugs as outcome-line chips on `/admin/quotes/[id]` so the AE reads the same language the customer chose. Empty state explicitly says "None requested — turnkey activation as-is"

### PR 2 — Match reveal + Refine drawer
- **Quiz step 5 trimmed to single-select Audience** (B2B / Consumer / Mixed). Step 1 (objective) remains the only multi-select; every other step auto-advances on click. The "Step N of M" numeric counter is removed — only the thin gradient progress bar remains
- **Quiz question copy rewritten in bright.blue voice** — "What do you want this moment to do?" / "Where will it live?" / "How many people are coming?" / "What's your footprint?" / "Who's coming?"
- **Quiz page rewritten** — title becomes `Let's make your moment count`, eyebrow `Two minutes, five questions`, subheading promises one tailored suggestion with no comparison table and no commitment
- **NEW `QuizMatchCard`** (`src/components/catalog/QuizMatchCard.tsx`) — replaces the legacy quiz `done` state. Eyebrow `Your moment`, one conversational sentence in prose ("We'd suggest the Claw with our Professional package — our most-asked-for setup for a trade show where pipeline matters most."), large machine image, "Your tailored experience" overline + 3–5 outcome chips already selected, a quiet `Refine` link, a single primary `Get my tailored proposal` CTA. No comparison table, no tiers grid, no price
- **NEW `RefineDrawer`** (`src/components/catalog/RefineDrawer.tsx`) — slide-in `Sheet` from the right, listing all nine tailorable capabilities as outcome-line rows with a trailing toggle. Off rows dim to 70% opacity; on rows full opacity. Sticky `Save my choices` button at the bottom. Closing the drawer cancels — the only positive action is Save
- **`getRecommendation` extended** to return `{ match, preSelectedCapabilities, signals }` — `preSelectCapabilities()` applies all nine predicates against the quiz signals and caps the result at 5 to keep the match card calm
- **CTA carries capability slugs through URL params** (`?machine=…&package=…&event=…&objective=…&audience=…&addons=…`) using `encodeCapabilityParam` for a stable comma-separated list

### PR 3 — Intake + confirmation + post-accept
- **`IntakeWizard` silently absorbs URL capabilities** via `useSearchParams()`. No sixth step is added. The five existing steps are preserved; the customer never re-decides anything they already decided
- **Step titles rewritten in bright.blue voice** — `Tell us about the moment.` / `Where and when?` / `What do you have in mind?` / `The creative side.` / `And you — who should we send this to?`. Field labels and helper text also softened across all five step components
- **Step labels in the wizard rail** — "The moment / Where & when / The brief / The creative / Your details"
- **Submit button rewritten** — `Send me my tailored proposal` (was: `Submit Request`)
- **NEW `PostIntakeCard`** (`src/components/quotes/PostIntakeCard.tsx`) — replaces the transactional `Thank You!`. Eyebrow `Make your moment count`, headline `{first name}, your proposal is being crafted.`, "Here's the experience we'll price for you:" bullet list with the named machine + package + every outcome chip, a named-human card (`Sarah Chen · Account Manager` with avatar + mailto), and the only post-submit affordance: a quiet `Adjust the experience` link that reopens the same `RefineDrawer` from the match card
- **NEW server action `updateQuoteCapabilities(quoteId, slugs[])`** — persists changes from the post-submit RefineDrawer back to `quotes.addons` and revalidates the admin quote view
- **NEW `PostAcceptBanner`** (`src/components/quotes/PostAcceptBanner.tsx`) — renders above `ProposalHero` on `/proposal/[id]` when `status === 'accepted'`. Eyebrow + headline `{first name}, the {machine} is yours for {date}.` + `{Sarah}'s working on your kickoff — you'll hear from her within the hour.` Looks up the machine's friendly name from the live catalogue, gracefully degrades when not found
- **NEW `src/lib/team.ts`** — `DEFAULT_ACCOUNT_MANAGER` persona (Sarah Chen). Swap-in-one-place wiring for when a real AE round-robin lands
- **NEW `sendProposalIntakeNotification`** in `src/lib/email.ts` — AE handoff email. Body lists the customer's chosen capabilities as outcome lines (not slugs), with the raw slug array printed at the foot as machine-readable structured data. Sends to `SALES_TEAM_EMAIL` env (`sales@brightblue.co.uk` default). Fire-and-forget after `submitProposalIntake` succeeds

### Acceptance check passed
- `npm run build` clean after each PR
- A customer reaches the match card in under 60 seconds (5 steps, 4 of them auto-advance)
- The match card shows exactly one machine, one paragraph, and 3–5 outcome chips
- The intake form has the same 5 steps; zero new fields visible
- The phrase "Make Your Moment Count" appears once on the match card eyebrow text and once on the confirmation card eyebrow text
- Nothing in the customer-facing flow uses the words *configure*, *add-on*, or *upsell*

---

## [Premium polish pass] - 2026-05-15

A three-workstream pass that takes the platform from "polished build" to "world-class and premium": global visual restraint, a catalog rewrite that swaps the misplaced ROI calculator for trust signals, and a proposal brochure rebuild where ROI returns at the bottom alongside a known price.

### Workstream 1 — Foundation polish (global)
- **Glass surfaces are now the exception, not the default.** `Card` `tone="subtle"` is the new body-card aesthetic (solid `hsl(233 50% 8%)` with a hairline border). Every authenticated page sweeps from `glass` → `subtle` on inner content cards; `glass` is reserved for one hero card per page max
- **Decorative orbs trimmed to one per page max.** `CatalogHero` collapses from three radial gradients to one, the catalog bottom CTA radial gradient is removed, and the corner orb on `ProposalView` is gone; `NextStepCard` and `ReferralLinkCard` retain their single orbs (earning them)
- **Ad-hoc gradient text killed** — `CatalogHero`'s `bg-clip-text` "drive results" em swapped for a clean `text-foreground` em; codebase no longer contains `bg-clip-text` outside of brand marks
- **Radius token discipline** — every ad-hoc `rounded-2xl` / `rounded-3xl` replaced with one of three CSS variables (`--radius-chip`, `--radius-control`, `--radius-card`) across `MachineCard`, `ReportHighlights`, `RebookCTA`, `LeadTable`, `ROICalculator`, `LogisticsTimeline`, `FileUpload`, `TaskChecklist`, `BrandMark`, `login`, and partner / admin tables
- **NEW primitive `HeroMetric`** (`components/ui/hero-metric.tsx`) — single oversized KPI with optional satellites row. Adopted on the authenticated dashboard ("On track / X events"), the event overview ("Days to event"), the partner dashboard ("Pipeline value"), and reduced KPI density on the venue dashboard

### Workstream 2 — Catalog rewrite
- **`/catalog` no longer sells ROI math.** The `ROICalculator` section is removed from the public catalog; `HowItWorks` is demoted to a new standalone route `/how-it-works`; new section order is **Hero → Logos strip → Machines → Case studies → Trust band → Final CTA** (Featured games removed from the storefront)
- **`CatalogHero` tightened** — specific outcome headline (`Capture 1,200+ leads at your next exhibition.`), refined subheadline, two confident stat pills (`Live in 12 markets`, `92% rebook rate`)
- **NEW `LogosStrip`** (`components/catalog/LogosStrip.tsx`) — six-to-eight monochrome client monograms with `Trusted by` overline; falls back to letter glyphs until real client logos are dropped in
- **NEW `TrustBand`** (`components/catalog/TrustBand.tsx`) — three big numbers (`4,800+ activations / 1.2M+ leads captured / 92% rebook rate`) plus a pull-quote testimonial slot. Replaces the ROI calculator visually
- **Bottom CTA simplified** — radial gradient and trophy chip removed, single hero heading + single primary CTA (`Find your fit`)
- **`/how-it-works`** route renders the three-step strip standalone; linked from the public footer

### Workstream 3 — Proposal brochure rebuild
- **`/proposal/[id]` rebuilt as a brochure** — above-the-fold leads with `BrandLockup` + "Prepared for { name }" + a display-type total + a single `Accept proposal` CTA; status badge demoted to a thin meta row; below-the-fold flows breakdown → outcomes → ROI panel → footer
- **`ProposalView` split** into four named sub-components: `ProposalHero`, `ProposalBreakdown`, `ProposalOutcomes`, `ProposalROIPanel` (`src/components/quotes/`)
- **NEW `ProposalROIPanel`** — pre-fills investment from `quote.total_amount` (read-only chip) and modelled leads from `quote.estimated_leads`; single editable `Average lead value (£)` input with smart defaults derived from `quote.event_type` (£50 B2C / £400 B2B / £120 mixed); outputs three big tiles (`Estimated revenue` / `ROI multiple` / `Payback`) computed live, with a `What does this assume?` disclosure exposing the formula
- **Sticky accept bar on desktop** — once the user scrolls past the hero, a thin sticky footer appears at the bottom of the viewport with `Total · £X` and `Accept proposal`; mobile keeps the in-flow buttons
- **NEW `src/lib/roi.ts`** — `computeProspectROI`, `computeProposalROI`, `defaultLeadValueForEventType`, `formatGBP`, `DEFAULT_LEAD_VALUE`, `INTERACTION_RATE`, `DEFAULT_CONVERSION_RATE`. Used by both the new `ProposalROIPanel` and the legacy catalog `ROICalculator`
- **Print-ready by default** — new `.print-break-inside-avoid` utility on outcomes / ROI tiles, line-items table rows marked `print-break-inside-avoid` so they don't split mid-row, `proposal-brochure` Container narrows to a comfortable A4 width in print, `no-print` on all interactive controls (including the new sticky bar)

### Acceptance check passed
- `npm run build` clean after each workstream
- No more than one `tone="glass"` Card per page across the authenticated app
- No more than one decorative blur orb per page
- No `bg-clip-text` outside of brand marks
- Every authenticated dashboard leads with exactly one `HeroMetric`
- The word "ROI" no longer appears on `/catalog`
- Hero headline contains a specific outcome (number + event noun)
- Top of the proposal page leads with the total in display type
- ROI panel uses the quote's actual price (no longer hypothetical)
- One primary CTA in the proposal hero (`Accept proposal`); `Decline` and `Print` are demoted

---

## [World-Class UX Overhaul] - 2026-05-14

A six-phase UX overhaul transforming Bright.Experience into a premium, intuitive, beautifully delivered product across every persona.

### Phase 1 — Foundation
- **Unified design tokens** (`globals.css`): brand colors mapped to shadcn semantic variables, new typography (`text-display`, `text-balance`), refined radii, glassmorphism utilities, sonner toaster theming
- **Extended shadcn primitives**: `Button` now ships `brand` & `glass` variants + `xs/lg/xl` sizes with `active:scale-[0.97]` micro-feedback; `Card` accepts `tone` & `interactive` props; `Badge` gains `success/warning/info/muted`; `Input` & `Skeleton` aligned to tokens
- **New UI primitives**: `BrandMark` & `BrandLockup`, `Container` & `Section`, `Kbd`, `Toaster`, `Command` (cmdk), `StatCard`
- **AppShell refactor**: persistent sidebar collapse (`useSidebarState`), Cmd+K command palette, profile dropdown (`UserMenu`), notification bell, skip-to-content a11y link

### Phase 2 — Wayfinding
- **`NextStepCard`** — hero CTA used on every dashboard and event overview
- **`CommandPalette`** with role-aware quick actions, Cmd+K shortcut
- **`EmptyState` refresh** — decorative orb, secondary actions, premium glass styling
- **Enhanced `PageHeader`** — eyebrow, meta badges, responsive flex

### Phase 3 — Premium public surfaces
- **Rebuilt `(public)/layout.tsx`** — `BrandLockup`, `PublicMobileMenu`, footer column grid, `PartnerAttributionBanner`
- **New routes**: `/catalog/machines`, `/catalog/packages`, `/catalog/packages/[slug]`, `/terms`, `/privacy`
- **Magazine-grade machine PDP**, `PackageTierCard`, polished `MachineCard` / `GameCard` / `CaseStudyCard`

### Phase 4 — Intuitive dashboards
- **`EventContextBar`** mounted on every event sub-page (overview, actions, assets, approvals, briefing, communications, logistics, QA, leads, live, reports, studio, timeline, campaign)
- **Resolved next step** — `lib/event-next-step.ts` powers contextual `NextStepCard` on the event overview
- **`InternalWorkQueue`** on the admin dashboard — quotes, studio orders, partner apps, blocked events
- **Quote pipeline** — tabbed status filter, search, smart defaults
- **`ReferralLinkCard`** for partners with QR code + copy
- **Venue calendar-first dashboard** with 12-week runway

### Phase 5 — Motion & delight
- **Motion primitives** (`components/ui/motion.tsx`) — `FadeIn`, `Stagger`, `PageTransition`, `AnimatedCounter`
- **Page transitions** wired into `AppShell` (per-pathname `<PageTransition>`)
- **Confetti utility** (`lib/celebrate.ts`) — fires on approval accept, asset upload, briefing submit, studio order, quote acceptance
- **Sonner toasts** wired into every server-action surface with loading / success / error states
- **`AnimatedCounter`** now backs every numeric `StatCard`
- **`StudioTierCard`** flips into request form via `AnimatePresence`

### Phase 6 — Performance, accessibility, production polish
- **Next.js `Image` migration** across machine, game, case-study, report-highlight, and machine PDP surfaces
- **`next.config.ts`** image `remotePatterns` for Supabase Storage, Unsplash, QR API, CDN; AVIF/WebP output
- **`reactStrictMode: true`**, `poweredByHeader: false`
- **Metadata sweep** — dedicated `metadata` / `generateMetadata` on `/catalog`, `/catalog/case-studies`, `/catalog/case-studies/[slug]`, `/catalog/games/[slug]`, `/book`, `/partners/join`
- **A11y verified** — sidebar toggle, notification bell, skip link, focus rings on tappable cards, proper `aria-label`s on icon-only buttons

### Migration notes
- Legacy `.btn`, `.card`, `.badge`, `.input`, `.glass`, `.skeleton`, `text-text-*` utility classes are preserved and aligned to the new token system. New surfaces should prefer the `Button` / `Card` / `Badge` / `Input` primitives directly. *(Note: the legacy `.btn`/`.card`/`.badge`/`.input` classes were fully removed in the May 2026 editorial design pass — see the top of this changelog.)*
- All new server-action consumers must wrap calls in `toast.loading` → `toast.success` / `toast.error` patterns for consistency.
- `AppShell` now requires `notificationCount`; every page that renders `AppShell` fetches `getUnreadCount(user.id)` alongside its primary data.

---

## [Phase 8 — Intelligence & Scale] - 2026-05-13

- **Added** `campaigns`, `campaign_events`, `recommendations`, `api_keys`, `webhook_subscriptions` tables
- **Added** Campaign management pages (`/admin/campaigns`, `/admin/campaigns/[id]`)
- **Added** Recommendation engine page (`/admin/recommendations`)
- **Added** API & Webhook management page (`/admin/api`)
- **Added** Event campaign context page (`/events/[id]/campaign`)
- **Added** `CampaignCard`, `CampaignDashboard`, `RecommendationCard` components
- **Added** `ApiKeyManager`, `WebhookManager` components
- **Added** Query files: campaigns, recommendations
- **Added** Server actions: campaigns, api-management
- **Migration**: `20260403000009_intelligence_tables.sql`

---

## [Phase 7 — Venue & Runway Module] - 2026-05-13

- **Added** `venues`, `placements`, `sponsorship_slots`, `venue_packages` tables
- **Added** Venue dashboard (`/venues/[slug]/dashboard`)
- **Added** Placement management (`/venues/[slug]/placements`)
- **Added** Sponsorship management (`/venues/[slug]/sponsorships`)
- **Added** Venue package builder (`/venues/[slug]/packages`)
- **Added** Embed code generator (`/venues/[slug]/embed`)
- **Added** `PlacementCalendar`, `SponsorshipSlotCard`, `VenuePackageBuilder`, `EmbedCodeGenerator` components
- **Added** Query files: venues, placements, sponsorship-slots
- **Added** Server actions: venues
- **Migration**: `20260403000008_venue_runway_tables.sql`

---

## [Phase 6 — Partner & Reseller Portal] - 2026-05-13

- **Added** `partners`, `partner_users`, `partner_attributions` tables with `user_partner_id()` helper
- **Added** `partner_member` and `partner_admin` role types
- **Added** Partner dashboard (`/partners/[slug]/dashboard`)
- **Added** Partner clients, quotes, commissions, resources pages
- **Added** Partner join/application page (`/partners/join`)
- **Added** Partner attribution entry point (`/p/[code]`)
- **Added** Internal partner management (`/admin/partners`, `/admin/partners/[id]`)
- **Added** `PartnerDashboard`, `PartnerPipelineTable`, `CommissionTracker`, `PartnerOnboardingWizard`, `PartnerResourceCard` components
- **Added** Query files: partners, partner-attributions
- **Added** Server actions: partners
- **Migration**: `20260403000007_partner_tables.sql`

---

## [Phase 5 — Proof of Performance & Reporting] - 2026-05-13

- **Added** `event_reports` and `benchmarks` tables with public share token support
- **Rebuilt** `/events/[id]/reports` — full proof-of-performance page with metrics, predicted vs actual, benchmarks, sharing
- **Added** Public shareable report page (`/report/[token]`)
- **Added** Internal benchmarks page (`/admin/benchmarks`)
- **Added** `PredictedVsActual`, `BenchmarkComparison`, `CostPerLeadCard`, `ReportHighlights`, `ShareableReportBanner`, `RebookCTA`, `MetricCard` components
- **Added** Query files: event-reports, benchmarks
- **Added** Server actions: reports (generate, publish, unpublish)
- **Migration**: `20260403000006_reporting_tables.sql`

---

## [Phase 4 — Live Event Mode & Telemetry] - 2026-05-13

- **Added** `machine_instances`, `telemetry_events`, `leads`, `event_metrics_snapshot` tables
- **Added** Live event dashboard (`/events/[id]/live`) with real-time counters and hourly chart
- **Added** Leads page (`/events/[id]/leads`) with searchable table and CSV export
- **Added** `LiveCounter`, `LiveFeed`, `HourlyChart`, `LeadTable`, `MetricCard`, `MachineStatusCard` components
- **Added** Query files: machine-instances, telemetry, leads, event-metrics
- **Added** Server actions: telemetry (ingest, capture lead, heartbeat, refresh metrics)
- **Added** Zod validation schemas for telemetry
- **Updated** Sidebar with Live Dashboard and Leads navigation
- **Installed** `recharts` for chart components
- **Migration**: `20260403000005_telemetry_tables.sql`

---

## [Phase 3 — Two-Track Quoting Engine] - 2026-05-13

- **Added** `quotes`, `quote_line_items`, `locations` (or `location_tiers`), `prospect_sessions` tables
- **Added** Book Now flow (`/book`, `/book/configure`, `/book/checkout`, `/book/confirmation/[id]`)
- **Added** Guided Proposal intake wizard (`/proposal`, `/proposal/[id]`)
- **Added** Internal quote management (`/admin/quotes`, `/admin/quotes/[id]`)
- **Added** Location tier management (`/admin/locations`)
- **Added** `IntakeWizard`, `ProposalView`, `ValueContextCard`, `QuoteStatusBadge` components
- **Added** Query files: quotes, locations
- **Added** Server actions: quotes (submit, prepare, accept, decline, expire)
- **Added** Zod validation schemas for quotes
- **Migration**: `20260403000004_quoting_engine.sql`

---

## [Phase 2 — Game Catalog & Storefront] - 2026-05-13

- **Added** `machines`, `games`, `machine_games`, `packages`, `package_addons`, `case_studies` tables
- **Added** Public catalog landing (`/catalog`) with hero, machine grid, ROI calculator
- **Added** Machine and game detail pages
- **Added** Case studies listing and detail pages
- **Added** Recommendation quiz (`/quiz`)
- **Added** Public layout for unauthenticated pages
- **Added** Internal catalog management (`/admin/catalog`)
- **Added** `CatalogHero`, `MachineCard`, `GameCard`, `PackageTierCard`, `CaseStudyCard`, `ROICalculator`, `RecommendationQuiz` components
- **Migration**: `20260403000003_catalog_tables.sql`

---

## [Phase 1 — Delivery Lifecycle] - 2026-05-13

- **Added** `notifications`, `messages`, `event_templates`, `qa_items`, `logistics_entries` tables
- **Added** Notifications page (`/notifications`)
- **Added** Per-event communications (`/events/[id]/communications`)
- **Added** QA checklist (`/events/[id]/qa`)
- **Added** Logistics timeline (`/events/[id]/logistics`)
- **Added** Admin templates page (`/admin/templates`)
- **Updated** Sidebar navigation with new sections
- **Updated** Middleware for public routes
- **Migration**: `20260403000002_delivery_lifecycle.sql`

---

## [Phase 0 — Stack Alignment] - 2026-05-13

- **Added** shadcn/ui component library (17 primitives)
- **Added** `cn()` utility, `components.json`, Zod validation schemas
- **Added** RBAC helpers (`requireRole`, `requirePermission`)
- **Added** Rate limiting utility
- **Added** Security headers via `next.config.ts`
- **Added** `.cursor/rules/` with 5 persistent rules
- **Added** `.env.example`, updated `README.md`
- **Updated** `globals.css` with shadcn semantic colour mapping
- **Migrated** existing components to use shadcn primitives and `cn()`

---

## [Stage 2] - 2026-04-03

- Asset upload centre with drag-and-drop
- Approval workflow (request, review, approve/reject)
- Bright.Studio creative service ordering with email notifications
- Creative briefing forms and internal Studio dashboard

---

## [Stage 1] - 2026-04-03

- Project scaffolding (Next.js 16, Tailwind v4, Supabase)
- Dashboard with event list
- Event overview with stage progress, health, milestones
- Supabase Auth with role-based access
- Bright.Blue design system (glassmorphism, custom tokens)
