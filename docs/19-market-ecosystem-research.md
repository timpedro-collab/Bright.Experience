# 19 — Market & Ecosystem Research: The Deep-Dive Audit

> **Version:** 1.0.0 · **Status:** current · **Owner:** Product / Founder ·
> **Researched:** 2026-08-02 · ~160 web sources across ~110 organizations.
>
> Deep-dive market research across the full experiential ecosystem — trade-show
> organizers, venues, experiential agencies, sampling operators, direct hire
> competitors, and event-tech/reseller-enablement platforms — audited
> comparatively against Bright.Experience's real flows, with a market-gap
> analysis, a messaging architecture, and a phased implementation plan.
>
> Raw evidence (per-sector notes with every claim URL-sourced) lives in
> [`docs/research/2026-08-market/`](research/2026-08-market/). This document is
> the synthesis. The earlier visual/design teardown is
> [`docs/18-design-research.md`](18-design-research.md); this study deliberately
> covers **systems, flows, commerce and messaging**, not aesthetics.

---

## 1. Executive summary

We researched roughly 110 organizations across six slices of the market:
15 trade-show organizers and their exhibitor platforms, 20+ venues and venue
marketplaces, 24 experiential agencies, 19 sampling/staffing operators and
digital sampling platforms, 20+ direct hire competitors and hardware+SaaS
analogs, and 10 event-tech platforms plus the reseller-enablement tooling
category. Every slice independently confirmed the same headline:

> **Nobody, anywhere, combines a physical crowd-stopping moment with
> per-interaction measurement.** Venues sell impressions. Organizers sell
> signage. Agencies sell bespoke theatre and report in decks weeks later.
> Street sampling captures data on fewer than 1 in 100 samples (a real
> campaign: 512,400 samples distributed, 2,712 data points captured). Digital
> platforms close the attribution loop but cannot create a physical moment.
> Hire companies rent fun and measure nothing. "Measured to the play" has no
> incumbent competitor in any of the six markets studied.

The second-order finding is just as important: **the market is racing toward
exactly the infrastructure we already have — and we aren't telling anyone.**
Sponsorship inventory is becoming e-commerce (A2Z's Event Sales Engine sells
half a show floor self-serve in a week; Freeman's Envision sells venue ad
spots in a cart; Messe Berlin sells €95–€1,200 placements with scarcity caps).
Expected-performance data is becoming the sales currency (Grip's ROI Predictor
forecasts a sponsor's return *before* the show; RX sells category benchmarking
as a paid tier; SponsorUnited prices deals off $13B of comparables). Proof of
performance within days is the industry's loudest anxiety, because it protects
sponsor renewals. We have live telemetry, expected-performance pitch links, and
a 24-hour report — each of which the market is trying to invent — and none of
them is packaged, benchmarked, named, or marketed.

The ten findings that matter most:

1. **The whitespace is confirmed six times over.** Measurable physical
   activation is unoccupied in organizers' prospectuses, venues' media kits,
   agencies' offers, sampling operators' toolkits, hire catalogs and event-tech
   platforms alike.
2. **Sponsorship is the last inventory still sold by phone — and it's
   flipping.** Self-serve sponsorship commerce (carts, SKUs, scarcity, cart-drop
   deep links) is the industry's current frontier. We should ride the wave, not
   watch it.
3. **No sponsorship prospectus anywhere publishes expected-performance data.**
   Our organizer pitch links with expected plays/leads are genuinely unique in
   the market. They should be loudly productized.
4. **Benchmarks are the new brochure.** Buyers expect predicted ranges, not
   adjectives. Our accumulating telemetry corpus is a compounding moat no
   bespoke competitor can ever replicate — and it is currently invisible at
   every pre-sale surface.
5. **The direct competitors beat us on transparency and speed.** Published
   from-prices on product pages, branding add-on price tables, delivery-zone
   tables, and advertised response SLAs ("quote within the hour") are now table
   stakes in UK hire. Premium players hide pricing; the winners publish it.
6. **What makes a reseller actually sell is mechanical**: a pitch link that
   pre-loads the deal, a price they can quote live in the meeting, co-branded
   collateral generated in clicks, deal registration with an SLA and an
   exclusivity window, and real-time commission visibility. Our organizer
   portal has the pitch link; it has none of the other four.
7. **Venues expect a rev-share and already think in machine-placement
   economics** (15–40% of gross, or guarantee-plus-overage). Mid-size venues
   have sponsorship *brochures*, not sponsorship *systems* — a white-label
   "sponsorship shop" is essentially our venue portal, one level deeper.
8. **The 24h report beats the market's 48–72h norm — and reads like an ops
   document.** Jack Morton's ROI/KPI/Insights three-tier hierarchy is the
   canonical way to make the same data speak CFO. Sense's EMR proves predicted
   ROI *before signature* is the most credible measurement move in the
   category.
9. **The post-play journey is absent from all of physical experiential.**
   Real-time CRM lead delivery (Simple Booth pushes leads before the attendee
   leaves the stand), post-trial journeys (SoPost's nearest-store and review
   automation), and lead-quality validation (Sampl filters 20–30% of requests
   as junk) are all proven in adjacent categories and absent in ours.
10. **Multi-sided platforms tell one connected story on one screen** (Swapcard,
    Bizzabo, Zenus's three-door homepage) with named modules and proof numbers.
    Our homepage tells a strong *product* story and no *network* story; the
    venue and organizer sides of the platform are publicly invisible.

---

## 2. Method and scope

Six research agents ran in parallel (Aug 2, 2026), each producing an
evidence-based sector report with every claim sourced to a live page, PDF
prospectus, rate card, help-desk article or press release. In parallel, the
three commercial journeys of Bright.Experience as actually built (customer,
venue, organizer — from `docs/05`, `docs/07`, `docs/08` and the codebase) were
mapped *before* reading the sector findings, so the comparative audit starts
from an unbiased "us today" baseline.

| Slice | Coverage | Raw notes |
|---|---|---|
| Trade-show organizers | Informa, RX, Clarion, Hyve, Easyfairs, Emerald, Messe Frankfurt/Köln/München, Fiera Milano, Comexposium, Web Summit, Money20/20, CES, Tarsus + platforms (MYS, A2Z, ExpoFP, ExpoPlatform, Freeman/Clarity) | [`trade-show-organizers.md`](research/2026-08-market/trade-show-organizers.md) |
| Venues & marketplaces | ExCeL, NEC, Olympia, BDC, Tobacco Dock, Broadwick, Javits, McCormick, LVCC, Moscone, RAI, Messe Berlin, ACV + Hire Space, VenueScanner, HeadBox, Tagvenue, Peerspace, Cvent CSN + O2/Wembley/OVG/Relo | [`venues.md`](research/2026-08-market/venues.md) |
| Experiential agencies | Freeman, GES/Spiro, Momentum, Jack Morton, GPJ, Imagination, TRO, Amplify, Sense, MKTG, Wasserman, NVE, Superfly/OGX, Set Creative, 2Heads, Live Union, Identity, Inspira, Mosaic, BeCore, Kreate, PrettyGreen, Cake/Havas Play, Factory 360 | [`experiential-agencies.md`](research/2026-08-market/experiential-agencies.md) |
| Sampling & staffing | Elevate, Kru Live, Mash, Purity, Hotcow, iD, REL/Smollan, Circle, Relish, Attack!, ATN, FUEL, iMP, PopHaus + SoPost, Sampl, Peekage, Odore, Send Me a Sample + Tesco/dunnhumby, Kroger/84.51° | [`sampling-staffing.md`](research/2026-08-market/sampling-staffing.md) |
| Direct hire & analogs | Fun Experts, Arcade Direct, FunPro, Leisure King, Fizzbox/Book a Party + IEG, National Event Pros, TapSnap, US claw cluster + PBSCO/Salsa, Simple Booth, Snappic, Touchpix + Quadrant2Design, Nimlok, Apex, neventum, Expo Exchange, ExpoCart + Brame, Playable, Drimify, Komo | [`hire-competitors-marketplaces.md`](research/2026-08-market/hire-competitors-marketplaces.md) |
| Event tech & reseller enablement | Cvent, Bizzabo, Swapcard, ExpoPlatform, Grip, MYS, A2Z, Zenus, RainFocus + Impartner, PartnerStack, Crossbeam, CPQ/TCMA patterns, SponsorUnited/SponsorPitch, media-kit builders, proof-of-performance norms, machine-placement rev-share tooling | [`event-tech-reseller.md`](research/2026-08-market/event-tech-reseller.md) |

The internal baseline is [`internal-audit.md`](research/2026-08-market/internal-audit.md).

---

## 3. Where we stand today (the honest baseline)

**Customer (brand) journey, as built:** homepage → quiz (signals carried
forward) → `/book` (instant total) or `/proposal` intake (price band →
walkthrough → reveal gate → accept) → provisioning → briefing → versioned
creative approvals → logistics → phase-based event workspace → live telemetry →
leads → 24h proof-of-performance with tokened public share. Rare strengths for
this market: price bands before reveal, quiz-to-intake signal carry, a live
brand-facing dashboard, the 24h report. Honest gaps: no availability dimension
anywhere public; no repeat-booking loop (every event is an island); no
self-serve ROI framing pre-purchase despite an existing benchmarks table; case
studies don't deep-link into the quote path.

**Venue journey, as built:** dashboard, packages, placements, sponsorships,
public advertise page, embed iframe. Gaps: no earnings/revenue statement view;
no tool for the venue to *sell* a placement to sponsors (no shareable placement
pack, no tokened pitch link equivalent); embed is one iframe, not a white-label
page; no availability calendar for their own floor.

**Organizer journey, as built:** show portfolio → show command (run-up
readiness or live fleet) → per-machine pages with expected performance and a
forwardable spec sheet → fleet → sponsorship book with tokened, expiring pitch
links. Strengths: readiness boards, benchmark-backed expected performance —
already unique in market. Gaps — and this is where "help their sales team
sell" is weakest: no in-portal price/quote for a slot (a rep can pitch but not
price, package or close); no co-branded collateral; no deal
registration/pipeline; no rev-share visibility; no tiered prospectus builder.

**Partner/reseller portal, as built:** dashboard, clients, quotes, commissions,
resources; attribution on quotes. Same enablement gaps as organizers.

**Homepage story, as built:** a strong single-audience *product* story
("crowd-stopping machines, measured to the play"). The three-sided network —
brands book, venues host and earn, organizers resell — is not told anywhere
public, and each audience shares one homepage with no dedicated path.

---

## 4. Sector findings (distilled)

### 4.1 Trade-show organizers — sponsorship is flipping to e-commerce

Two funnel archetypes dominate. The majors (Informa, Clarion, Hyve,
Money20/20, Koelnmesse) sell sponsorship consultatively: enquiry form → rep →
bespoke package, no public pricing, weeks of latency. Meanwhile a self-serve
commerce wave is arriving fast: **A2Z's Event Sales Engine** (Oct 2025) puts
booths + sponsorships + add-ons in one cart with live inventory and
**cart-drop deep links** a rep can text mid-call ("more than half the floor
sold within the first week"); **Map Your Show** embeds sponsorship sales inside
the booth application at the moment of maximum commitment; **Web Summit**
literally runs a Shopify add-on store; the German Messen run service e-shops
with +25% express surcharges for late orders. Exhibitor ROI dashboards are now
table stakes at the majors (RX's Exhibitor Dashboard with a paid PRO
benchmarking tier, Informa's cross-event Lead Insights, Easyfairs' EasyGo tiers
marketed by expected lead uplift) — but they all measure *leads and profile
views*, never physical engagement, queues, dwell, or play.

The confirmed whitespace: every prospectus (CES, Money20/20, Koelnmesse, BIT)
has a "custom activations" line — always contact-sales, bespoke, unpriced, and
**never performance-quantified**. Branded claw/arcade machines reach shows only
via exhibitor-direct rental agencies, with no organizer margin, no data
integration, no sponsorship packaging. And organizers' loudest documented
commercial anxiety is proving sponsor ROI fast enough to protect renewals —
which is precisely what a 24h board-ready report is. Position it to organizers
as **sponsorship-retention infrastructure**, not as a game.

Also live right now: Freeman + Clarity Media launched an AI sponsorship
marketplace (Dec 2025) looking for fulfilment partners — a distribution rail
where Bright machines could surface as listable, purchasable sponsorship items
inside tools organizers already use.

### 4.2 Venues — everything is sold on impressions; nothing on participation

Venue sponsorship is productizing into storefronts: at LVCC and Moscone,
sponsor placements are bought in actual carts (Freeman's Envision: "Digital
Signage Ad Spot — $4,000, 8-second spot, limited to 4 per company," with
creative deadlines and rush fees); Messe Berlin's Advertising Shop sells
micro-priced units (Stand Logo €95 → Mobile Digital Display €1,200) with
scarcity caps ("only 6 exhibitors per position"); RAI Amsterdam runs a full
webshop with a Promotions & Visibility category (850-screen network). Every
one of these units is priced on location and footfall. **No venue measures
participation.** The only measurement plays in the category are McCormick
Place's Scanalytics floor sensors (anonymous foot traffic) and Relo Metrics
(sports-only exposure valuation).

Venues expect a cut of anything monetized inside their walls: LVCVA takes 15%
of gross public-area ad revenue; the amusement route-operator norm is 15–40%
of machine gross, or minimum-guarantee-plus-overage — a mental model venue
commercial teams already hold. Mid-size venues (Business Design Centre, Tobacco
Dock) have sponsorship *brochures behind an email*, not systems. And the
stadium world has already built the full stack we envision: the O2's Virgin
Media Gamepad is a permanent branded gaming attraction (50k visitors in six
months) brokered by AEG's in-house sponsorship arm — our proposition at
flagship scale. The pitch to mid-size venues is **"AEG Global Partnerships +
Relo Metrics, in a box."**

Marketplace tactics worth stealing: Hire Space's data-backed "quotes in 10
seconds" and its MCP integration putting venue search inside Claude/ChatGPT;
HeadBox's `llm-info` page written for AI assistants; Tagvenue's
real-booking-data upfront pricing; Cvent's "need dates" (venues flagging dark
days — prime slots for hosted machines); NEC's +20%/+30% late-order
surcharges.

### 4.3 Experiential agencies — measurement claimed everywhere, productized nowhere

Every one of 24 agencies leads with "measurable," but delivery splits into
named platforms that are really organizer/exhibitor logistics (Freeman's
Fuzion/Quant/ESP, GES Expresso/Visit), agency-internal BI (MomentumBi, with
three ML patents), or frameworks operated by the agency (Jack Morton's ROX,
GPJ's Experience Impact Score, Sense's EMR, Amplify's four pillars). **No
agency shows a brand-facing live activation dashboard.** Wasserman hand-builds
per-client dashboards as billable work — the giants are manually assembling
what we've productized.

The most credible measurement moves in the category: **Sense's EMR** quotes
predicted ROI and incremental profit *before contract signature*, and its
SKUtrak partnership verifies sales at EPOS level; **Identity** builds
measurement frameworks into every brief "before a venue is chosen";
**Imagination's "engaged minutes"** is a currency CMOs can compare against
media buys; **Jack Morton's ROI/KPI/Insights** hierarchy separates what the
C-suite, the VP and the working team each see. Client journeys are uniformly
weak — generic contact forms, "shoot us an email" (GPJ), zero pricing — so
third-party cost guides rank for the queries agencies refuse to answer. Our
quiz → intake → price-banded proposal has no analog in the category and should
be attacked head-on, not soft-pedaled.

Also notable: 2Heads markets "Invest Once, Reuse a Hundred Times" — the
reusable-asset economics that our machine catalog operationally *is*; Kreate
wins on a single accountability number (99.85% shift compliance) — we should
publish equivalents (uptime %, on-time install %, % of reports under 24h);
and everyone names/trademarks their frameworks — ours are generic until named.

### 4.4 Sampling & staffing — the "measured sampling" wedge

The market splits into two camps that don't overlap. Physical sampling
agencies deliver theatre but barely measure: iD's Lipton campaign distributed
**512,400 samples and captured 2,712 data points (~0.5%)**. Digital platforms
can't create physical moments but track individuals from request → trial →
review → **verified retail purchase**: SoPost claims 70%+ opt-ins with a live
per-SKU Stock page and nearest-store attribution; Sampl's SamplMatch filters
20–30% of requests as fraud/freebie-hunters before fulfilment and syncs to
Salesforce/HubSpot/Klaviyo; Tesco sells sampling self-serve through
dunnhumby's Sphere with Clubcard closed-loop incrementality; Kroger reports
400%+ sales lift using control-store baselines. Retail media is raising
measurement expectations for all physical trial — a festival stand reporting
"samples handed out" now looks primitive.

A machine dispensing samples measures **every interaction** — play started,
duration, win/loss, lead, queue, dwell. We can honestly claim near-100%
interaction measurement where street sampling achieves under 1%. That
contrast — plus new metrics we can define and own ("cost per engaged sample,"
"cost per verified lead per machine-day" vs the industry's £0.44 cost per
distributed sample) — is a landing page, a sales narrative, and a category
claim nobody can follow.

Best-in-class packaging to copy: **Elevate's IMPACT** sells telemetry as a rate
card (Starter = 12 KPIs / Advanced = KPI catalogue / Custom), with
benchmarking vs previous campaigns and industry data.

### 4.5 Direct hire competitors & hardware+SaaS analogs — they win on friction, we win on everything after

UK hire has converged on quote baskets and published day-rates: Arcade Direct
publishes per-machine custom-branding prices (£495–£945/day including wrap)
and a delivery-zone price table; FunPro publishes branding panel prices
(£150/£295); The Fun Experts' flow — basket → callback within 1 hour →
same-day quote → scripted chase → deposit — is the speed benchmark, and
**advertised response SLAs, not price, are the competitive weapon**. Nobody in
hire measures anything; the branding workflow ceiling is "email us artwork,
we return a proof" — our versioned portal approvals are a category first.

The photo-booth SaaS sector (closest business-model analog: hardware + brand
customization + data + dashboard) shows what brands now expect from the data
side: Simple Booth pushes leads to CRMs **in real time** via API (89% opt-in
claimed), sells compliance (age gates, consent, custom ToS) as its premium
$249/mo tier; PBSCO offers **shareable live analytics links** clients forward
to sponsors; Snappic generates logo-conditioned AI previews. Digital
activation software (Playable, Brame, Komo, Drimify) leads with self-serve
builders, instant previews, published pricing ladders, and Komo's **Feeds**
push live leaderboards/UGC to big screens — the venue-scale version of our
on-machine moments.

Exhibition procurement is converging on structured briefs → 3–5 scored,
side-by-side proposals (Expo Exchange auto-scores quotes; neventum assigns a
named human per city). Quadrant2Design's multi-event economics (60% cheaper
reinstalls, free storage, lifetime design re-use) prove retention economics
sell — nobody does this for game machines. And stand builders (Nimlok, Apex)
already list "games & activations" as service lines they source: a
partner/white-label channel, not just competition. Nimlok is also the only
stand builder selling measurement (Insights heatmaps + portal) — the nearest
thing to our telemetry in that world.

### 4.6 Event tech & reseller enablement — the mechanics of "sell it in one meeting"

Every winning platform tells a "one connected system" story on its homepage
with named modules and role-based doors (Swapcard: "From fragmented tools to a
single revenue system," seven module cards; Zenus splits Retail Brands /
Organizers / Exhibitors, hero case study "16/16 booth renewals"). Proof
numbers sit above the fold. ROI data is packaged **for the organizer's sales
team**: Grip Pulse includes an ROI Predictor forecasting a sponsor's return
before the show plus anonymized peer benchmarks, explicitly pitched as
rebook/upsell ammunition; MYS Insights flags at-risk exhibitors.

Self-serve sponsorship commerce lifts revenue measurably: Swapcard's Exhibitor
Marketplace claims +15–30% revenue per exhibitor. The reseller-enablement
canon is consistent across categories: sub-10-field deal registration with
24–72h SLAs and time-bound exclusivity; partner CPQ ("quotes in minutes, not
days"); Impartner-style co-branded collateral auto-generated from locked
templates; PartnerStack-style real-time commission visibility ("rev-share
visibility is a retention feature"); ROI calculators whose state encodes in
the URL so a rep configures it live and sends the link. Sponsorship tiering
physics: 3–4 tiers, geometric 1:2:4:8 pricing, top-tier scarcity, tiers
laddering *access and data* rather than logo size — immersive activations sit
naturally at the top tier, which is exactly where an organizer should slot a
Bright machine.

Proof-of-performance norm is 48–72h; our 24h beats it and should say so.
Cvent's resented per-registrant metered pricing is a cautionary tale:
transparent flat pricing is a wedge competitors (Swapcard) actively run.
Also notable: RainFocus shipped a native MCP server so AI agents can query
live event data — AI-assistant distribution has arrived in this industry
(Hire Space MCP, HeadBox/Sampl `llm-info` pages).

---

## 5. The seven cross-market patterns

1. **Participation is unmeasured everywhere.** Impressions, footfall, badge
   scans and profile views are the ceiling in every sector. Per-interaction
   physical measurement doesn't exist outside Bright.
2. **Sponsorship and placements are becoming SKUs.** Carts, unit prices,
   scarcity caps, creative deadlines, rush fees, cart-drop links. The
   consultative prospectus is dying from the bottom up.
3. **Expected performance is the new sales collateral.** Predictors,
   benchmarks, "peer median" calculators, valuation databases. Whoever owns
   the dataset owns the conversation.
4. **Speed and transparency convert.** Published from-prices, add-on and
   delivery price tables, response SLAs, instant estimates, deposit/pay-later.
   Opacity is a legacy behavior that buyers now route around via third-party
   cost guides.
5. **Reseller success is mechanical, not motivational.** Pitch links,
   in-meeting pricing, co-branded collateral, deal registration with SLA and
   exclusivity, live commission visibility. Miss any one and the channel
   stalls.
6. **The proof loop is extending past the event.** Real-time CRM delivery,
   post-trial journeys, review capture, verified purchase attribution, renewal
   scorecards. The report is becoming a pipeline, not a PDF.
7. **Platforms win with one connected story, named modules, and role doors.**
   Multi-sided businesses that make each side's value legible on one screen
   out-convert feature lists.

---

## 6. The whitespace map (gaps nobody owns)

| # | Gap | Evidence | Bright's claim |
|---|-----|----------|----------------|
| G1 | Measured physical participation | All six slices; only Scanalytics (anonymous footfall) and Relo (sports exposure) even try | Machines natively produce plays/leads/queue/dwell per placement |
| G2 | Turnkey measurable activations as organizer sponsorship inventory | Every prospectus's "custom activations" line is contact-sales, unpriced, unquantified; claw rentals bypass organizers entirely | Activation SKU: machine + placement + expected performance + rev share |
| G3 | Performance data in sponsorship sales | No prospectus anywhere publishes expected engagement | Pitch links with expected plays/leads already exist — productize and market them |
| G4 | Sponsorship systems for mid-size venues | BDC's inventory is a PDF behind an email; stadiums have in-house sales arms, exhibition venues have nothing | White-label sponsorship shop = venue portal + placement SKUs + earnings dashboard |
| G5 | Measured sampling | 512,400 samples → 2,712 data points; digital platforms have no physical presence | Near-100% interaction capture; "cost per engaged sample" as an owned metric |
| G6 | Renewal ammunition for organizers | Proving sponsor ROI fast is organizers' loudest anxiety (Bizzabo, VenuIQ, CrowdComms) | 24h board-ready report positioned as sponsorship-retention infrastructure |
| G7 | Repeat-campaign economics for activations | Quadrant2Design proves it for stands; nobody does it for machines | Stored wraps, re-run pricing, season packages, YoY comparisons |
| G8 | Cross-venue activation marketplace | Hire Space et al. transact space; Envision is per-show; nobody sells measurable placements across a venue network | Our venue network + machines + telemetry is exactly that supply |
| G9 | Dark-day venue monetization | Cvent invented "need dates" for hotels; venues have zero footfall products between tenancies | Hosted machines earn during gap weeks |
| G10 | Lead validation for events | SamplMatch filters 20–30% junk digitally; nobody validates event-captured leads | "Verified leads" as a defensible procurement number |

---

## 7. Comparative flow audit — what the market does better than us

**Customer journey (pre-sale):** published from-prices, branding and
delivery-zone price tables on product pages (Arcade Direct, FunPro); advertised
response SLAs (Fun Experts' 1 hour); instant data-backed estimates (Hire
Space's 10 seconds — we already have price-band logic and benchmarks to power
this); predicted performance bands at proposal time (Sense EMR — no agency can
automate it; we can); persistent quote baskets; proposal microsites the
internal champion can circulate (Quadrant2Design); deposit-to-hold, pay-later
and amendable scope (Fizzbox); "build your business case" pages for the
internal champion (Money20/20, CES).

**Customer journey (delivery & post):** instant logo-on-machine previews at
briefing (Snappic/Touchpix; our versioned approval stays for print-ready art);
real-time CRM/webhook lead delivery (Simple Booth, Komo); shareable live
dashboard links (PBSCO, TapSnap — a growth loop with "Powered by Bright"
footers); three-audience report structure (Jack Morton); benchmark context on
every stat (RX PRO, Freeman); engaged-minutes as a currency (Imagination);
post-play journeys — nearest stockist, review request, discount redemption
(SoPost, Odore); lead-quality scoring (Sampl); sample/prize stock telemetry
pages (SoPost's Stock page); big-screen leaderboard feeds (Komo);
follow-up nudges ("68% of your leads haven't been contacted" — RX);
compliance as a premium tier (Simple Booth Select); campaign workspaces with
stored-wrap re-run economics (Quadrant2Design).

**Venue journey:** placement-as-SKU inventory registers with location codes,
caps and approval steps (LVCC/Moscone/Envision); revenue-model configurators
matching structures venues already know (rev-share % / flat / guarantee+
overage) with live telemetry-verified earnings (Vendric's "commission day in
one click"); dark-day calendars (Cvent need dates); embeddable
"what your venue could earn" widgets; white-label venue-branded pages with
attributed lead routing (ZINFI microsite pattern); responsiveness-ranked
partners (VenueScanner/Tagvenue).

**Organizer journey:** cart-drop deep links (A2Z Sponsorship Link Builder —
the closest existing analog to our pitch links, but transactional); in-portal
pricing so a rep can quote live (partner CPQ: "minutes, not days"); co-branded
collateral generators (Impartner); deal registration with 24h SLA and
exclusivity countdowns; rev-share dashboards (PartnerStack); prospectus-ready
inventory blocks matching the tier-matrix format organizers already publish;
task-linked fulfilment where the purchase spawns the checklist (A2Z EDC, MYS
ERC); organizer-visible order dashboards (BDC/RAI); ROI-predictor ammunition
for reps (Grip Pulse); portfolio analytics for repeat brands (Informa Lead
Insights).

**Homepage/story:** three-door role-split homepages with named modules and
proof numbers above the fold (Zenus, Swapcard); benchmark stat pages ("the
Bright Index"); annual ungated research reports as authority (Inspira,
Freeman); plain-language FAQ pages that win cost/ROI queries (Identity);
`llm-info` pages and MCP presence for AI-assistant distribution (HeadBox,
Hire Space, Sampl, RainFocus); published operational SLA stats (Kreate's
99.85%).

---

## 8. Messaging & story architecture

### 8.1 The thesis to tell

Today the homepage tells one story to one audience: *brands, our machines stop
crowds and we measure it.* The research says the stronger story — the one no
competitor can tell — is the **network story**:

> **One platform connecting brands, venues, and organizers around
> crowd-stopping, measured activations.** A brand books a machine and watches
> it perform live. A venue hosts it and earns from every play. An organizer
> sells it as top-tier sponsorship inventory with performance numbers no
> prospectus has ever carried. Every activation makes the dataset — and every
> future prediction — stronger.

This is the Swapcard/Zenus pattern applied to physical activations: one hero,
three doors, named modules, proof numbers. It also finally makes the venue and
organizer portals *publicly legible* — today they're invisible until an admin
invites you.

### 8.2 Naming (cheap, high-leverage)

The category norm is named IP (ROX, Brand Gravity™, EMR, Konnected™, IMPACT).
Ours are generic until named. Candidates to decide on (owner decision, see
build plan): the measurement system (e.g. **PlayProof™** — "measured to the
play" stays the tagline, PlayProof becomes the framework), the benchmark corpus
(**The Bright Index**), and the modules as a card grid (Catalog, Studio, Live,
PlayProof Report, Organizer Desk, Venue Hub).

### 8.3 Per-audience narratives

- **Brands (customer role):** "Sampling works — now prove it." Lead with the
  measurement contrast (<1% vs every play), engaged minutes as the currency,
  predicted performance bands before you sign, leads in your CRM before the
  stand packs down, board-ready proof in 24 hours (vs the industry's 48–72h —
  say it). Speak CFO at the top of the report, ops at the bottom.
- **Venues:** "Your floor, earning. AEG Global Partnerships in a box." Machines
  as measured placements with familiar economics (rev-share / guarantee +
  overage), live earnings statements, dark-day monetization, and a sponsorship
  shop a mid-size venue could never staff. Anchor story: the O2's Virgin Media
  Gamepad — a permanent branded game attraction at flagship scale.
- **Organizers:** "The top-tier sponsorship your prospectus is missing — with
  numbers." An activation SKU their reps can pitch, price and close in one
  meeting; expected-performance pitch links no competitor's prospectus can
  match; a 24h sponsor report that protects renewals; visible rev-share.
- **The homepage visitor (cold):** the network story above, then the three
  doors, then proof ("X shows, Y venues, Z million measured plays").

---

## 9. The build plan

Six phases, ordered by leverage-to-effort. Each item cites its "why" (the
finding it answers). Effort: S (≤1 day), M (2–4 days), L (1–2 weeks).
Delegation guide: **[C]** = composer-agent-suitable (mechanical, pattern
exists in codebase), **[F]** = craft/judgment work (copy, IA, pricing logic,
new commercial mechanics).

### Phase 1 — Tell the story & publish the proof (marketing site)

The cheapest, highest-leverage phase: no new systems, mostly new surfaces over
existing data.

1. **Three-door network homepage section + role landing pages** for venues and
   organizers (`/venues` and `/organizers` public marketing pages — they don't
   exist). Named module card grid. Proof numbers above the fold. *(Why: §8.1;
   Zenus/Swapcard pattern; our venue/organizer sides are publicly invisible.)*
   — L, [F]
2. **Published "from £X/day" price bands + branding add-on prices +
   delivery-zone table on machine detail pages.** Keep exact pricing in
   proposals. *(Why: table stakes in UK hire; transparency is the wedge vs
   contact-sales incumbents.)* — M, [C] once pricing decided ([F] for the
   pricing decision, goes to `OWNER-TODO.md`)
3. **Performance-backed catalog pages:** per machine format, lifetime stats
   from telemetry (events run, avg plays/day, lead opt-in rate, top verticals).
   *(Why: no bespoke agency can ever publish this; converts catalog from
   brochure to evidence.)* — M, [C] (data layer) + [F] (presentation)
4. **Response-SLA badge on the intake wizard + confirmation email** ("proposal
   within 1 business day") and an internal ops target to match. *(Why: speed,
   not price, is the stated conversion driver in UK hire.)* — S, [C]
5. **"Build your business case" page** (cost bands vs expected plays/leads,
   CFO-ready framing, downloadable one-pager) + **plain-language FAQ**
   answering cost/ROI/logistics. *(Why: Money20/20/CES champion-enablement
   pattern; Identity's FAQ wins the queries agencies refuse to answer.)* — M, [F]
6. **"Measured Sampling" landing page** leading with the <1% vs 100% capture
   contrast and the cost-per-engaged-sample metric. *(Why: §4.4 wedge; owns
   "sampling that converts" query space.)* — M, [F]
7. **`llm-info` page** (machine-readable brand/product facts for AI
   assistants). *(Why: HeadBox/Sampl pattern; AI-assistant distribution has
   arrived; near-zero cost.)* — S, [C]
8. **Publish operational SLA stats** once we can compute them (uptime %,
   on-time install %, % reports <24h). *(Why: Kreate's single-number
   accountability pattern.)* — S data / [F] claim vetting

### Phase 2 — Prove it upfront (quote → proposal)

9. **Predicted performance bands in proposals**: alongside the price band,
   auto-insert telemetry ranges for machine × venue type × duration ("this
   format at 3-day UK trade shows: 900–1,400 plays, 280–450 opted-in leads").
   The benchmarks table already exists (`/admin/benchmarks`); this surfaces it.
   *(Why: Sense's EMR is the most credible measurement move in the category;
   we can automate what they do manually.)* — M, [F] (band logic) + [C] (surfacing)
10. **Instant estimate after the quiz** (Hire Space "quotes in 10 seconds"):
    price band + expected-performance band immediately on completing intake,
    before human follow-up. *(Why: kills the biggest funnel friction; we
    already compute bands server-side.)* — M, [C]
11. **Proposal as shareable microsite** hardening: validity countdown,
    "forward to a colleague," champion-friendly summary block. *(Why:
    Quadrant2Design's password-protected proposal sites; NEP's 5-day validity
    urgency.)* — M, [C]
12. **Deposit-to-hold / pay-later / amendable-scope options at acceptance.**
    *(Why: Fizzbox mechanics are proven conversion drivers; suits SMB/venue
    segments.)* — L, [F] (commercial design) — gate on owner decision
13. **Add-ons at acceptance** (prize restock, extra days, lead-capture
    upgrades as one-click additions on an accepted proposal). *(Why: Peerspace
    add-ons-in-checkout; capability vocabulary already exists.)* — M, [C]

### Phase 3 — The organizer sales engine (the reseller thesis)

The deepest gap vs. the clearest playbook. Goal: **an organizer's rep can
pitch, price, and close a Bright slot in one meeting.**

14. **Pitch Link Builder v2**: co-branded (organizer logo), live
    expected-performance band, tier pricing, embedded ROI mini-calculator with
    URL-encoded state, "Reserve this slot" CTA, and open/dwell tracking
    surfaced to the rep ("sponsor viewed your pitch 3×"). Extends the existing
    tokened pitch links. *(Why: A2Z Link Builder + live media-kit + SponsorFlo
    tracking patterns; the single highest-leverage reseller mechanic.)* — L, [F]
15. **Slot pricing in the organizer portal** so the pitch carries a real price
    band, not "call us." *(Why: partner-CPQ finding — if the rep can't price
    live, the deal dies in email limbo.)* — M, [F]
16. **Deal registration + slot holds**: ≤8 fields, instant
    duplicate/exclusivity check, 24h approval SLA, 14-day exclusivity
    countdown on the readiness board. Reverse registration: we push inbound
    brand leads for that show to the organizer as pre-filled deal shells.
    *(Why: canonical channel mechanics; protects and motivates the rep.)* — L, [F]
17. **Rev-share dashboard**: accrued commission per closed sponsorship,
    pipeline by stage, payout statements as one-click PDFs. *(Why:
    PartnerStack — commission visibility is what keeps reps pitching us over
    easier inventory; Vendric's one-click statements.)* — M, [C] once the
    commercial terms exist ([F])
18. **Prospectus-ready inventory blocks**: per-slot PDF/HTML export formatted
    to drop into an organizer's existing tier matrix (photo, footprint, power,
    price band, expected performance). *(Why: meets organizers inside the
    artifact they already sell with; no prospectus has performance data.)* — M, [C]
19. **Sale → fulfilment task spawning**: a sold slot auto-creates the
    creative/prize/logistics checklist visible to organizer AND sponsor, with
    phased deadline reminders. *(Why: A2Z EDC / MYS ERC pattern; kills "any
    update?" threads; we already have tasks + readiness derivation.)* — M, [C]
20. **Co-branded one-pager generator** (organizer logo + machine + numbers +
    price in locked templates). *(Why: Impartner pattern, built for reps with
    no marketing team.)* — M, [C] after template design [F]

### Phase 4 — Venue yield (the hosting thesis)

21. **Placement-as-SKU register**: each machine slot = coded unit (location,
    footfall estimate, dates, price band, availability, creative deadline,
    per-sponsor cap) with a venue approval step. *(Why: LVCC/Moscone/Envision
    prove placements sell as SKUs; gives packages/placements pages real
    commercial objects.)* — L, [F]
22. **Revenue-model configurator + live earnings**: venue picks rev-share % /
    flat / guarantee+overage; dashboard shows telemetry-verified earnings per
    machine and monthly statement PDFs. *(Why: matches the mental model venue
    teams already have; Vendric's trust-through-telemetry.)* — L, [F] (model)
    + [C] (statements)
23. **Dark-day calendar** ("make this week available for sponsorship").
    *(Why: Cvent need-dates; venues have zero products for gap weeks.)* — M, [C]
24. **Embeddable earnings widget + white-label venue page** ("Host a Bright
    machine — see what your venue could earn"), venue-attributed lead routing.
    *(Why: ZINFI microsite pattern; upgrades the existing embed from content
    to acquisition.)* — M, [C]

### Phase 5 — Customer lifecycle depth (keep the proof compounding)

25. **Three-audience 24h report restructure**: executive summary
    (cost-per-lead, cost-per-engaged-minute, vs benchmark) → KPI detail → ops
    learnings. Adopt **engaged minutes** as a headline metric. *(Why: Jack
    Morton hierarchy + Imagination currency; same data, CFO-grade story.)* — M, [F]
26. **Benchmark layer in telemetry + reports** ("vs your last event," "vs
    venue-class median"). *(Why: RX PRO / Freeman; benchmarks are the moat and
    the upsell.)* — L, [C] (compute) + [F] (framing)
27. **Real-time lead delivery**: webhook + named CRM connectors (HubSpot,
    Salesforce, Klaviyo) — "leads in your CRM before the stand is packed
    down." Premium tier. *(Why: Simple Booth/Komo set the expectation; 24h is
    slower than mid-event.)* — L, [C] against documented integration stubs
28. **Lead-quality scoring**: dedupe repeat players, validate emails, flag
    disposable domains; report "verified leads" separately. *(Why: SamplMatch;
    makes our lead number procurement-defensible — G10.)* — M, [C]
29. **Post-play journey automation**: on lead capture, branded
    where-to-buy/review/discount flow with open/click/redeem in the 24h and
    30-day reports. *(Why: SoPost/Odore; extends the story past event day.)* — L, [F]
30. **Shareable live-dashboard link** per activation (view-only, expiring,
    "Powered by Bright.Experience"). *(Why: PBSCO/TapSnap; a growth loop.)* — S, [C]
31. **Prize/sample stock telemetry page** with low-stock notifications.
    *(Why: SoPost Stock page; operationally load-bearing for tours.)* — M, [C]
32. **Instant wrap preview at briefing** (logo composited on the machine
    render; versioned approval stays for print-ready art). *(Why:
    Snappic/Touchpix; accelerates both the sale and the brief.)* — L, [F]
33. **Campaign workspace + re-run economics**: group activations, "run it
    again" with stored wrap, re-run pricing, YoY comparisons. *(Why:
    Quadrant2Design retention economics — G7; fixes "every event is an
    island.")* — L, [F]
34. **Compliance tier** (age gates, consent text, DPA, retention controls) as
    a paid add-on. *(Why: Simple Booth Select monetizes enterprise
    risk-aversion; UK/EU procurement demands it.)* — M, [C] after legal review

### Phase 6 — Authority & channels (compounding, ongoing)

35. **"The Bright Index" benchmark page + annual "State of Play" report**,
    ungated, from anonymized fleet telemetry. *(Why: we may hold the only
    structured dataset of branded-game engagement in existence; Inspira/Freeman
    authority pattern.)* — M, [F]
36. **Marketplace/rail listings**: pursue listing as a fulfilment partner on
    the Freeman/Clarity sponsorship marketplace and inside
    ExpoPlatform/MYS-style sponsorship catalogs. *(Why: distribution where
    organizers already buy; commercial motion, not code.)* — ongoing, owner-led
37. **Trade partner channel**: stand builders (Nimlok, Apex) and
    experiential/staffing agencies as white-label resellers (their brand on
    the report, our machines and telemetry underneath) — the partner portal
    already exists to carry it. *(Why: they already list "games & activations"
    as sourced services; turns competitors into distribution.)* — M portal
    work [C], commercial [F/owner]
38. **MCP server exposing catalog search + quote intake.** *(Why: Hire
    Space/RainFocus precedent; being bookable inside AI assistants is a live
    channel in this exact industry.)* — L, [F]

### Sequencing note

Phases 1–2 are pure conversion leverage on existing data and should ship
first. Phase 3 is the strategic bet the research most strongly supports (G2,
G3, G6): it turns the organizer portal from a reporting surface into a sales
engine. Phase 4 mirrors it for venues. Phase 5 items are individually
shippable and can interleave. Phase 6 compounds everything. Owner decisions
needed before build: public price bands (item 2), deposit/pay-later terms
(12), rev-share standard terms (17, 22), framework naming (§8.2) — these
belong in `OWNER-TODO.md`.

### What we should *not* do

- **Don't chase full self-serve checkout for bespoke activations.** The
  research shows self-serve works for standardized SKUs (ExpoCart, Envision);
  our proposal track with reveal gates is the right model for tailored work.
  Extend self-serve only where the product is standard (book-now track,
  add-ons, organizer slot SKUs).
- **Don't build metered pricing.** Cvent's per-registrant fees are the most
  resented mechanic found anywhere in the research. Flat, transparent,
  per-activation.
- **Don't try to out-agency the agencies.** No annual-retainer strategy
  practice, no bespoke one-off builds sold as services. The moat is the
  productized, benchmarked, repeatable unit — 2Heads and OGX prove the market
  is drifting our way.
- **Don't add a fourth audience (sponsors-as-users) yet.** Sponsor personas
  remain deliberate deferrals (`docs/07`); pitch links and shared dashboards
  serve sponsors without another portal to maintain.

---

## 10. Appendix — evidence

Per-sector raw research (every claim URL-sourced), plus the pre-research
internal audit baseline, is preserved in
[`docs/research/2026-08-market/`](research/2026-08-market/):

- `trade-show-organizers.md` — 15 organizers, 6 platforms
- `venues.md` — 20+ venues, marketplaces, stadium operators
- `experiential-agencies.md` — 24 agencies and service giants
- `sampling-staffing.md` — 19+ agencies and digital platforms
- `hire-competitors-marketplaces.md` — 20+ direct comparables
- `event-tech-reseller.md` — 10 platforms + enablement patterns
- `internal-audit.md` — Bright.Experience journeys as built (Aug 2026)
