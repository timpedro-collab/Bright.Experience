# 20 — Pricing & Packaging Model

> **Version:** 1.0.0 · **Status:** current (bands are placeholder pending owner
> sign-off — see [`OWNER-TODO.md`](../OWNER-TODO.md)) · **Owner:** Commercial /
> Founder · **Written:** 2026-08-02.
>
> The evidence-backed three-tier + bespoke pricing model, the audience-aware
> presentation strategy, and the channel price structure. Supersedes the
> tier-related open questions in
> [`docs/08-pricing-and-quoting-model.md`](08-pricing-and-quoting-model.md)
> (the two-track quote lifecycle in docs/08 is unchanged; this document defines
> **what** is sold and **at what price**, docs/08 defines **how** a quote moves).
> Source of truth in code: [`src/lib/pricing/tiers.ts`](../src/lib/pricing/tiers.ts).

---

## 1. Why reprice: the evidence

Full research trail: [`docs/19-market-ecosystem-research.md`](19-market-ecosystem-research.md)
and the pricing research pass (Aug 2, 2026). The load-bearing facts:

1. **Freeman clears $42,000–45,000 per show for a strictly inferior product.**
   The "Experiential Vending Machine" on Freeman's Envision storefront at HIMSS
   has risen from ~$25k (2020) to $42–45k (2026) while repeatedly selling out
   (HPE, Slack, Salesforce, CoverMyMeds). It is a vinyl-wrapped dispenser:
   sponsor supplies own prizes, metrics arrive **two weeks post-show** as a
   spreadsheet. Its own listing cites 2,405 leads captured at HIMSS24 —
   **~$19/lead at the $45k price, and buyers accept it.**
2. **The data layer alone commands a published ~75% premium.** adver.games
   publicly prices a 2-week branded arcade rental at $20k+, and the identical
   rental **with data capture and analytics at $35k+**.
3. **Exhibitors already spend $2,500–3,500/show on the data stack separately**
   (badge scanners $400–735/device, API/CRM access $910–1,330, Captello
   gamified lead capture ~$2,000–3,500/event) — before any physical presence.
4. **Engagement-type sponsorship benchmarks bracket our tiers**: coffee carts
   $3.5k/day (SuperZoo) to $24k/day (Atlassian Team); charging lounges
   $6–15k; CES tiers $18k/$25k/$50k; Money20/20 Europe line items €27–65k.
5. **Cost-per-lead framing wins every comparison.** Trade-show CPL averages
   $112 (CEIR) with $150–350 typical; LinkedIn Lead Gen runs $75–200/lead. A
   machine capturing 300 opted-in leads at £15k = **£50/lead** — better than
   every channel a CMO already buys, at three times today's price.
6. **US pricing is structurally higher.** Mandatory show services are 40–60%
   of US exhibit budgets (union labor $150–280/hr, drayage $95–200/CWT); US
   buyers are conditioned to 2–3× UK prices for identical deliverables.

**Conclusion: the £12,000 UK anchor (1–3 day activation) is undervalued.** The
current seed pricing (Bright.Vend Pro Weekend at £12,000) sits *below* where
the evidence places the middle tier.

## 2. The three tiers + bespoke

Design follows Good-Better-Best research (HBR/Mohammed; INSEAD order effects;
SaaS packaging norms): three tiers plus a bespoke door, ~1.6–1.8× price steps,
middle tier expected to carry 45–55% of volume, top tier priced to anchor
(10–15% of deals, 20–30% of profit), "everything in X, plus…" laddering,
3–5 headline features per card.

| | **Showstopper** (Good) | **Lead Engine** (Better · "Most Popular") | **Command** (Best) | **Bespoke** |
|---|---|---|---|---|
| The buyer's self-selection | "We want a crowd" | "We must prove ROI to the board" | "This is a strategic program" | "Nothing off the shelf fits" |
| Custom wrap + game skin | ✅ | ✅ | ✅ | ✅ |
| Turnkey logistics | ✅ | ✅ | ✅ | ✅ |
| Play + dwell counts | ✅ | ✅ | ✅ | ✅ |
| Reporting | Post-event summary PDF | **24h board-ready proof-of-performance** | 24h report + benchmark context vs fleet | Custom |
| Opt-in lead capture | — | ✅ | ✅ | Custom |
| Trained host | — | ✅ | ✅ | Custom |
| **Live telemetry dashboard** | — | — | ✅ | Custom |
| CRM sync (HubSpot/Salesforce/Klaviyo) | — | — | ✅ | Custom |
| Dedicated producer + content capture | — | — | ✅ | ✅ |
| **UK band (1–3 day)** | £9,500–13,500 | £16,000–24,000 | £28,000–42,000 | From £50,000 |
| **US band (1–3 day)** | $18,000–28,000 | $32,000–48,000 | $55,000–85,000 | From $90,000 |
| **EU band (1–3 day)** | €11,000–15,500 | €18,000–27,000 | €31,500–47,500 | From €57,500 |

Dubai/ME: price on application (POA) until we have local comparables.

### Fencing decisions and their rationale

- **The custom wrap is in every tier.** The founder's initial instinct was to
  fence the wrap out of the base tier. The research overturned it, decisively:
  (a) UK commodity hire *includes* the wrap at £850/day (Arcade Direct) — you
  cannot fence below the commodity floor; (b) a naked machine at a public event
  carries **our** word-of-mouth and photo footprint — an ugly base tier damages
  the flywheel and misrepresents the product; (c) fencing research says fence
  on value metrics buyers self-select by, not by punishing basics. The tiers
  fence on the **data → proof → integration/scale** stack instead.
- **Live telemetry sits in Command (Best), not Lead Engine.** The research
  agent's model put the live dashboard in Better alongside the 24h report
  (both serve the "prove ROI" buyer). The owner's instinct — and the anchor
  logic — puts it in Best: it is the single most demonstrable premium feature
  we have (priced at £750 as a standalone capability today), it gives Best a
  tangible wow beyond "integration," and the Better buyer's core need ("prove
  it to the board") is fully served by lead capture + the 24h report.
  **Decision: live telemetry is the Best-tier fence.** If win/loss data shows
  Better stalling because buyers want live visibility, revisit — the tier
  definition is one code change (`src/lib/pricing/tiers.ts`).
- **À-la-carte add-ons stay** (the nine tailorable capabilities in
  [`src/lib/capabilities.ts`](../src/lib/capabilities.ts)): sampling unlock,
  age gate, payments, dynamic sponsors etc. are add-ons on any tier;
  data-dependent add-ons (survey layer, LinkedIn follow, branded landing page)
  require the lead-capture layer, i.e. Lead Engine and up.

### Presentation psychology (how the tiers are shown)

- **Best first.** Proposals and the pricing page present Command → Lead
  Engine → Showstopper (INSEAD "Best-Better-Good" ordering lifted revenue
  10.8% by raising the reference point).
- **Middle badged "Most Popular."**
- **Bands, not "from" prices, and kept narrow** (upper ≤ ~1.5× lower).
  Academic anchoring research shows ranges anchor toward the lower bound and
  "from £X" anchors lower still.
- **Cost-per-lead framing everywhere**: "£50 per opted-in lead vs $112–350
  trade-show and $75–200 LinkedIn benchmarks."
- **Bespoke is a door, not a tier card** — with 2–3 worked examples (tour,
  custom game build, venue residency) and "From £50,000."

## 3. Audience-aware price display

Price varies legitimately by **who is buying** and **where**. The rule that
keeps trust intact (B2B buyers compare notes): **never show different prices
for the identical SKU to different audiences — each audience buys a genuinely
different product.**

| Audience | What they see on `/pricing` |
|---|---|
| **Brand** | The three-tier table above, region-toggled (UK £ / US $ / EU €), Command first, Lead Engine badged |
| **Agency** | The same rack-rate table + a trade-terms note (10–15% commission, standard planner terms) |
| **Organizer** | No public numbers — routed to the organizer partner page: wholesale deck on request, "your margin, your price to your sponsor" |
| **Venue** | No public numbers — routed to the venue partner page: hosting economics (rev-share / guarantee+overage) and "what your venue could earn" |

Persona selector (Brand / Agency / Organizer / Venue) + region toggle sits
**before** the pricing grid (guided plan-fit pattern). Experiential context
(multi-week, premium-location takeovers) routes to Bespoke rather than
stretching the trade-show-anchored bands — this is how we show prices without
the "per-day price in Waterloo Station vs a Midlands town centre" problem:
the published bands are explicitly **event-activation bands (1–3 days)**;
anything location-priced is Bespoke by definition.

## 4. Channel price structure

| Channel | Structure |
|---|---|
| **Rack rate** | The public brand-direct bands above |
| **Organizer wholesale** | Rack −20–25%, **or** fixed wholesale fee with the organizer setting the sponsor-facing price (Freeman proves 2–3× markups clear at majors). Our brand + dashboard always in front of the end sponsor — we keep the renewal relationship |
| **Agency terms** | 10–15% off rack (standard commissionable-rate norms), never deeper than organizer wholesale |
| **Floor price** | Bottom of the Showstopper band. No channel sells below it — rate integrity across channels |

Sponsorship-tier physics for organizer resale (from the enablement research):
3–4 tiers, geometric spacing, top-tier scarcity, tiers laddering access and
data — a Bright machine naturally slots as top-tier/add-on inventory in an
organizer's existing prospectus matrix.

## 5. Validation plan (before the numbers are gospel)

Confidence: **high** on the comparables (public storefront prices), **medium**
on exact band placement (£16–24k Better is a 30–100% uplift on today's £12k),
**medium-low** on US Best ($55–85k, extrapolated from Freeman's trajectory).

1. Quote the next five US enquiries at the new bands; track close-rate vs
   the historical baseline.
2. Win/loss interviews asking "what else was in your budget line?" (coffee
   cart? charging lounge? photo booth? Captello?).
3. A/B the pricing page — bands vs "from" pricing — measuring lead *quality*
   (qualified-call rate), not volume.
4. One organizer wholesale deal where the organizer sets the sponsor price,
   to observe what the channel actually clears.

## 6. Implementation mapping

- **Code source of truth:** [`src/lib/pricing/tiers.ts`](../src/lib/pricing/tiers.ts)
  — tier slugs, display names, fences (capability slugs from
  `capabilities.ts`), region bands in minor units, presentation order,
  formatting helpers. Owner price changes = edit one file.
- **`packages.tier`** currently holds freeform values ("standard"/"premium").
  Stage 1 of the ecosystem build aligns package rows to the tier slugs when
  the public pricing page ships; `provisioning.ts` and the book-now flow keep
  working against existing values until then.
- **Capabilities vocabulary is unchanged** — `branded-wrap` stays always-on
  (§2); `lead-capture` and `live-telemetry` remain tailorable capabilities
  whose *bundling* is now expressed by tier fences rather than only à-la-carte
  pricing.
- **Owner sign-off items** (final numbers, tier names, deposit/pay-later
  terms, standard rev-share) are tracked in [`OWNER-TODO.md`](../OWNER-TODO.md)
  under "Pricing & packaging."
