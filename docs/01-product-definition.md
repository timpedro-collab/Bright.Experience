# Bright.Blue Events — Product Definition

## Product Name
Bright.Experience

## One-Line Definition
A premium delivery-and-proof portal for Bright.Blue activations — one workspace where customers and the internal team run the event from kickoff through live telemetry to post-event proof of performance, with catalog, quiz, and quoting as the intake path that feeds delivery.

## Core Problem
After an event is sold (or booked through the public funnel), delivery coordination fragments across email chains, scattered approvals, manual asset chasing, disconnected QA processes, and ad hoc project management. This creates operational risk, margin erosion, poor customer visibility, and dependency on individual team members holding the process together. Separately, proving what happened at the event — leads, plays, engagement — has lived in disconnected tools and hand-built decks.

## Core Solution
A single, premium, role-aware workspace that:
- Provides customers with a clear view of what's needed, what's done, and what's next
- Routes work internally across creative, ops, QA, dev, and reporting
- Enforces stage gates and approval flows
- Captures scope changes to protect margin
- Closes the loop with live telemetry and post-event reporting in the same product surface
- Accepts work via catalog / quiz / proposal / book-now intake so delivery starts with structured data, not email threads

## Who Uses It

### External (Customer)
- **Customer User** — views progress, uploads assets, completes forms, approves deliverables
- **Customer Admin** — same as above, plus manages team members and views reporting

### Internal (Bright.Blue)
- **Events Lead** — owns the event lifecycle, manages milestones, coordinates across teams
- **Creative Lead** — manages creative intake, asset review, Bright.Studio requests
- **Operations Lead** — manages logistics, product/prize readiness, venue coordination
- **QA / Configuration Lead** — manages machine configuration, game logic, pre-event testing
- **Developer** — handles custom development tasks, technical configuration
- **Reporting / Admin** — generates reports, manages exports, system administration

### Partners & venues (secondary)
- **Partner Member / Partner Admin** — co-branded reseller or venue portal (attribution, commissions, placements). Implemented roles are `partner_member` / `partner_admin`; broader reseller/venue/sponsor role names in the platform vision are aspirational.

## What Success Looks Like
1. 60%+ reduction in email-based coordination per event
2. Zero missed approval gates or QA steps
3. Customer can self-serve for asset uploads, form completion, and report access
4. Internal team has real-time visibility into event health across the portfolio
5. Post-event reporting delivered in the same portal within 24 hours of event completion
6. Bright.Studio upsell requests captured in-platform
7. Intake (quiz / proposal / book) lands structured data straight into the delivery pipeline

## What This Product Is Not
- Not a CRM (that lives upstream in Pipedrive; Experience writes progress back)
- Not a generic project management tool with Bright.Blue branding
- Not a messaging platform (though in-event messages and notifications exist)
- Not a billing or payments system (bookings are confirmed in-portal; invoicing is handled by account managers outside card checkout)
- Not primarily a sales CRM or outbound sales workspace — catalog, quiz, and quoting exist as **intake** into delivery and proof, not as a full sales suite
- Partner / venue / sponsorship surfaces are real but **secondary** to the delivery + proof core
