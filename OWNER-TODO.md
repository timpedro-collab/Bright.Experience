# Owner action list (Tim)

Post-build follow-ups from the capture-quality / retention / stock / config-sync
build (24 Jul 2026) and the organizer Show Command build (26 Jul 2026).
Everything here is a business or account decision the
portal now depends on — none of it is dev work. Tick items off as you go; the
dev-team worklist lives separately in
[`docs/13-dev-handover-priorities.md`](docs/13-dev-handover-priorities.md).

## Pricing & packaging (from the 2 Aug 2026 ecosystem build — Stage 0)

The platform now carries a three-tier + bespoke pricing model
(`docs/20-pricing-and-packaging.md`, code in `src/lib/pricing/tiers.ts`).
Every number ships as an evidence-backed **placeholder** until you sign it off
— the bands already flow into the pricing surfaces, so these decisions are
live ones:

- [ ] **Sign off the tier bands** (UK £9.5–13.5k / £16–24k / £28–42k /
  from £50k; US $18–28k / $32–48k / $55–85k / from $90k; EU €11–15.5k /
  €18–27k / €31.5–47.5k / from €57.5k). The evidence trail is §1 of docs/20 —
  Freeman clears $42–45k for a strictly inferior product. Changing any number
  is a one-line edit in `src/lib/pricing/tiers.ts`.
- [ ] **Sign off the tier names.** Shipping as Showstopper / Lead Engine /
  Command / Bespoke. Renaming touches display names only, not code slugs.
- [ ] **Confirm live telemetry as the top-tier fence.** Your instinct and the
  anchor logic put the live dashboard in Command (Best); the research model
  had it one tier lower. Rationale in docs/20 §2 — revisit if Lead Engine
  deals stall on "we want live visibility."
- [ ] **Set the standard organizer wholesale discount** (docs/20 §4 proposes
  rack −20–25%, or fixed wholesale where the organizer sets the sponsor
  price) and the **agency commission** (proposed 10–15%).
- [ ] **Set the floor price rule.** Proposed: no channel sells below the
  bottom of the Showstopper band. Confirm or adjust.
- [ ] **Run the validation plan** (docs/20 §5): next five US enquiries at the
  new bands, win/loss "what else was in the budget line," pricing-page A/B.

## Commercial

- [ ] **Set the real price for the branded landing page upsell.** It ships
  with a £300 placeholder (`defaultPricePence: 30_000` in
  `src/lib/capabilities.ts`). Decide the actual price and have the dev team
  (or me) update that one number — it flows into proposals automatically.

## Capture rules and GDPR

- [ ] **Ask Marta for her Central Europe blocked-domain list.** The portal
  ships with a UK/US-focused starter list (gmail, yahoo, hotmail, outlook,
  icloud, aol, proton, plus UK ISPs like btinternet/sky/talktalk and US ISPs
  like comcast/att/verizon — see `src/lib/capture-rules.ts`), and ops can
  edit it per event. Her battle-tested regional list should be added per
  event for EU activations (or become a regional preset later).
- [ ] **Get legal sign-off on the consent checkbox template.** The default
  copy ("I agree that {brand} may contact me about {event} follow-ups…") is
  written by us, not by a lawyer. It is editable per event, but the default
  should be reviewed once for the European market.
- [ ] **Confirm the 60-day retention default against Adyen's terms** (and any
  other client with its own data-processing agreement). Marta suggested 60
  days on the call; the portal defaults to 60 and allows 1–730 per event.

## Relationship (from the Marta call)

- [ ] **Send Marta the live hosted platform link.**
- [ ] **Grant Marta demo access** so she can click through and give input.
- [ ] Optional but earned: a thank-you gift for the intros she's driving.

## Organizer portal (from the 26 Jul build)

The portal now supports a show producer (Informa-style) running several machines
at one conference and selling some of them to sponsors. These are the decisions
the build deliberately left to you rather than guessing at.

- [ ] **Decide the commercial model for organizer access.** Right now the
  organizer portal is simply available to a partner of type `organizer` at no
  charge — the implicit bet is that it wins us multi-machine placements. If it
  should be a paid tier, or gated on a minimum machine count, that needs a
  price and a rule.
- [ ] **Decide how sponsor slot revenue is split.** Organizers set their own
  price per slot in the portal and we store it, but nothing calculates or
  invoices a Bright.Blue share. This is the open half of the deferred
  revenue-share statement — settle the commercial terms first.
- [ ] **Validate the two deferred features with a real organizer** before we
  build them: (a) rebook-reward as a first-class flow — a machine at the
  rebooking desk that rewards next-year sign-ups; (b) a revenue-share
  statement showing the organizer what they earned. Both were designed but
  held back pending a customer who confirms they want them.
- [ ] **Confirm the 30-day sponsor pitch-link expiry.** Links to
  `/sponsor/:token` are private, revocable and expire after 30 days by
  default. Longer suits a slow sponsorship sales cycle; shorter is safer.
- [ ] **Sanity-check the privacy line with legal.** Organizers see their fleet
  and aggregate numbers (plays, leads, prizes, opt-in rate) but never a lead's
  contact details, and sponsors see only counters for their own machine. That
  keeps the organizer out of the data-processing chain for the sponsor's leads
  — worth one legal read before we sell it as a feature.

## Machine specifications (from the 27 Jul machine-experience build)

The organizer portal now shows a venue spec sheet per unit — footprint, weight,
power, connectivity, service clearance — because every exhibition venue asks for
those before it will approve anything on its floor.

- [ ] **Replace the placeholder specifications with the hardware team's real
  figures.** The values in `supabase/seed.sql` (and the mock dataset) are the
  *shape* of the specification, not measured data. Every surface labels them
  "indicative" and tells the organizer to confirm with us, but the sheet is
  designed to be forwarded to a venue — get the manufacturer's numbers in and
  that caveat can go.
- [ ] **Check the benchmark table is telling the truth.** The machine page and
  the sponsor pitch now quote plays and leads per day as a range with a sample
  size, straight from the `benchmarks` rows. If any of those figures are stale
  or aspirational, they are now in front of sponsors — worth one read.

## Onboarding an organizer (from the 27 Jul build)

Setting one up is now a self-service job in the portal — `/admin/organizers` →
add them → invite their lead → link their shows → deploy machines. No database
access needed. Two things are still on you:

- [ ] **Decide who at Bright.Blue does the setup.** The console is open to
  `events_lead` and `admin` only. If account managers should onboard their own
  organizers, they need one of those roles.
- [ ] **Check the invite email wording** before the first real organizer gets
  one. It's the standard magic-link invite and lands them on set-password, then
  their show portal — worth reading once as a stranger would.

## Dev-team handover

- [ ] **Point the incoming dev team at `docs/13-dev-handover-priorities.md`**
  as their day-one worklist, and specifically flag the machine config-sync
  contract (`docs/10-integrations.md` §1b): the machine stack must consume
  the `EventConfigPayload` and enforce the capture rules at the point of
  capture, then emit `capture_rejected_domain` / `capture_duplicate_blocked`
  telemetry so the reports can prove the rules worked.

## Go-live account setup (P0 — when deploying for real)

- [ ] Create the production Supabase project and run migrations + seed.
- [ ] Resend: verified sending domain + `RESEND_API_KEY`.
- [ ] Cal.com: walkthrough event type (Google Meet location), set
  `NEXT_PUBLIC_CALCOM_LINK` and `CALCOM_WEBHOOK_SECRET`.
- [ ] Bright.Blue Cloud: exchange `BRIGHTBLUE_WEBHOOK_SECRET`,
  `BRIGHTBLUE_API_URL`, `BRIGHTBLUE_API_KEY` with the machine team.
- [ ] Set `CRON_SECRET` and confirm the five cron schedules run (including
  the new daily `purge-leads` at 02:30 UTC).
- [ ] Sentry DSN for error monitoring.

Full detail for each P0 item: `docs/13-dev-handover-priorities.md` §P0.
