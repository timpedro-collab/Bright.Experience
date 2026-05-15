# Bright.Experience — Platform Vision
## From Delivery Portal to Reseller-Ready Platform

---

## The Shift

Bright.Experience v1 was scoped as a **post-sale delivery portal** — a workspace for events that are already sold. What you're describing is a fundamentally different product surface that sits **upstream, alongside, and beyond** that delivery layer:

| Layer | Current | Expanded |
|-------|---------|----------|
| **Pre-sale** | ❌ Not in scope | Quoting engine, game catalog, package builder, self-serve onboarding |
| **Sale** | ❌ Handled externally | Reseller checkout, venue package add-ons, sponsorship sales |
| **Post-sale delivery** | ✅ Built (Stages 1-2) | Remains the core, now auto-populated from upstream |
| **Long-term operations** | ❌ Not in scope | Virtual runways, recurring sponsorship management, machine placement dashboards |
| **Partner layer** | ❌ Not in scope | Reseller portal, white-label capabilities, partner onboarding, commission tracking |

The platform becomes **four products in one skin**:
1. **Bright.Experience** — The customer delivery portal (what exists now)
2. **Bright.Catalog** — The self-serve discovery, quoting, and ordering surface
3. **Bright.Partner** — The reseller/venue operator enablement layer
4. **Bright.Runway** — The long-term placement and sponsorship management system

All sharing one design system, one auth layer, one data model.

---

## New User Personas

### Who We're Adding

| Persona | Description | What They Need |
|---------|-------------|----------------|
| **Reseller / Sales Partner** | Independent salespeople or agency partners who sell Bright.Blue activations to their own clients | A portal they can send prospects to; a way to walk clients through options; commission/attribution tracking; their own branded experience |
| **Venue / Event Organizer** | Trade show operators, festival organizers, venue managers who offer Bright.Blue as a premium package add-on | A way to list Bright.Blue as a tier in their packages; a landing page for purchasers; an onboarding flow that feeds into delivery |
| **Sponsor / Advertiser** | Brands who purchase screen time or machine branding at runway/long-term placements | A way to see available inventory, book sponsorship slots, upload creative, track campaign performance |
| **Self-Serve Prospect** | Someone who lands on the platform cold (from a partner link, website, or event organizer page) | Understand what's possible, configure what they want, get a quote, submit information |

### Updated Role Model

```
External Roles:
  - prospect            → browsing, quoting, no account yet
  - customer_user       → active event, delivery access
  - customer_admin      → delivery access + team + reporting
  - sponsor             → sponsorship-only access (runway)
  
Partner Roles:
  - reseller            → sends clients, sees pipeline, earns attribution
  - reseller_admin      → manages reseller team, views all client events
  - venue_operator      → manages package listings, sees purchaser pipeline
  - venue_admin         → manages venue team, configures packages

Internal Roles:
  - events_lead         → (unchanged)
  - creative_lead       → (unchanged)
  - operations_lead     → (unchanged)
  - qa_lead             → (unchanged)
  - developer           → (unchanged)
  - admin               → (unchanged) + partner management
```

---

## The Self-Serve Journey

This is the critical path — turning 100 resellers into 100 autonomous pipelines that reduce internal workload rather than multiplying it.

### The Funnel

```
┌─────────────────────────────────────────────────────┐
│  1. DISCOVER                                         │
│     Browse game catalog, see examples, watch demos   │
│     "What can Bright.Blue do?"                       │
├─────────────────────────────────────────────────────┤
│  2. CONFIGURE                                        │
│     Select machine type, game style, package tier    │
│     "What do I want?"                                │
├─────────────────────────────────────────────────────┤
│  3. QUOTE                                            │
│     Instant pricing for standard packages            │
│     "What will it cost?"                             │
├─────────────────────────────────────────────────────┤
│  4. BRIEF                                            │
│     Submit event details, dates, venue, objectives   │
│     "Tell us about your event"                       │
├─────────────────────────────────────────────────────┤
│  5. CREATIVE INTAKE                                  │
│     Upload brand assets, answer briefing questions   │
│     "Give us what we need to build"                  │
├─────────────────────────────────────────────────────┤
│  6. DELIVERY (existing Bright.Experience)            │
│     Timeline, approvals, QA, logistics, reporting    │
│     "We'll take it from here"                        │
└─────────────────────────────────────────────────────┘
```

Steps 1-5 are what the reseller walks the client through. Steps 4-5 are what the client can do independently. Step 6 is what already exists.

The key insight: **Steps 1-5 eliminate the back-and-forth that currently happens over email, calls, and PDFs before an event even enters the system.** If done well, by the time an event hits the delivery pipeline, 80% of the information is already captured.

---

## Game Catalog

This is the storefront — the thing that makes the platform sellable at a glance.

### What It Contains

| Section | Content |
|---------|---------|
| **Machine Types** | Bright.Vend, Bright.Vend Pro, Bright.Play, Bright.Tap, etc. — each with hero imagery, specs, dimensions, capabilities |
| **Game Library** | Every available game/experience with video previews, descriptions, suitable use cases, crowd-size guidance |
| **Use Cases** | "Sampling at a trade show", "Prize activation at a festival", "Data capture at a product launch" — curated combinations of machine + game + objective |
| **Case Studies** | Real event examples with photos, stats, and testimonials |
| **Package Builder** | Interactive configurator: pick machine → pick game → pick add-ons → see price |

### What Makes It World-Class

- **Video-first**: every game has a 10-15 second preview loop, not just screenshots
- **Filterable**: by objective (sampling, data capture, engagement, footfall), by event type (trade show, festival, retail, experiential), by machine type
- **Social proof**: "Used by 200+ brands" counters, logos, and pull quotes woven in
- **Interactive previews**: embed game demos that work in-browser so prospects can try before they buy
- **AR/3D model**: let prospects see the machine in their space (long-term, but powerful)

---

## Quoting & Ordering Engine

### How It Works

```
Standard packages → Instant auto-quote (no human needed)
Custom packages   → Request submitted → Internal review → Quote sent (24h SLA)
```

### Quote Builder Components

1. **Base package**: machine type + duration + game → base price
2. **Add-ons**: Bright.Studio creative, custom development, staffing, delivery beyond standard radius, multi-day, multi-unit
3. **Date/location**: availability check, travel surcharge logic
4. **Volume discounts**: multi-event pricing, roadshow rates
5. **Express surcharges**: turnaround-based pricing modifiers

### The Quote Object

The quote becomes the seed of the event. When accepted, it auto-generates:
- The event record with all details pre-filled
- The milestone timeline from the package template
- The task list with customer actions pre-assigned
- The asset requirements based on machine/game type
- The Bright.Studio order if creative was included

**This is the force multiplier.** A reseller walks a client through the catalog, builds a quote, the client accepts, and 90% of the event setup is automated. No internal team member touched it until creative review.

---

## Reseller / Partner Portal

### What a Reseller Sees

| Section | Purpose |
|---------|---------|
| **Dashboard** | Active pipeline: quotes sent, events in progress, revenue attributed |
| **Send a Client** | Generate a branded link or walkthrough a client live using the catalog |
| **My Clients** | All accounts and events attributed to this reseller |
| **Commissions** | Earned, pending, paid (if applicable) |
| **Resources** | Sales collateral, pitch decks, product one-pagers, training videos |
| **Notifications** | "Client accepted quote", "Event needs attention", "New product available" |

### What a Reseller Can Do
- Walk a client through the catalog in a co-browse or screenshare
- Send a personalized quote link to a client
- See the status of their client's events (read-only delivery view)
- Get notified when their client needs to take action (so they can nudge)
- Cannot modify events, pricing, or internal workflows

### Partner Attribution
Every reseller gets a unique partner code. All quotes and events created through their flow are attributed. This enables:
- Commission tracking
- Performance leaderboards
- Tiered partner programs
- Revenue reporting by channel

---

## Venue / Event Organizer Model (Bright.Runway)

### The Concept

A venue or event organizer adds Bright.Blue machines as a **premium package add-on** for their exhibitors/sponsors. This is particularly relevant for:

- Trade shows (exhibitors want footfall drivers)
- Festivals (sponsors want engagement)
- Shopping centres (long-term placements)
- Conference venues (recurring bookings)

### How the Package Add-On Works

```
Event organizer's existing packages:
  ├── Bronze: Booth + badge scanning           → £5,000
  ├── Silver: Bronze + premium placement        → £8,000
  ├── Gold:   Silver + speaking slot            → £12,000
  └── Gold +:  Gold + Bright.Blue Activation    → £15,000  ← new add-on tier
                     └── or standalone add-on    → £3,500
```

### The Venue Operator Portal

| Section | Purpose |
|---------|---------|
| **Package Manager** | Create/edit packages that include Bright.Blue as an option |
| **Purchaser Pipeline** | See who's bought the add-on, where they are in onboarding |
| **Embed Widget** | Code snippet to add a Bright.Blue option to their existing booking flow |
| **Availability** | Machine calendar showing what's booked when |
| **Revenue** | Revenue share or referral fee tracking |

### The Purchaser Journey (Exhibitor/Sponsor)

1. Exhibitor buys "Gold+" package from event organizer
2. Event organizer's system sends exhibitor to Bright.Experience with a pre-filled context (event name, dates, venue, package type)
3. Exhibitor lands on a streamlined onboarding: upload brand assets, answer briefing questions, select game preference from the catalog
4. Event auto-created in delivery pipeline with everything pre-populated
5. Exhibitor gets their own delivery portal access for approvals and progress

### Virtual Runways (Long-Term Placements)

For machines placed at venues long-term (weeks/months), the model flips:

- The **venue** is the ongoing client, not individual events
- Multiple **sponsors** rotate on the same machine
- Each sponsor has their own creative, their own game config, their own reporting window
- The venue operator sells sponsorship slots (weekly, monthly)
- Sponsors get their own mini-portal: upload creative, see performance, renew

This requires:
- A **placement** entity (machine at a location for a duration)
- A **sponsorship slot** entity (brand on a machine for a time window)
- A **campaign** view for each sponsor
- A **revenue/availability calendar** for the venue operator

---

## What You're Missing (My Input)

### 1. Onboarding Wizard, Not Just a Portal
The biggest risk with 100 resellers is inconsistency. Some will explain things well, others won't. The platform needs a **guided onboarding wizard** — a step-by-step flow that is so clear that a client could complete it without any human explanation. Think TurboTax for event activation. Every question has context, every step has examples, nothing assumes prior knowledge.

### 2. Template-Driven Everything
If every event requires manual setup internally, 100 resellers = 100x the work. Templates need to be first-class:
- **Package templates** → auto-generate events with the right milestones, tasks, assets, and QA items
- **Game templates** → pre-configured asset requirements, briefing questions, and technical specs per game type
- **Industry templates** → "Trade show sampling", "Festival activation", "Retail engagement" — each with pre-filled best practices

### 3. Approval Automation with Escalation
With volume, not every event needs the same level of creative oversight. Build tiered approval:
- **Standard packages with templated creative** → auto-approve if assets meet specs (format, resolution, colour space)
- **Custom creative** → human review with SLA tracking
- **Escalation** → if approval isn't completed within SLA, auto-escalate

### 4. Client Education Layer
A game catalog is necessary but not sufficient. You need:
- **"What should I choose?" quiz/wizard** — 5 questions that recommend a machine + game + package
- **ROI calculator** — "For a 3-day trade show with 5,000 attendees, expect X interactions, Y leads"
- **Timeline expectations** — "Book 6 weeks out for standard, 3 weeks for express"
- **FAQ/knowledge base** — searchable, contextual (shows relevant answers based on where you are in the flow)

### 5. White-Label Capability
Some resellers and venue partners won't want to show "Bright.Blue" to their clients. They want to present it as part of their own offering. Consider:
- **Custom subdomain**: `activate.partnername.com`
- **Logo/colour swap**: partner's branding on the customer-facing surfaces
- **Powered-by badge**: small "Powered by Bright.Blue" footer
- This is a premium partner feature and a serious differentiator

### 6. API / Embed Layer
Venue operators already have their own booking systems. Rather than making them switch, offer:
- **Embed widget** — drop into any website: `<bright-blue-addon event="trade-show-2026" />`
- **API** — for venues with custom booking platforms to programmatically create events
- **Webhook** — notify venue operators when creative is approved, event is live, report is ready

### 7. Analytics That Sell
The reporting dashboard currently shows post-event metrics. But for the reseller/venue model, you also need:
- **Portfolio analytics** — "Across all my events, average interaction rate is X"
- **Benchmark data** — "Your event performed 20% above average for trade show activations"
- **Proposal-ready exports** — PDF reports that a reseller can use to close the next deal
- **Live dashboards during events** — real-time counters that sponsors/venue operators can see

### 8. Communication Layer
With 100 resellers and their clients, email threads won't work. Build:
- **In-platform messaging** — threaded conversations per event, visible to the right roles
- **Automated status updates** — "Your event moved to QA" without anyone sending it manually
- **Reseller digest** — weekly email to each partner: "3 events in progress, 1 needs client action, 2 quotes pending"

### 9. Mobile-First Client Experience
Resellers demo on iPads. Clients check progress on phones. The catalog, wizard, and client portal must be fully responsive, but more than that — designed mobile-first for these use cases:
- Catalog browsing on iPad in a meeting
- Asset upload from phone (take a photo of brand guidelines)
- Approval on mobile (tap to approve/reject)
- Quick-glance dashboard from anywhere

### 10. Pricing Guardrails for Partners
Resellers need clear rules:
- Can they discount? By how much? Who approves?
- Is pricing visible to end clients, or only to the reseller?
- Revenue share models: flat fee per event vs. percentage
- Who owns the client relationship? (CRM attribution matters)

---

## How It All Ties Together

```
                    ┌──────────────────┐
                    │  BRIGHT.CATALOG  │
                    │  Game library    │
                    │  Package builder │
                    │  Quote engine    │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───────┐     │    ┌─────────▼────────┐
     │ BRIGHT.PARTNER │     │    │ BRIGHT.RUNWAY    │
     │ Reseller portal│     │    │ Venue placements │
     │ Client pipeline│     │    │ Sponsorship mgmt │
     │ Commission     │     │    │ Slot calendar    │
     └────────┬───────┘     │    └─────────┬────────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼─────────┐
                    │ ONBOARDING       │
                    │ WIZARD           │
                    │ Guided intake    │
                    │ Asset collection │
                    │ Briefing forms   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ BRIGHT.EXPERIENCE│
                    │ Delivery portal  │ ← what exists today
                    │ Approvals, QA    │
                    │ Logistics        │
                    │ Reporting        │
                    └──────────────────┘
```

Every entry point — reseller link, venue add-on, direct inquiry — feeds through the same onboarding wizard into the same delivery pipeline. The internal team's workflow doesn't change regardless of how the event was originated. That's how you scale.

---

## Phased Build Approach

| Phase | Name | What | Why First |
|-------|------|------|-----------|
| **Phase A** | Complete Delivery Core | Finish Stages 3-5 of current roadmap (operations, notifications, reporting) | Can't sell what you can't deliver |
| **Phase B** | Game Catalog + Quoting | Public-facing catalog, package builder, quote engine | Gives resellers something to show clients |
| **Phase C** | Self-Serve Onboarding | Guided wizard, auto-event-creation from accepted quotes | Eliminates manual event setup |
| **Phase D** | Partner Portal | Reseller dashboard, client pipeline, attribution, resources | Enables the 100-reseller scale |
| **Phase E** | Venue/Runway Module | Placement management, sponsorship slots, venue operator portal | Opens the recurring revenue model |
| **Phase F** | Advanced Features | White-label, API/embeds, live dashboards, mobile app, AI-assisted briefing | Differentiators and defensibility |

---

## The Standard of "World-Class"

To make this genuinely world-class — not just functional — every surface needs to meet these bars:

1. **Zero training required** — if a reseller needs to explain how to use it, it's failed
2. **Faster than email** — every interaction must be quicker than writing an email
3. **Beautiful enough to sell from** — the catalog and portal are sales tools, not admin tools
4. **Trustworthy** — clear status, clear expectations, clear next steps at every stage
5. **Delightful details** — micro-animations, thoughtful copy, progressive disclosure, smart defaults
6. **Data-driven** — every screen should answer "what should I do next?" without the user having to figure it out

The closest analogues to study:
- **Shopify** (for the partner/reseller enablement model)
- **Canva** (for the self-serve creative tool UX)
- **Linear** (for the internal operations aesthetic)
- **Stripe** (for the API/embed/developer experience)
- **Apple Store** (for the product catalog browsing experience)

---

*This document is a strategic input for review. No code changes have been made. Come back with your thoughts and we'll prioritize what to build next.*
