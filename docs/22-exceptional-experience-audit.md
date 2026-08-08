# 22 — The Exceptional-Experience Audit

**Date:** 7 August 2026
**Inputs:** four parallel deep dives — (1) a code-level journey-stitching gap analysis across all six personas, (2) a live production friction crawl of ~40 pages as four logged-in personas, (3) primary-source research into human and sales psychology for premium B2B purchases, (4) research into self-promoting product loops for low-frequency, high-ticket businesses — plus a same-day housekeeping pass (timezone bug fix, dependency patch, 50 DB indexes, 13 RLS policy rewrites, leaked-password protection).

**Goal (owner's words):** a one-of-one, world-class, never-seen-before, self-promoting, ease-of-use system that scales organically by itself — built the way humans are wired, so it maximizes the odds that people and organizations say yes, and say yes again.

---

## The one-paragraph diagnosis

Every room in this building is beautifully made; several doors between rooms are missing, and a few windows show the wrong weather. The platform's entire promise is *trustworthy numbers* — and today the same event shows three different lead totals on three of its own tabs, the "board-ready" report leads with £0.00, and the homepage briefly claims a "0% rebook rate." The buying journey ends in silence at the exact moment money changes hands (an accepted proposal provisions nothing by default and nobody is prompted to convert it), the delivery journey ends in silence at the exact moment pride peaks (a published report never notifies the customer), and the loyalty journey doesn't exist (no post-event nudge; "Rebook" dumps a logged-in customer into the anonymous funnel). Meanwhile, the growth engine is 90% built — public reports, pitch links, the Bright Index, the widget, co-branded reports — but none of these artifacts carries an invitation, so the flywheel has no teeth. The psychology research says the highest-leverage moves are exactly the ones this list produces: make yes feel *safe*, arm the champion to win the meeting you're not in, design the peak and the end, and subtract relentlessly.

---

## Part 1 — Five principles that govern everything below

These come from the strongest-evidence findings in the psychology research, filtered for this business (premium, low-frequency, B2B, committee-bought, experiential):

1. **Sell to the fear of messing up, not the fear of missing out.** 40–60% of lost B2B deals end in *no decision*, and 56% of that indecision is fear of failure (JOLT, 2.5M sales calls). Piling on urgency backfires 84% of the time. Every surface must make saying yes feel safe: pilots, guarantees, honest availability, one firm recommendation instead of a menu.
2. **The deal is won in a meeting you're not in.** Buyers spend ~17% of the journey with any supplier (Gartner); the champion sells internally without you. Every artifact — quiz output, proposal, report — must survive being forwarded unedited to a CFO.
3. **Design the peak and the end; the middle is forgotten.** Peak-end is the mechanistic link between experience and rebooking (Kahneman; the 2003 trial where a better *ending* raised actual return rates). Bright's peak is event day; its end is the report reveal. Neither is currently designed as a moment.
4. **Make the customer the hero of every shareable artifact.** People share what makes *them* look good (Berger; Spotify Wrapped's 500M shares). Teams rebook the thing that made them look good internally. The report, the wrap-up, the badges — all should credit the champion, with Bright as the quiet co-signature.
5. **Subtract before you add.** Humans systematically fail to even consider removal (Adams & Klotz, *Nature* 2021). Overwhelming information makes buyers 54% *less* likely to purchase without regret (Gartner). Luxury shows less. Institute a quarterly "what did we remove" review — the bias guarantees nobody proposes it naturally.

**Anti-principles (evidence of backfire — never do):** countdown timers or manufactured scarcity anywhere in the funnel (detected manipulation reprices the whole proposal's credibility); signup walls on report/dashboard viewing (the viewer experience *is* the demo); pop-overs interrupting a sponsor mid-report; cash referral rewards (metaperception damage for premium brands — reward the *referred party* with status/upgrades instead); oversized Bright branding on the customer's co-branded artifact.

---

## Part 2 — The program, in four tiers

Ordered by dependency, not just impact: trust repairs first (broken numbers poison everything downstream), then closing the loop, then the moments, then the loops.

### Tier 0 — Trust repairs (days; do before showing this to anyone who matters)

The live crawl found the product's core promise — trustworthy numbers — undermined by its own screens. These are mostly small fixes and demo-data hygiene, and they are the highest-priority work in this document because a single self-contradicting number licenses the buyer to distrust every other number.

| # | Fix | Where |
|---|---|---|
| 0.1 | **One lead total per event.** Live tab says 560, Leads tab says 0, Reports says 1,877 for the same event. Unify on one query/source of truth. | Live/Leads/Reports tabs |
| 0.2 | **Suppress metrics with no data — never render £0.00, `0`, or `—` as if they were results.** The published report leads with "£0.00 cost per lead" and "0 footfall impressions." No-data states should say "not measured at this event," or the block should not render. | Report page, exec summary |
| 0.3 | **Status chips must be derived from reality.** "ON TRACK" above ten tasks 6 weeks overdue, "Kickoff · On Track · 0%" 58 days after the event date, "Live · updated just now" on an event that ended 140 days ago, "Accepted" + "waiting on customer to upload" on the same asset. Derive status from dates/tasks; make the ended state replace live chrome. | Home, pipeline, event tabs |
| 0.4 | **Shift the seed dates continuously.** Most contradictions above are stale demo data. The `shift-dates` mechanism exists — run it (or anchor seed dates relative to `now()`) so the demo never rots again. Also: seed an organizer partner + user — the organizer portal currently cannot be demoed at all. | `supabase/seed*`, shift-dates |
| 0.5 | **Count-ups trigger on viewport entry, never render "0%" as a resting state.** The hero proof chips read "0% rebook rate" until the visitor scrolls. Use IntersectionObserver; render the real value as the SSR fallback. | Homepage hero + stats band |
| 0.6 | **Fix the failed anonymization.** "A global coffee chain" card shows a giant Costa cup and storefront. Either get named approval or use imagery that actually anonymizes. Give the other two proof cards a number each — the section is titled "real numbers." | Homepage case studies |
| 0.7 | **UK date formats everywhere.** The proposal wizard's native date inputs show `mm/dd/yyyy` on a £-denominated product — a genuine booking-error risk (05/09 → 9 May). Venue placement rows print three different formats across two adjacent components. | Proposal step 2, venue portal |
| 0.8 | **Per-page browser titles for authenticated pages.** Every portal page shares one generic title; six open tabs look identical. The pattern already exists on public pages. | Layout metadata |
| 0.9 | Fix the catalog's closing CTA band (renders as a broken-looking grey slab with unreadable subtitle) and the ghost-opacity footer link columns. | `/catalog/machines`, footer |
| 0.10 | Small but visible: "Days to event: 140 ago" copy, stray `0` rendered at the bottom of the Live page, Recharts zero-size container warning, duplicated CRM sentence on the customer Leads page, benchmark admin table missing its venue-class column (looks like duplicate corrupted rows). | Various |

### Tier 1 — Close the loop (the connective tissue; ~1–2 weeks)

The journey analysis found the flywheel is missing its return spring. These are stitching jobs, not features — most reuse things that already exist.

**The money moment (accepted proposal → live portal):**
- 1.1 **Auto-provision on accept in production** (or at minimum, add an "N accepted quotes need an event workspace" focus item to the internal home — today nothing surfaces accepted-but-unconverted quotes, and the customer-queue only lists items 7+ days stale). `BOOKING_AUTO_PROVISION` is off; `PostAcceptBanner` promises "your portal is locked in… you'll hear from us within the hour" — currently a false promise.
- 1.2 **Tell the buyer an email is coming.** When provisioning runs, the buyer gets a Supabase invite → set-password, but the accept banner never says "check your inbox." One sentence.
- 1.3 Verify the `walkthrough_completed_at` price-reveal gate has a writer — grep found none in the funnel actions; if nothing stamps it, price reveal is a dead path without admin DB edits.

**The pride moment (report → return visit):**
- 1.4 **`report.published` notification** — email + bell to the customer when their report goes live. Today the culminating deliverable of the entire engagement lands silently.
- 1.5 **Post-wrap rebook nudge** — a `event.post_wrap_rebook` archetype ~2 weeks after completion. The notification lifecycle currently covers only *pre*-event t-minus reminders; after the event, the system goes silent forever.
- 1.6 **Authenticated rebook path.** `RebookCTA` links a logged-in customer to the public Book-Now funnel, where they re-enter contact details and create an anonymous quote unlinked to their account. Route it through an in-portal action that pre-creates a quote under their existing account with their brand kit and past config attached ("everything already set up" — this is the Hooked investment step correctly translated for annual frequency).
- 1.7 **Surface rebook beyond the report-gated Reports tab** — customer home and event overview once an event is complete.

**The partner doors:**
- 1.8 **Generalize the organizer email invite to all partner types.** Venues and resellers currently have no way to get a login (the only path is pasting a raw profile UUID). `inviteOrganizerUser` is the done-right template.
- 1.9 **Create-venue flow.** `createVenueSchema` exists with no action or UI; venues can only be born via seed/DB. Add `createVenue` + an admin surface.
- 1.10 Move `LiveShareControls` (stakeholder live-share link) from the Stock tab to the Live tab, where the person who wants to share live numbers actually is.
- 1.11 Fix the `operations_lead` role: it isn't granted the `actions` section, but its home-focus tasks deep-link there and get bounced.
- 1.12 Un-404 `/admin/api`: show the built webhook manager in a read-only/"request access" state when the flag is off instead of hiding a complete feature.

### Tier 2 — The moments (psychology-driven design; ~2–4 weeks)

Where Tier 1 closes the loop mechanically, this tier makes the loop *emotionally* self-reinforcing. Everything here is grounded in a named finding from the research.

**Make yes safe (JOLT + Gong risk-reversal, +32% win rates):**
- 2.1 **"How we de-risk this" section on the proposal microsite**: named delivery lead with photo, replacement-machine SLA, what happens if footfall disappoints, bounded worst case ("you know your exposure on day one").
- 2.2 **Frame the entry tier as a pilot ladder**: "Prove it at your smaller Q2 event; your results report is the business case for the flagship." This converts a £30k decision into a £9.5k reversible one.
- 2.3 **Honest fleet-calendar scarcity**: "3 of 5 Retro Arcade units booked for March" with real availability, on the pricing page and proposal. Verifiable, externally-caused scarcity is the only kind that works on sophisticated buyers; the fleet data exists.
- 2.4 **One recommendation, one alternative** on every proposal — never a catalogue. Cap exploration; offer the firm recommendation ("for your event, this is the configuration I'd book").

**Arm the champion (Gartner buyer enablement, 2.8×/3×):**
- 2.5 **Downloadable one-page business case** on the proposal microsite: cost, projected leads/impressions vs a comparable named case, risk mitigations, and a filled-in "cost of alternatives" row (standard 3×3 stand). Written in CFO language, built to be forwarded unedited.
- 2.6 **Per-role reading paths on one shared proposal page** ("For finance / For brand / For ops" anchors) — shared frame drives committee consensus; separate persona decks hurt it.
- 2.7 **Frictionless colleague access**: "share with your team" on the proposal with no login (already partially built — extend and make prominent).

**Design the peak and the end (peak-end; labor illusion, Buell & Norton):**
- 2.8 **The report reveal as a staged moment**: notification → headline-first results page → board deck download → personal note from the delivery lead. Send the invoice *before* the report, never after — the final beat of the relationship must be pride, not paperwork.
- 2.9 **Champion credits on the report**: "Campaign led by [name], [team]" on the cover, headline framed as *their* achievement, plus one-click exports built for internal showing-off — a Slack-ready highlights graphic, a single results slide for their all-hands, a LinkedIn-safe stat card. Every share is their recognition moment and our marketing.
- 2.10 **The delivery feed (labor illusion)**: portal home during delivery shows the work — "Machine wrapped ✓ (photo) · QA'd by Dan ✓ · In transit to NEC, arriving Tue." Converts weeks of anxious silence into accumulating perceived value. The staged pre-event reveals (wrap render at T-14, game preview at T-7, loading-bay photo at T-1) double as anticipation loops — the correct substitute for engagement gimmicks at annual purchase frequency.
- 2.11 **Booking confirmation as a designed moment**: personal video from the delivery lead within the hour; first portal login shows *their* event name and machine render, never an empty dashboard.
- 2.12 **Let the client name the campaign** ("Acme Arcade Takeover — SXSW") in the portal; the name headlines the results report. IKEA effect: a named thing is an owned thing, and an owned thing is harder to not-rebook. Keep every configurator choice completable in seconds.
- 2.13 **Quiz output with endowed progress and the labor illusion**: proposal opens "Step 2 of 4 — built from your quiz answers" (arrive 40% done, not at a cold start); the quiz's recommendation appears after a brief honest "matching machines to your audience… checking March availability" sequence rather than instantly.
- 2.14 **Budget-cycle timing**: ask for the customer's planning month at booking (one field); schedule a report-summary re-send dated to it. Renewals are decided by documented value 60–90 days before the money decision, not by the renewal conversation.

### Tier 3 — The loops (self-promotion; ~2–6 weeks, compounding forever)

The growth research's core finding: Bright's advantage isn't viral volume, it's that **every artifact is seen by exactly the right next buyer**. The strategy is conversion quality of perfectly-targeted exposures, not K-factor. In fit-to-effort order:

- 3.1 **Invitation footers on every public artifact** (report links, live dashboards, pitch links, widget): not "Powered by Bright.Blue" but **"Want results like this at your event? →"** — Typeform's copy change from credit to invitation lifted CTR 200%. Personalize the landing page with the referring event/vertical (the token already knows). UTM every surface and treat it as a channel measured in influenced-pipeline over quarters.
- 3.2 **Gate content delivery on email at the machine**: score cards / photos / results delivered by email convert capture at 60–92% vs 25–50% optional. Every player becomes a contact; the delivery email is the next loop's surface.
- 3.3 **The post-play email as a two-audience artifact**: the player gets their content; the forwardable payload carries "how this activation performed" + "bring this to your event" for the professional in the room.
- 3.4 **Personal result card engineered for sharing**: the player's score, rank ("top 4% today"), a striking pre-sized visual — personalized-identity content gets shared at ~3–4× the rate of brand content. The player is the hero; the brand and a subtle Bright mark ride along.
- 3.5 **Event Wrapped**: an automatic, story-format "Your activation, wrapped" for the marketer immediately post-event (while pride is hot) — headline number, Bright Index percentile ("top 8% of Q3 activations"), a human moment, one LinkedIn-ready card. The customer posts it to make *themselves* look good; every impression carries Bright to other marketers. Add an annual customer-level Wrapped as a ritual.
- 3.6 **Earned badges from the Bright Index** ("Top-Decile Activation, Q2 2026") — quarterly cadence; badge posts outperform product posts because they center the customer. The Index already computes the percentiles; publish the methodology so the badges stay credible.
- 3.7 **On-machine "want this?" placement at the moment of delight** (post-game/score screen, not a poster): QR scans at 8–30% in dwell contexts vs 0.1–1% ambient. Land on a *live* proof page, never a brochure.
- 3.8 **Partner attribution dashboards**: show venues "your widget sourced 3 inquiries this quarter" and organizers their pitch-link telemetry — marketplace loops spin when the recruiting side sees its own business value (Airbnb's host loop). On sponsor pitch links, view-gate only the *detailed* numbers to capture sponsor identity lightly, then nurture — expect the DocSend dynamic (delayed but perfectly-targeted conversion).
- 3.9 **One engineered talk trigger, operational not digital**: 81% of word of mouth is triggered by something that *occurs* (Baer; DoubleTree's cookie → 34% retell rate). Pick one repeatable, remarkable operational moment for buyers — e.g. **the report lands before the client's team has left the venue** ("the report beat us back to the office" is a story a marketer tells another marketer) — and never skip it. Pair with a "how did you hear about us" field to watch it move.
- 3.10 **No cash referral program.** Rewards taint premium referrals (Ryu & Feick; Wirtz). If anything, reward the *referred* party (priority slot, upgrade) and thank referrers with status and access (early Index data, invite-only events).

---

## Part 3 — The subtractions

Things to remove or refuse, because the evidence says less converts more here:

1. **The welcome tour overlay that fires before the customer sees any of their own data.** The underlying welcome page ("Your next step: 10 assets → Upload") *is* the perfect onboarding; the overlay delays it. Kill or defer it to second login.
2. **The ten identical overdue-upload rows** on the customer home — group into one card ("10 brand assets · one upload flow") with one CTA. A wall of red repetition reads as nagging, not clarity.
3. **Empty-data furniture**: Export/Export CSV buttons on tables with zero rows; "—" columns shown for every row in admin quotes (REACH, MEETING); the "share the live link" copy on a pre-event leads page when no live link exists. If it can't do anything, it shouldn't render.
4. **The pre-event Leads page as-is** — replace the zero-wall with anticipation ("your machine starts filling this on 14 Aug") plus the one useful pre-event action (wire your CRM). Empty states must sell the future, not display absence.
5. **The event workspace's 22 tabs** — audit per-stage: a completed event doesn't need live-state chrome; a pre-brief event doesn't need Stock. Show tabs when they have a job. (Measure: portal nav items with near-zero usage are removal candidates.)
6. **Quiz/intake field discipline**: every field must beat the test "could the walkthrough call ask this better?" Never ask twice what the quiz captured (asking twice is a competence-signal failure). Completion drops ~4% per field beyond three.
7. **Public report chrome**: a shared results report viewed by an exec should have exactly two actions — read, and "run this for your brand." Strip everything else.
8. **Spec-sheet completeness on machine pages and pricing**: fewer, better photos, one killer stat per machine, three tiers with few bullets each. Feature-loading lowers *post*-purchase satisfaction (feature fatigue), which directly damages rebook. Confidence is communicated by what you leave out.
9. **Institutionalize it**: a quarterly "what did we remove" agenda item on quiz, intake, pricing, and portal reviews. The *Nature* subtraction research says without the explicit cue, removal is never even considered.

---

## Part 4 — What's already excellent (protect it)

The live crawl was explicit: don't break these while doing the above.

- **The pricing page** — published bands, persona toggle, currency toggle, the "arithmetic your CFO will do anyway" footer. The single strongest conversion asset on the site. (One fix: order tiers premium-first *and* introduce Lead Engine before "everything in Lead Engine, plus" references it.)
- **The Bright Index and State of Play** — "numbers behind an email wall aren't numbers, they're bait" is a brand voice worth protecting. This is the authority engine the badge loop (3.6) plugs into.
- **The proposal wizard's tone and validation**, the customer home's task-first composition, the venue Embed page's live preview, the ⌘K jump bar, and the honest-labeling patterns ("Illustrative data," "Cloud API — not configured"). Extend that honesty to every zero-state.
- **Technical hygiene**: zero console errors, zero failed requests across ~40 page loads, all 55 public pages returning 200, 2,309 tests green.

---

## Part 5 — Sequencing and measurement

**Order:** Tier 0 (days) → Tier 1 (the loop) → 2.8/2.9/2.10 (report reveal + champion credits + delivery feed — the rebook engine) → 3.1/3.2/3.3 (footers + gated delivery + post-play email — the cheapest loops) → the rest of Tier 2/3 → subtractions continuously.

**Measure:** one dashboard with the loop's pulse — accepted-quote → provisioned time; report-published → customer-viewed rate; rebook rate (the homepage already claims 92%; make the system able to prove it); per-artifact invitation-footer clicks (UTM'd); machine email-capture rate; "how did you hear about us" distribution. Judge loops in quarters, not weeks — the honest lesson of the research is that in this category the loop converts late, but it converts the right people.

**Deliberately out of scope here:** the pricing-band commercial sign-off (OWNER-TODO — placeholder numbers currently quoted in the funnel), the 618 multiple-permissive-policies RLS consolidation (structural refactor, tracked in CHANGELOG), and net-new product lines. This document is about making what exists exceptional and self-feeding.
