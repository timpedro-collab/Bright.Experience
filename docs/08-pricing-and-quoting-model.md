# Pricing & Quoting Model
## Solving the Standard vs. Variable Pricing Problem

---

## The Problem

Bright.Blue has two fundamentally different pricing contexts:

| Context | Pricing Behaviour | Example |
|---------|------------------|---------|
| **Trade shows / Exhibitions** | Known venue, known format, predictable costs. Machine + game + duration + staffing = price. | "Bright.Vend at ExCeL London for 3 days" |
| **Experiential Activations** | Location-dependent, variable media value, footfall-driven CPM, bespoke scoping. The same machine in a small Midlands town centre vs. Waterloo Station could be 3-5× different in price. | "Bright.Play in a train station somewhere in the UK" |

You can't apply the same quoting model to both. Showing fixed prices for experiential undervalues premium locations. Hiding prices for trade shows creates unnecessary friction.

---

## What the Market Does (And Why Most of It Is Wrong)

### Approach 1: Fixed Price Lists
**Who does it:** Equipment rental companies, basic SaaS tools
**The problem:** Doesn't account for location value, media CPM, or bespoke scope. Either you underprice premium locations or overprice accessible ones. Clients in Central London think they're getting a deal; clients in Sunderland think it's overpriced.

### Approach 2: "Contact Us for Pricing"
**Who does it:** Most experiential agencies, enterprise software
**The problem:** Massive friction. Kills conversion. A reseller can't walk a client through a portal and hit a wall that says "we'll get back to you." That's not a platform, it's a lead form.

### Approach 3: Price Ranges ("From £2,000 – £8,000")
**Who does it:** Some event companies, OOH media planners
**The problem:** Ranges that wide are meaningless. The client reads the bottom number. When the real quote comes back at £6,500 they feel bait-and-switched. Ranges also commoditise the service — it frames the conversation around cost, not value.

### Approach 4: Programmatic / Dynamic Pricing
**Who does it:** DOOH platforms (Clear Channel, JCDecaux), ride-sharing, hotels
**The problem:** Requires real-time supply/demand data, footfall APIs, and CPM models. Powerful but complex. Also feels transactional — not right for a premium, relationship-driven service.

### Approach 5: Configurator + Guided Proposal (✅ Recommended)
**Who does it well:** High-end SaaS (Stripe, Vercel), commercial real estate, bespoke travel
**Why it works:** Gives the client agency and transparency while keeping complex variables under internal control. The client feels informed and progressing; the internal team gets a structured brief instead of a cold enquiry.

---

## The Recommended Model: Two Tracks

### Track 1: "Book Now" — Standard Packages
For events where pricing is known and predictable.

**When it applies:**
- Trade shows with known venues
- Exhibitions with standard booth packages
- Sampling campaigns with defined scope
- Events where the venue is a partner (pricing pre-agreed)
- Repeat bookings from existing accounts

**How it works in the platform:**
```
Select machine → Select game → Select duration → Select add-ons → See price → Book
```

- Fixed package tiers (Standard, Premium, Custom base)
- Clear add-on pricing (Bright.Studio creative, extra days, staffing, delivery surcharge)
- Instant checkout — no human needed for standard packages
- Event auto-created in delivery pipeline on booking

**What the client sees:**
A clean, confident price. One number. No ranges. Add-ons clearly itemised. "Book Now" button.

---

### Track 2: "Get Your Proposal" — Guided Intake for Variable Pricing
For experiential activations where location, footfall, and media value drive the price.

**When it applies:**
- Bespoke experiential activations
- Locations where media/DOOH value is a pricing factor
- Multi-unit or roadshow campaigns
- Custom builds or non-standard requirements
- Anything the reseller flags as "needs scoping"

**How it works in the platform:**

#### Step 1: Tell Us About Your Event (guided wizard)
Structured intake — not a blank form. Every question has context.

```
What type of activation?        → [Sampling] [Engagement] [Data Capture] [Brand Experience]
Where is it happening?          → [Postcode or venue search]
When?                           → [Date picker with lead-time guidance]
How long?                       → [1 day] [2-3 days] [1 week] [Ongoing]
Expected footfall?              → [Under 1k] [1-5k] [5-20k] [20k+] [Not sure]
What's the primary objective?   → [Leads] [Samples distributed] [Brand awareness] [Sales]
Any machine preference?         → [Show catalog options with "Recommended" tag]
Do you need creative support?   → [Yes - full service] [Yes - enhancements only] [No - we have assets]
Budget indication (optional)    → [Under £3k] [£3-5k] [£5-10k] [£10k+] [Flexible]
```

#### Step 2: Smart Context (what the platform shows after intake)

This is the critical moment. Don't show a price. Don't show a range. Show **value context**.

```
┌──────────────────────────────────────────────────────────┐
│  📍 Location: Manchester Piccadilly Station               │
│  ── Tier 2 Premium Location                              │
│                                                          │
│  Based on similar activations at this type of location:  │
│                                                          │
│  • Average daily interactions: 800 – 1,200               │
│  • Typical lead capture rate: 35 – 45%                   │
│  • Estimated media value (DOOH equivalent): £X,XXX/day   │
│                                                          │
│  Your 3-day activation could reach ~3,000 interactions   │
│  and capture ~1,200 qualified leads.                     │
│                                                          │
│  ──────────────────────────────────────────────────────   │
│  We'll prepare a detailed proposal with pricing          │
│  tailored to this location and scope.                    │
│                                                          │
│  ⏱ Typical turnaround: within 4 working hours            │
│     (24 hours maximum)                                   │
│                                                          │
│  [Submit & Get Your Proposal]                            │
└──────────────────────────────────────────────────────────┘
```

**Why this works:**
- The client gets **value framing**, not cost framing. They see what they'll get, not what they'll pay.
- The numbers (interactions, leads, media value) justify the premium when the proposal arrives.
- The turnaround commitment ("4 working hours") feels like concierge service, not a sales bottleneck.
- All the information is already captured in structured form — the internal team just needs to price it, not scope it.

#### Step 3: Proposal Delivery (in-platform, not email)

The proposal lands in the same portal — not as a PDF attachment in an email.

```
┌──────────────────────────────────────────────────────────┐
│  PROPOSAL: Manchester Piccadilly Activation               │
│  Prepared for: [Client Name] via [Reseller Name]         │
│  Valid until: [Date]                                      │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Base Package                                         │ │
│  │ Bright.Vend Pro · 3 days · Claw game               │ │
│  │                                         £X,XXX      │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │ Location Premium                                    │ │
│  │ Tier 2 Premium (major station, high footfall)       │ │
│  │ Includes estimated DOOH media value of £X,XXX       │ │
│  │                                         £X,XXX      │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │ Creative Services (Bright.Studio)                   │ │
│  │ Professional wrap + screen assets                   │ │
│  │                                           £XXX      │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │ Staffing (optional add-on)                          │ │
│  │ 1 brand ambassador × 3 days                        │ │
│  │                                         £X,XXX      │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │                                                     │ │
│  │ Total                                    £XX,XXX    │ │
│  │                                                     │ │
│  │ [Accept Proposal]    [Request Changes]              │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  Expected outcomes based on location data:               │
│  • ~3,000 interactions over 3 days                      │
│  • ~1,200 qualified leads                               │
│  • Estimated cost per lead: £X.XX                       │
│  • DOOH media value included: £X,XXX                    │
│                                                          │
│  ⏱ Lead time: 4 weeks from acceptance                    │
└──────────────────────────────────────────────────────────┘
```

When the client clicks "Accept Proposal," the event auto-creates — same as Track 1.

---

## The Location Tier System (Internal)

Don't expose tiers to clients. Use them internally to guide pricing.

| Tier | Description | Examples | Multiplier |
|------|-------------|----------|------------|
| **Tier 1: Flagship** | Central London, major transit hubs, landmark venues | Waterloo, King's Cross, Westfield Stratford, O2 | 2.5–3.5× base |
| **Tier 2: Premium** | Major city centres, large stations, prime retail | Manchester Piccadilly, Birmingham Bullring, Edinburgh Waverley | 1.8–2.5× base |
| **Tier 3: Standard** | Regional cities, mid-size venues, shopping centres | Bristol Cabot Circus, Leeds Trinity, Nottingham Victoria Centre | 1.0–1.5× base |
| **Tier 4: Value** | Towns, out-of-town retail parks, smaller venues | Outlet villages, retail parks, regional exhibition centres | 0.7–1.0× base |

The platform auto-classifies based on postcode using a lookup table. The internal team can override. The client never sees the tier label — they only see the outcome data and the final price.

Over time, this tier system gets smarter:
- Feed actual event data back in (real interactions vs. predicted)
- Adjust multipliers based on historical performance
- Build a proprietary location-value dataset that becomes a competitive moat

---

## Why NOT Ranges

Ranges feel like you don't know your own pricing. They also:

1. **Anchor to the low end** — clients always read the bottom number
2. **Invite negotiation** — "You said it could be £3,000, why is it £7,000?"
3. **Undermine premium positioning** — premium brands don't show ranges, they show value
4. **Give resellers problems** — they can't confidently sell a range

The world-class move is: **show value, not cost, until you're ready to show a firm number.**

The intake wizard frames everything in terms of outcomes (interactions, leads, media value). The proposal arrives with a single, justified total. The client's first impression of cost is already contextualised by value.

---

## How This Enables 100 Resellers

| Without this model | With this model |
|-------------------|-----------------|
| Reseller emails Bright.Blue: "Client wants activation in Manchester, what's the price?" | Reseller walks client through wizard, guided intake captures everything |
| Internal team asks 5 follow-up questions over 3 days | All information captured upfront, structured, complete |
| Internal team manually builds quote in a spreadsheet | Platform auto-populates proposal from location tier + package + add-ons |
| Quote sent as PDF over email | Proposal delivered in-platform, one click to accept |
| If client accepts, someone manually creates the event | Event auto-created from accepted proposal |
| Reseller has no visibility after handoff | Reseller sees event status, gets notified on milestones |

The reseller's job becomes: "Let me show you what's possible" (catalog) → "Tell us about your event" (wizard) → "Here's your proposal" (delivered fast) → "Let's get started" (one click). They never need to know internal pricing logic, location tiers, or CPM models.

---

## For the Platform Build

### What needs to exist in the data model

```
Quote {
  id                UUID
  account_id        UUID? → Account     // null if prospect
  partner_id        UUID? → Partner     // reseller attribution
  track             enum               // standard | proposal
  status            enum               // draft | submitted | preparing | delivered | accepted | expired | declined
  
  // Intake data
  event_type        enum
  location_postcode string?
  location_name     string?
  location_tier     enum               // tier_1 | tier_2 | tier_3 | tier_4 (internal)
  dates             daterange
  duration_days     integer
  footfall_estimate enum               // range bucket
  objective         enum
  machine_preference string?
  creative_needs    enum               // full_service | enhancements | none
  budget_indication enum?              // range bucket (optional)
  
  // Proposal data (filled by internal team for Track 2)
  base_price        decimal?
  location_premium  decimal?
  creative_cost     decimal?
  staffing_cost     decimal?
  other_costs       JSON?              // [{label, amount}]
  total_price       decimal?
  valid_until       date?
  proposal_notes    text?
  outcome_estimates JSON?              // {interactions, leads, cpl, media_value}
  
  // Lifecycle
  prepared_by       UUID? → User
  prepared_at       timestamp?
  accepted_at       timestamp?
  event_id          UUID? → Event      // created on acceptance
  
  created_at        timestamp
  updated_at        timestamp
}
```

### Internal tooling needed

1. **Quote queue** — internal dashboard showing intake submissions awaiting proposals
2. **Location tier lookup** — postcode → tier mapping with manual override
3. **Proposal builder** — form that pre-fills from intake, lets internal team set line items
4. **Auto-event creation** — on acceptance, generates Event + Milestones + Tasks + Asset Requirements from package template
5. **SLA tracking** — time from submission to proposal delivery, with escalation

---

## Summary

| Decision | Recommendation |
|----------|---------------|
| Show fixed prices for trade shows? | **Yes** — Book Now track with clear package pricing |
| Show prices for experiential? | **No** — show value context (outcomes, media value), deliver firm price in proposal |
| Show ranges? | **No** — ranges undermine premium positioning and anchor low |
| Make clients wait? | **Minimally** — 4-hour target, 24-hour max. In-platform delivery, not email. |
| What do resellers see? | **Everything except internal pricing logic** — they see the intake, the proposal, the acceptance |
| How does it scale? | **Structured intake eliminates scoping calls. Location tiers + templates speed up internal quoting. Auto-event-creation eliminates manual setup.** |

*This is a strategic design recommendation. Review and confirm direction before build.*
