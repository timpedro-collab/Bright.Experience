# Internal flow audit — Bright.Experience as built (Aug 2026)

Honest assessment of our three commercial journeys, written before reading the sector research so it isn't biased by it. Source of truth: `docs/05-information-architecture.md`, `docs/07-platform-vision.md`, `docs/08-pricing-and-quoting-model.md`, and the codebase.

## 1. Customer (brand) journey

As built: homepage → quiz (capability match, signals carried forward) → either `/book` (configure → checkout → confirmation; instant total for standard packages) or `/proposal` intake wizard (no price at intake → indicative price band → walkthrough call books via Cal.com → price reveal gate → accept/decline → provisioning creates the event at `confirmed` with milestones/tasks). Post-sale: briefing, creative assets with versioning/annotations/approval lock, logistics, phase-based nav (Create → Prepare → Event day → Results), OverToYou "what's on me" block, live telemetry (plays/leads/queue), leads, proof-of-performance report incl. tokened public share.

Strengths (rare in this market): price-band before reveal; quiz → intake signal carry; single calm customer column; measured outcomes; 24h board-ready report; sponsor/report token links.

Honest gaps:
- No availability/calendar dimension anywhere public. A customer cannot check "is a Bright.Vend free on my dates near Birmingham" — the book-now track prices but doesn't promise supply.
- No repeat-booking loop. After an event closes there is no "run it again", "book the next city", or program/multi-event view. Every event is an island; accounts with 5 events get 5 unconnected workspaces.
- No self-serve ROI framing pre-purchase (e.g. estimated plays/leads for their event type/footfall, derived from our benchmarks table which already exists at `/admin/benchmarks`).
- Proposal is strong but the acceptance → briefing handoff still asks the customer to re-enter things we could carry from intake (partially addressed by brief-echo).
- No case-study → quote path (case studies don't deep-link into quiz/intake with the same machine pre-selected).

## 2. Venue journey

As built: `/venues/:slug/dashboard | packages | placements | sponsorships | advertise (public landing) | embed (iframe)`. Venues host machines as placements, see package tiers, sponsorships.

Honest gaps:
- No revenue statement/earnings view (commission depth deliberately gated — but even a projected-earnings line is missing).
- Venue has no tool to *sell* the placement to sponsors: no downloadable/sharable placement pack (photos, footfall claims, expected plays, price), no tokened pitch link equivalent to the organizer sponsor link.
- Embed is a single iframe surface; no white-label mini-page a venue can put on its own domain with its own branding.
- No availability/booking calendar the venue can see for its own floor.

## 3. Organizer journey (trade-show organizers reselling us)

As built: `/organizers/:slug/shows` (portfolio) → show command (run-up readiness or live fleet by zone) → per-machine page (readiness, expected performance, spec sheet built to be forwarded) → `/fleet` → `/sponsors` (the sponsorship book, slots grouped by show, ordered by days-to-doors). Sponsor pitch links are tokened + expiring and show expected performance. Admin console (`/admin/organizers/:id`) is the only onboarding path.

Strengths: readiness boards, expected-performance backed by benchmarks, forwardable spec sheet, sponsorship book.

Honest gaps — this is where "help their sales team sell" is weakest:
- No in-portal quote/price for a slot. A salesperson can pitch (token link) but cannot price, package, or close; everything falls back to us.
- No co-branded collateral: no generated one-pager/PDF with organizer logo + machine + expected numbers + price that a rep can attach to an email.
- No deal registration / pipeline: the organizer can't record "I pitched Nestlé for stand A12" and see status; we can't see their pipeline either.
- No rev-share visibility: nothing tells the organizer's team what they earn per slot sold, so motivation is invisible.
- Sponsor pitch page is per-slot; there is no tiered prospectus (gold/silver/bronze bundles across a show).

## 4. Partner/reseller portal

As built: `/partners/:slug/dashboard | clients | quotes | commissions | resources`. Attribution on quotes exists.

Gaps: same enablement gaps as organizers (collateral generation, white-label client-facing pages), commission statements are display-level.

## 5. Homepage story

As built: hero (Clash Display, product photo + stat chips), proof section (aggregate count-ups), machines showcase, platform section w/ portal preview, Let's-plan sentence completer → quiz, case studies with publication-rights anonymisation, pillars, final CTA. Story currently told: "crowd-stopping machines, measured to the play" — a *product* story.

Not yet told: the *network* story — one platform connecting brands, venues, and organizers, where a machine booked by a brand can sit in a venue that earns from it at a show whose organizer sold it. No surface currently explains the three-sided model to a cold visitor, and each audience (brand/venue/organizer) shares one homepage with no audience-specific path.
