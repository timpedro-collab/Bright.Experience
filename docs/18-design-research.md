# Design research — world-class experiential sites & product portals (1 Aug 2026)

**Question asked:** what do the best experiential/marketing agency sites and the
best B2B product portals do that we don't, and which of it is worth stealing for
(a) the public homepage and (b) the logged-in portal?

**Method:** every finding below comes from opening the site and reading its
actual computed styles, stylesheet rules and shipped JavaScript — not from
screenshots or opinion. Where a technique is quoted, the CSS or JS is the real
thing pulled from the live site. Sites researched: the three named
([obexp.com](https://obexp.com/), [momentumww.com](https://www.momentumww.com/),
[freeman.com](https://www.freeman.com/)) plus ~20 further agency sites, a set of
craft-led studio sites for motion technique, and ~20 best-in-class SaaS products
for the portal half.

Recommendations are graded:

- **TAKE** — clear win, fits our brand and stack, do it.
- **ADAPT** — good idea, needs changing before it fits a product (not brochure) site.
- **LEAVE** — looks great on an agency site, would hurt us.

---

## Part 0 · What we have today (the honest baseline)

Establishing this first, because "world-class" only means something relative to
where we actually are.

### Public homepage (`src/components/public/PublicLanding.tsx`)

Section order is sound and follows a real sales sequence: hero → logos →
pillars → machines → proof → platform → how it works → CTA. The copy discipline
is genuinely better than most agency sites — every number on the page is
sourced from `src/lib/marketing/claims.ts` and verified before it changes.

Where it is weak:

| Weakness | Evidence |
|---|---|
| The hero is centred, text-only, and static. No motion, no product, no event photography. | `HeroSection.tsx` — a `RidgeArtwork` SVG behind centred type. |
| Proof numbers are presented as three static tiles, arriving fully-formed. Nothing earns attention. | `ProofSection.tsx` lines 60–72. |
| Case study cards are the default SaaS pattern: image top, text bottom, hover lift + 5% image scale. | `CaseStudyCard.tsx` lines 62–82. |
| Case study cards are hard-coded dark (`bg-[hsl(233,56%,11%,0.55)]`, `border-white/[0.06]`, `text-white/15`) while the default theme is cool-white. Same in the trust tiles. | `CaseStudyCard.tsx` line 67, `ProofSection.tsx` line 64. |
| One typographic voice throughout: Nunito Bold headings, DM Sans body. No editorial contrast. | `globals.css` lines 109–118. |
| Nothing on the page moves on scroll except a CSS stagger utility. | `stagger-fade-up` in `globals.css` line 473. |

### Design system (`src/app/globals.css`)

Stronger than expected and, importantly, already structured the way the best
sites structure theirs — primitives (`--bb-*`) feeding semantic tokens
(shadcn names), with a `.theme-dark` remap. Momentum's own token file has the
identical two-tier shape (`--_primitives---neutral--white` →
`--text-colors--text-body`), so this is validated, not accidental.

We already ship five easing curves (`--bb-ease-emphasized`, `-spring`,
`-enter`, `-exit`, `-standard`), a `prefers-reduced-motion` kill-switch
(line 622) and a container of 1280px — within 32px of Momentum's 82rem. The
foundations are right. **What's missing is not tokens, it's the use of them.**

### Portal

`EventJourney.tsx` is already good and does one thing most products get wrong:
it shows *ownership* ("You" vs "Bright.Blue") next to every milestone, so the
customer sees the whole machine but only acts on their own part. Keep this;
several recommendations below build on it rather than replacing it.

---

## Part 1 · The three sites you sent

### 1. On Board Experiential — [obexp.com](https://obexp.com/)

The most technically interesting of the three, and the closest to what our
homepage should aspire to. Findings, from the live CSS:

**Palette.** Body is `rgb(244,243,235)` — warm cream, near-identical to our
Linen `#F2EDE0` — with `#0f0f0f` text and small, violent accents (`#ff2b00`
orange-red, `#005e85` deep teal, `#00a499`). Notably the accent is *never* a
large area; it's the hover state, the SVG fill, the tile wash.

**Typography — a three-font system, not two:**

| Role | Font | Spec |
|---|---|---|
| Display | Obviously (700) | 42–64px, normal tracking |
| Body | Inter 18pt (400) | 16px |
| **Labels/eyebrows** | **Geist Mono (400)** | **13.6px, `letter-spacing: 1.36px` (0.1em), uppercase** |

The eyebrow being *monospace* is the single most current-feeling detail on the
site. `/ CASE STUDIES /` in mono at 0.1em tracking instantly signals
"instrument panel, real data". See the recommendation in Part 4 — with a caveat,
because we deliberately rejected mono eyebrows once already
(`globals.css` line 294) and I think that decision was right for the app chrome
and wrong for data.

**Stat display.** `120+` / `30+` / `4` rendered at **64px display weight 700**
with a small caption beneath. No card, no border, no icon. Three numbers in a
row on cream. It works because the number is huge and everything else is quiet —
ours are 48–60px inside dark boxes with borders, which fights the number.

**The case-study tile — the thing worth copying wholesale.** Real markup:

```html
<a href="/project/sephora-sephoria">
  <div class="mediawrap" style="padding-top:100%">
    <img class="photo" src="...sephoria_home_trinket_475x475.png">   <!-- resting: product cut-out -->
  </div>
  <div class="overlay with_image">
    <figcaption class="info"><h2>Sephora</h2><h3>SEPHORiA</h3></figcaption>
    <img class="photo" src="...sephoria_work_full_1920x1080.png">    <!-- hover: full campaign shot -->
    <div class="background"><h1>Sephora</h1><h1>Sephora</h1></div>   <!-- duplicated = marquee -->
    <div class="color" style="background-color:#ff2b00"></div>       <!-- per-client accent, inline -->
  </div>
</a>
```

and the CSS that drives it:

```css
.grid.two_col_cropped .cell .overlay {
  position: absolute; inset: 0;
  transform: translate(-100%);
  transition: transform .75s ease-out;
}
.cell:hover .overlay,
.cell.is-inview .overlay          { transform: translate(0); }
.cell:hover .overlay .info h2,
.cell:hover .overlay .info h3,
.cell:hover .overlay img          { transform: translate(0); }
.cell:hover .overlay .color       { transform: translate(0); }
.cell:hover .overlay .background  { opacity: 1; transition: opacity .75s .5s; }
```

Three things make this feel expensive rather than gimmicky:

1. **Staged choreography.** Colour, image and text all slide in over 750ms,
   then the giant brand-name marquee fades up on a **0.5s delay**. The delay is
   the whole trick — it reads as a second thought arriving, not a single blunt
   transition.
2. **Per-client accent colour injected as data**, not CSS. Each tile carries its
   client's brand colour inline. Twelve tiles, twelve colours, one component.
3. **`:hover` and `.is-inview` are the same selector.** Which leads to the
   cleverest thing on the site.

**Mobile parity via two IntersectionObservers.** From their `site.js`:

```js
const mq = window.matchMedia("(max-width: 767px) and (orientation: portrait)");
if (mq.matches) {
  addObs    = new IntersectionObserver(es => es.forEach(e =>  e.isIntersecting && e.target.classList.add("is-inview")),
                                       { threshold: 1 });
  removeObs = new IntersectionObserver(es => es.forEach(e => !e.isIntersecting && e.target.classList.remove("is-inview")),
                                       { threshold: 0, rootMargin: "100px 0px 100px 0px" });
}
```

Two observers, not one: **add** when fully visible (`threshold: 1`), **remove**
only when completely gone plus a 100px margin. That hysteresis gap is why it
never flickers at the boundary — a single observer toggling on one threshold
strobes when the user scroll-jiggles. And it only runs on mobile portrait;
desktop uses `:hover` on the identical CSS. One visual system, two triggers,
no duplicated styling. **TAKE — this is the best single idea I found all day.**

**Giant outlined type bleeding off-canvas:**

```css
.hero .background h1 {
  font-size: 25vw;
  color: transparent;
  -webkit-text-stroke: 2px rgb(178,228,224);
  position: absolute; top: -11vw; right: -2vw;
}
.hero .background h1:last-child { inset: auto auto -6vw -3vw; }
```

Two copies of the same word at 25vw, outlined only, deliberately cropped by the
viewport at opposite corners. Costs nothing, fills space with confidence.

**Numbered navigation** (`01 Home`, `02 Work` … `07 Contact`) at 40px display
weight in the overlay menu. Trivial to do, immediately makes a 7-item menu feel
considered rather than defaulted.

### 2. Momentum Worldwide — [momentumww.com](https://www.momentumww.com/)

**The typography is the lesson.** Display is a **serif** — `"Cardinal Fruit",
Georgia` — at **weight 400**, 62.86px, `letter-spacing: -0.6286px` (-0.01em),
line-height 1.2. Body is TT Norms, a geometric sans, and body text is
`rgb(76,76,76)` on white, not black.

A light-weight serif headline against a geometric sans body is the fastest way
to look like a brand rather than a startup. Every all-sans site on the internet
looks like every other all-sans site, and we are currently one of them. Note
they use serif at **400**, not bold — the size does the work, the weight stays
elegant.

**Token architecture.** Two-tier, primitives → semantic, container 82rem.
Confirms our approach.

**Accessibility done properly on a video hero.** `Skip to main content` and
`Skip to footer` links, and the hero video has an explicit **Toggle Mute**
button and does not autoplay. Compare with Freeman, who autoplay muted+loop
with no control at all. If we ever put video in the hero, Momentum is the model.

**"What We Do" as four statements, not four feature cards.** Each is a full
`h2` sentence — "We create the experiences that make brands matter." — with a
single *Learn more*. No icons, no bullet lists, no three-column grid of
platitudes. Our `PillarsSection` is the icon-and-blurb pattern; this is the more
confident version of the same content.

**Offices as a tabbed map** rather than a list of addresses — ten cities as
`role="tab"`, content swapping in place. Directly reusable for our "12 markets
live" claim, which is currently just a number in a hero pill.

### 3. Freeman — [freeman.com](https://www.freeman.com/)

The least adventurous, the most commercially clear, and worth studying for
exactly that reason. WordPress + jQuery, Nunito Sans throughout — **the same
heading family we already use** — at weight **900** with `letter-spacing:
-0.96px` (-0.02em) on a 48px h1. Our display token sits at -0.025em, so we are
already in the same territory; the difference is they go to 900 where we stop
at 700.

**The one pattern to steal: "Let's Design ___".** A section headed `Let's
Design` followed by three completions, each a link at 22px:

- *Your annual trade show*
- *Your attention-grabbing exhibit*
- *A lasting impression with AV Production*

It is a sentence-completion navigation device. Rather than "Services", the
visitor self-selects by finishing a sentence about their own problem. This maps
onto our business almost too neatly:

> **Let's plan** → *your festival sampling tour* / *your trade show stand* /
> *your retail activation* / *your conference lead capture*

Each completion routes into a pre-filtered quiz or catalog view. **TAKE.**

Hero video is `autoplay muted loop` with no poster and no control — **LEAVE**,
that's the anti-pattern Momentum shows the fix for.

---

## Part 2 · The reference class nobody thinks of: hardware that produces data

Agency sites sell taste. We sell a physical machine that produces numbers —
which makes our closest structural analogue not an agency at all, but a
hardware-plus-telemetry brand. [WHOOP](https://www.whoop.com/) is the sharpest
example and is worth more to us than half the agency list.

**Their type spec, measured:**

| Element | Spec |
|---|---|
| h1 | 50px, **weight 400**, `letter-spacing: -1.5px` (-0.03em), `line-height: 40px` (**0.8**) |
| h2 | 49.75px, weight 400, -0.03em |
| h3 | 25px, weight 600, -0.04em |
| Primary CTA | 12.15px, **weight 700, uppercase, `letter-spacing: 1.21px` (0.1em)**, `border-radius: 16px`, `padding: 19px 31px`, `background: #4A53FF`, `transition: background-color .2s, border-color .2s, color .2s` |

Two things to notice. First, the display face is **weight 400 at 50px with
sub-1.0 line-height** — big, light and tight. We currently go big, *bold* and
1.04. Bold-at-huge is the startup default; light-at-huge with tight tracking is
what reads premium. Second, their brand blue `#4A53FF` is within a hair of our
cobalt `#183EF6` — we already own the right colour, we just use it less
confidently than they do.

**Their video hero is the correct compromise:** `autoplay muted loop` *with* an
explicit `aria-label="Pause video"` control. Freeman gives no control; Momentum
doesn't autoplay at all; WHOOP autoplays but always lets you stop it. That's the
one to copy.

**Three structural moves worth taking:**

1. **Outcome claims as differentials, not absolutes.** Their proof line is "91
   more minutes of weekly activity, 2.3 more hours of sleep per week, over 10%
   higher HRV". Every number is *versus not having it*. Ours are mostly
   absolutes — "92% rebook rate", "200k impressions", "100% consent". Absolutes
   are impressive but unanchored; "200k impressions" begs "compared to what?".
   The strongest claim we own — "up to 40% more leads" — is also the only
   differential, and we've hedged it with "up to".
2. **Product UI as the hero imagery.** Their feature carousel pairs each app
   screen with a benefit headline ("Quantify how your body is feeling"). Our
   `PlatformSection` describes the portal in words. We have a genuinely
   good-looking portal and we are hiding it.
3. **Proof stacked at two altitudes.** Cristiano Ronaldo sits directly beside
   "Ashlynn P., WHOOP Member". Famous name for credibility, ordinary name for
   relatability. We have Storyblok and Adyen (excellent logos, two long
   testimonials) but no volume of short, human, one-line quotes.

---

## Part 3 · Homepage recommendations

Ordered by impact per hour of work. Each names the source, the mechanism, and
the file it lands in.

### H1 · Rebuild the case-study tile as a staged hover/in-view reveal — **TAKE**

*Source: On Board Experiential. File: `src/components/catalog/CaseStudyCard.tsx`.*

This is the highest-value change on the list. Our current tile is the default
SaaS card; theirs is a small piece of theatre that also carries more
information.

Proposed behaviour for each activation tile:

- **Resting:** the machine on a clean linen field, client logo, activation name.
  Quiet, uniform, scannable — twelve tiles read as one grid.
- **On hover (desktop) / on scroll-into-view (mobile):** a colour wash in *that
  client's own brand colour* slides in from the left over 750ms, carrying the
  real event photograph and the headline number ("**200k** brand impressions"),
  with the client name marqueeing behind on a 500ms delay.

The per-client colour comes from data, not CSS — we already have
`logoForClient()` in `src/lib/marketing/client-logos.ts`, so it gains a
`brandColor` field and the tile reads `style={{ backgroundColor: brandColor }}`
exactly as OBE does inline.

The mobile-parity trick is the part to implement carefully — one `.is-inview`
class, two IntersectionObservers with the hysteresis gap:

```ts
// add when fully visible; remove only once fully gone + 100px.
// Two observers, because one observer on a single threshold strobes.
const add = new IntersectionObserver(
  (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("is-inview")),
  { threshold: 1 },
);
const remove = new IntersectionObserver(
  (es) => es.forEach((e) => !e.isIntersecting && e.target.classList.remove("is-inview")),
  { threshold: 0, rootMargin: "100px 0px 100px 0px" },
);
```

Gate it behind `matchMedia("(max-width: 767px)")` and
`prefers-reduced-motion: no-preference`, and write the whole visual in CSS keyed
off `:hover, .is-inview` so desktop needs no JavaScript at all.

**Effort:** ~4–6 hours including the colour data and a Testing Library spec.
**Fixes on the way:** the hard-coded dark surfaces in that component.

### H2 · Give the hero a job beyond typography — **TAKE**

*Source: WHOOP (structure + type spec), Momentum (video handling).*

Three changes, in order of cost:

1. **Retune the display type.** Move the h1 from bold-at-1.04 to the premium
   setting the best sites converge on: larger, lighter, tighter. WHOOP runs 50px
   at weight 400 / -0.03em / 0.8 line-height; Momentum runs a 400-weight serif
   at -0.01em. Concretely, `.text-display` moves to `letter-spacing: -0.03em`
   and `line-height: 0.95`, and the hero h1 drops from `font-bold` to a
   500/600 weight at a larger clamp. **1 hour, and it changes the whole feel.**
2. **Put the product in the hero.** Right now a visitor sees a headline and an
   abstract ridge pattern; they cannot tell what we sell. A machine on the
   right-hand third — ideally a short looping clip of a queue forming at one —
   answers "what is this?" in one second.
3. **If it becomes video, copy WHOOP exactly:** `autoplay muted loop playsInline`
   with a real `aria-label="Pause video"` control and a poster frame, skipped
   entirely under `prefers-reduced-motion`.

### H3 · "Let's plan ___" as the self-selection device — **TAKE**

*Source: Freeman. New section between hero and pillars.*

Replace or precede the pillars grid with a sentence the visitor completes:

> **Let's plan** → *your festival sampling tour* · *your trade show stand* ·
> *your retail activation* · *your conference lead capture*

Each completion is a link at ~22px that routes into the quiz pre-seeded with
that event type, so the visitor arrives at question two instead of question one.
It converts an abstract "Services" grid into an act of self-identification, and
it directly feeds the funnel we already have. **~3 hours.**

### H4 · Make the proof numbers earn attention — **TAKE**

*Source: On Board (scale + restraint), WHOOP (differential claims). File: `ProofSection.tsx`.*

Two changes:

- **Presentation.** OBE renders `120+` at 64px on bare cream with a caption
  underneath — no card, no border. Ours are 48–60px inside dark bordered boxes,
  and the box competes with the number. Strip the chrome, take the number to
  ~72–96px, keep the caption small and quiet. Add a count-up on scroll-into-view
  reusing the easing already in `LiveCounter` (1200ms, cubic ease-out) —
  **but read `prefers-reduced-motion` in JS and render the final value
  immediately when set** (see P4 below; this is a real bug in the existing
  component).
- **Framing.** Anchor at least one claim as a differential rather than an
  absolute: "200k impressions" is unanswerable without a comparison. If the
  telemetry supports something like "3× the dwell time of a standard stand",
  that single line outperforms all three current tiles.

### H5 · Introduce a second typographic voice — **ADAPT**

*Source: Momentum.*

Every all-sans site looks like every other all-sans site, and we are currently
one of them. Momentum's serif-display-at-400 against a geometric sans body is
the cheapest available upgrade in perceived quality.

**Why ADAPT and not TAKE:** Nunito is a brand asset, not a choice we can
unilaterally overturn. The proposal is therefore scoped — introduce an editorial
serif *only* on public marketing surfaces (hero h1, section h2, pull-quotes),
leave the portal entirely on Nunito/DM Sans. That keeps the app coherent and
lets the marketing site have a voice. Needs a brand decision before any code.

### H6 · Numbered navigation and giant outlined type — **TAKE (small)**

*Source: On Board.*

Two cheap wins:

- Number the nav items in the mobile/overlay menu (`01 Machines`, `02 Work`,
  `03 How it works`…). Pure presentation, ~30 minutes.
- Section headers get a huge outlined word bleeding off-canvas behind them:
  `font-size: 25vw; color: transparent; -webkit-text-stroke: 2px <tint>` with
  `aria-hidden`. Costs nothing, fills empty space with confidence. Use it once
  or twice, not on every section.

### H7 · Show the portal on the marketing site — **TAKE**

*Source: WHOOP feature carousel. File: `PlatformSection.tsx`.*

`PlatformSection` currently describes the platform in prose. We have a live
event dashboard with counters, a feed and a fleet board — screenshots of it,
each paired with a benefit headline ("Watch the queue build, play by play"),
would do more selling than any paragraph. The asset is free; we just have to
point a camera at it.

### H8 · Markets as an interactive map or tabs — **ADAPT**

*Source: Momentum's ten-city tab strip.*

"12 markets live" is currently a static pill. Momentum turn theirs into a tabbed
strip with content swapping per city. For us it's a chance to show reach without
claiming offices we don't have — so the framing must be "activations delivered
here", not "our offices". Worth doing only after H1–H4.

---

## Part 4 · The finding that matters most: the category has no evidence

Across 23 experiential agency homepages read at the bundle level, **not one
surfaces a structured performance number on a case-study card.** Sparks shows a
photograph and a client name. George P. Johnson hides its caption behind
`opacity: 0` until hover, so on touch it never appears at all. Czarnowski buries
"25,000 people" mid-sentence in prose. Exactly one site in twenty animates a
number anywhere (Czarnowski, via `odometer.js` on a ScrollTrigger).

This is the whole opportunity. The category competes on photography and
typography because photography and typography are all it has. We have telemetry
— plays, dwell, opt-in rate, cost per engagement — recorded per activation and
already in the database. A card that reads

> **Costa Coffee** · Notting Hill Carnival · **200k** impressions · **100%** consent

beats every site in the study at the only job the page has. It is also the
cheapest thing on this list to build, because the data already exists in
`stats_json` and `CaseStudyCard` already renders one stat — it just renders it
last, small, and below the fold of the card.

**Do not put that number behind a hover.** Freeman's and GPJ's hover-only
captions are the mistake to avoid; on touch the proof simply never renders. In
recommendation H1 the *photograph* is what the hover reveals — the number stays
visible at rest.

### 4a · Why the category doesn't publish outcomes (follow-up investigation, 1 Aug 2026)

A fair challenge was raised: if these are the best agencies in the world, is
their silence on results a choice we should understand before betting against
it? Investigated at the case-study *detail* level plus industry research. The
short answer: their silence has three causes — **they can't, they're often not
allowed, and it's not in their interest** — and none of the three transfers to
us cleanly, though two carry real cautions.

**What they actually publish.** OBE's
[SEPHORiA case study](https://obexp.com/project/sephora-sephoria) does show
numbers — "4k+ attendees (sold out) · 90k virtual registrants · 55 brand
partners". Every one is a *scale input*, not an outcome. Its prose "Results"
section contains zero figures ("ticket sales and registration exceeded our
expectations, plus encouraging feedback") and is followed by **ten award
listings** and two press links. Freeman's
[Shoptalk case study](https://www.freeman.com/case-studies/shoptalk/) contains
no numbers at all — pure adjectives. So the taboo is not on numbers; it is
specifically on *performance* numbers. Awards and press function as the
industry's substitute proof currency: peer-judged, client-flattering, safe to
publish, and impossible to compare on price.

**Cause 1 — they structurally can't.** Industry research is unambiguous:
[Curious Nation's Activation Effectiveness Barometer](https://aws1.campaignasia.com/article/marketers-pour-millions-on-btl-only-2-say-they-can-measure-roi/506086)
finds only **2% of senior marketers are very confident measuring BTL ROI** and
5% can accurately track brand impact; Anyroad's 2025 research puts "proving
experiential ROI" as the #1 challenge for 39% of marketers; Bizzabo's 2025
State of Events has **70% of organisers struggling to demonstrate ROI**. The
core attribution problem: someone attends on Saturday and converts on Tuesday,
and the connection is invisible — digital gets last-touch credit
([Ether](https://intoether.co/learn/experiential-marketing/attribution-experiential-marketing)).
A stage builder or booth agency has no instrumentation of its own; what it
could publish is footfall estimates and badge scans, which sophisticated
buyers correctly discount as vanity metrics. Their results prose is vague
because there is nothing deterministic underneath it. Even
[Jack Morton's own people writing in The Drum](http://www.thedrum.com/opinion/why-your-b2b-experiential-strategy-is-failing-if-you-re-only-measuring-revenue)
frame measurement as the industry's open wound. Momentum advertises "the
world's first custom suite of measurement tools" on its homepage — and still
publishes no outcome numbers.

**Cause 2 — they're often not allowed.** Performance data belongs to the
client, and agency contracts carry confidentiality/publicity clauses. Even
anonymised, outcome data reveals competitively sensitive facts (how fast a
database grew, what a lead costs). Attendance counts and awards clear legal
review; conversion data mostly doesn't. Standard guidance is that even
anonymised case studies need written client approval.

**Cause 3 — it's not in their interest.** Agencies sell creativity and scale
to CMOs. Hard numbers invite CFO/procurement arithmetic: publish "3,000 leads"
next to a known production budget and you've handed procurement a
cost-per-lead figure to benchmark against LinkedIn ads. Qualitative proof
protects pricing power. Published numbers also set precedent (every future
client demands them) and create liability (an underperforming activation can
never be published, which clients notice). The market lets them get away with
it: BTL budgets keep rising (60% holding, 28% increasing into 2026) despite
the 2% measurement confidence — measurement is not what wins a Sephora-scale
pitch, relationships and creative reputation are.

**Why our position is different — and where it isn't.**

1. *Capability inverts.* The machine is the sensor. Plays, vends and consented
   opt-ins are first-party, deterministic, timestamped events — not estimated
   footfall. We can publish what they structurally cannot, and our hero line
   ("Measured to the play") already promises it; case studies without numbers
   would actively contradict our own positioning.
2. *The buyer inverts.* Their buyer chooses between agencies on creative
   reputation. Our buyer is an event marketer who must defend spend to a CFO —
   the exact person the research says is under "extreme pressure to defend
   every dollar" with no way to do it. For that buyer, published numbers are
   the purchase trigger, not a nice-to-have. We are selling the antidote to
   the category's #1 reported pain.
3. *The procurement risk transfers, partially.* Numbers do invite
   cost-per-lead math. Mitigation: publish **rates and differentials, not raw
   counts** — opt-in rate, dwell versus a standard stand, rebook rate. Rates
   prove effectiveness without handing over a divisor. Where a raw count is
   used, it should be one we win on at any denominator (100% consent rate).
4. *The confidentiality constraint transfers fully — confirmed by direct
   experience (1 Aug 2026).* Costa Coffee has been very hard to get approval
   from even for posting a video of the activation. Whose sensor recorded the
   number is irrelevant; a *client-attributed* figure needs that client's
   sign-off, and enterprise brand legal teams default to no. Anonymisation
   barely helps at our portfolio size: "a global coffee chain · a giant
   branded cup outside their own store · 10 UK city centres" identifies Costa
   in one guess, failing the insider test. The workable publication tiers are:

   - **Aggregate portfolio numbers** — "across N activations: median opt-in
     rate X%, 92% rebook rate". These are *our* operating statistics, name no
     client, and need no one's legal sign-off. This is also exactly WHOOP's
     model ("members see 91 more minutes…" is a cohort claim, not a customer
     claim). While the portfolio is small, check no single activation
     dominates an aggregate enough to be identifiable.
   - **Named case studies with numbers, where the tier permits.** Storyblok
     and Adyen already gave named, logo'd testimonials — the mid-market tech
     tier says yes. Enterprise FMCG (Costa, Coca-Cola) should be expected to
     say no, and the plan must not depend on them.
   - **Contract plumbing for the future:** a publicity clause offered at
     signing (named / anonymised / aggregate-only menu, occasionally traded
     for a small discount), and a `publication_rights` field on the
     case-study record so publishing is gated by data, not by memory.

5. *One of our own numbers fails our own test.* "200k brand impressions" is an
   estimated reach figure — exactly the soft metric the industry is criticised
   for. It should be demoted or footnoted with methodology; the deterministic
   figures (plays, vends, opt-ins, rebook rate) should lead.

**⚠ Pre-launch compliance flag.** The seeded flagship case study is *fully
named Costa*: ten photographs, a stats block
(`{"gamePlays":3270,"brandImpressions":200000,"marketingOptIns":1980,"consentRatePct":100}`,
`supabase/seed.sql` line 250), and an attributed quote from "Brand Experience
Team, Costa Coffee". The homepage trust tiles in `claims.ts` derive the 200k
and 100% figures from that same telemetry. Every element — name, photos,
quote, numbers — needs written Costa sign-off before the site goes public, or
replacement with aggregate framing.

**Verdict (revised):** the differentiation strategy stands, but its centre of
gravity moves. The homepage's hard numbers should lead with what is
unambiguously ours to publish — aggregate rates across the portfolio, the
rebook rate, category benchmarks from our own telemetry — with named
client-attributed case studies as the second layer, populated only from
clients whose tier and contract permit it. The case-study tile design (H1)
must therefore work without a client logo or brand colour: number + event
type + category colour is the anonymous variant, and it still beats the
category, because the number is the differentiator — not the logo.

---

## Part 5 · Motion: fix the foundation before adding any

Our motion tokens are good. Our motion *enforcement* is broken, and it is worth
fixing before we animate anything else.

### P1 · Reduced motion is not actually honoured — **verified bug, fix first**

`globals.css` line 622 does the standard blanket nuke:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

That only reaches CSS. Measured against the actual codebase:

| | Count |
|---|---|
| Files importing `framer-motion` | **28** |
| Files calling `useReducedMotion` | **1** (`EventProgressRing.tsx`) |
| Files running raw `requestAnimationFrame` | **6** |

So 27 Framer Motion components and every `rAF` loop — including
`LiveCounter`'s 1200ms count-up, which is the most prominent animation a
customer sees during a live event — animate at full speed for a user who has
explicitly asked the operating system for less motion.

Two changes fix the whole class:

1. **`<MotionConfig reducedMotion="user">` at the root layout.** One line; every
   Framer Motion component in the tree inherits it.
2. **Zero the duration tokens rather than nuking every element**, which is how
   Stripe does it. State still changes instantly and correctly, and nothing is
   left frozen mid-flight:

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --bb-duration-micro: 0ms; --bb-duration-fast: 0ms; --bb-duration-base: 0ms;
    --bb-duration-slow: 0ms;  --bb-duration-page: 0ms;
  }
}
```

Keep a narrower `!important` net for third-party CSS we don't control. The
`rAF` loops need an explicit `useReducedMotion()` guard that renders the final
value immediately — that's a six-file change.

### P2 · Three easings and two durations to add

A census of easing curves across production CSS from Stripe, Apple, Linear,
Vercel, Locomotive and the studio sites shows a small shared vocabulary. Ours
is close; three gaps are worth closing:

```css
@theme {
  /* add */
  --bb-ease-expressive: cubic-bezier(0.16, 1, 0.3, 1);      /* hero + section reveals */
  --bb-ease-sheet:      cubic-bezier(0.32, 0.72, 0, 1);     /* drawers, dialogs (Linear + Vercel) */
  --bb-ease-symmetric:  cubic-bezier(0.45, 0.05, 0.55, 0.95); /* bidirectional / scrubbed only */
  --bb-duration-reveal: 600ms;                               /* scroll entrance */
  --bb-duration-hero:   900ms;                               /* one per page, maximum */
  --bb-stagger-tight:   20ms;   /* nav items — Apple's exact interval */
  --bb-stagger-base:    40ms;   /* cards (already in use) */
}
```

The rules the good sites obey without exception, worth writing into
`docs/09-design-system.md`:

- Hover and focus: **100–200ms, ease-out**. Anything ≥250ms feels sticky.
- Entrance: **400–600ms, ease-out with a long tail**. Never ease-in-out on
  one-directional motion.
- **Exit is 60–70% of entrance.** Leaving is faster than arriving.
- **Distance scales with duration**, not the other way round — 600ms belongs to
  a 24px translate, not a 120px one.
- **One element per page over 800ms**, at most.
- **`transform` and `opacity` only.** Across every bundle read, no site animated
  `width`, `top` or `left`.

### P3 · Cheap wins that read as expensive

- **Stripe's 3px arrow nudge.** A boolean custom property (`--hov: 0|1`) drives
  every derived property through `calc()`, so a composite hover state cannot
  desync. The travel is **3px, not 8** — that restraint is most of why it reads
  as expensive. Applies to every CTA and card link, marketing and portal.
- **Mask-gradient edge fades**, one hour of work, zero JavaScript:
  `mask-image: linear-gradient(90deg, #0000, #000 16px, #000 calc(100% - 16px), #0000)`.
  Belongs on the logo marquee, overflowing table headers, and the command
  palette result list.
- **`tabular-nums` on every animating number.** We already set
  `font-variant-numeric: tabular-nums` in `.text-heading`; Linear goes further
  with `slashed-zero`. Without tabular figures a count-up reflows on every frame.
- **Marquee upgrade.** Our `bb-logo-marquee` is already correct (duplicated
  content, `translateX(-50%)`, `linear`, paused on hover, disabled under reduced
  motion). Only gap: add `focus-within:` alongside `hover:` for keyboard users.

### P4 · Two things to explicitly not do

**No smooth-scroll library.** Lenis and Locomotive Scroll replace native
scrolling with JS interpolation, which breaks browser find-in-page, fights
Next.js App Router scroll restoration, desyncs screen-reader virtual cursors,
and adds input latency on trackpads. INVNT ship
`html.lenis { scroll-behavior: unset !important }` as a required workaround.
For a product with a portal full of forms, tables and long documents, the
trade is not worth it.

**View Transitions: public routes only, and not yet.** We're on Next 16.2.12
and React 19.2.4, so `experimental.viewTransition` is available. But the browser
holds the *old* snapshot frozen until the new DOM commits — in a
server-component-heavy app that means frozen-page time equal to the RSC fetch
plus Suspense resolution. On portal pages that will feel worse than an instant
swap. Marketing routes first, measured, or not at all.

---

## Part 6 · Portal recommendations

The reference class here is deliberately *not* agency sites. Copying editorial
maximalism into an operational workspace would be a mistake. These come from
Linear, Stripe, Vercel's Geist, Frame.io, Filestage and Figma.

The framing constraint throughout: **our customer is an occasional visitor, not
a power user.** A brand marketer at Coca-Cola opens this perhaps once a
fortnight. That single fact disqualifies a lot of otherwise-excellent Linear
patterns.

### R1 · Split the customer home into "Needs you" and "Recent activity" — **TAKE**

Linear separates Triage ("needs a decision from me") from Inbox ("things that
happened"), and that split is the highest-leverage change available to us. A
customer landing cold needs one question answered: *is anything waiting on me?*
When the answer is no, say so plainly and name the next date that will need
them.

We already have the pieces — `AllClearState`, `EmptyState`, `home-focus.ts`,
`event-next-step.ts`. This is composition, not new machinery.

### R2 · Health as a property distinct from stage — **TAKE**

Linear models *status* (where the work is) and *health* (whether it's going
well) as separate, independently filterable properties. Our `currentStage` has
to encode both today, which makes a red node ambiguous between "this stage is
late" and "this stage failed". Adding an on-track / at-risk / blocked enum plus
a one-line reason resolves it, and `HealthIndicator.tsx` already exists.

A related Linear idea worth taking for customer-facing dates: **let date
precision match date certainty.** "Reporting: March 2026" is more credible than
a specific day we will miss.

### R3 · Asset review — the three products have already converged — **TAKE**

Frame.io, Filestage and Figma have independently arrived at the same model, and
we have roughly half of it. What we have: annotation pins with normalised
coordinates (`AnnotatablePreview.tsx`), a version timeline
(`AssetVersionTimeline.tsx`), comment threads, resolve toggles. What's missing,
in value order:

1. **Version stacks.** The *asset* is the durable object and versions are an
   attribute of it; newest opens by default, a version chip in the header
   exposes history, comments belong to a version rather than the asset.
2. **Side-by-side compare with a slider overlay.** Frame.io's Comparison Viewer
   has linked zoom across panes, and a draggable reveal line down the middle.
   For vinyl wraps and print artwork the slider is far more useful than two
   panes, and it's the cheaper half — ship it first.
3. **Lock on approve** (Ziflow) and an **exportable audit trail of every
   comment, version and decision** (Filestage). Given our compliance and QA
   stages, the audit export isn't optional.
4. **Guest review by link, no account.** Both Ziflow and Filestage support this
   deliberately. A login wall in front of a single approval is the biggest
   drop-off risk we have with external reviewers.

One framing rule worth internalising from Filestage: comments are a to-do list,
not a chat log. They need a resolved state and a visible open count.

### R4 · A four-step text-grey ramp — **TAKE, highest craft-per-hour**

Linear's production tokens show density comes from the grey ramp, not from
shrinking rows:

```
--color-text-primary    --color-text-secondary
--color-text-tertiary   --color-text-quaternary
```

Four steps let a dense row carry a title, subtitle, metadata string and
timestamp without any of them competing. We currently have two
(`foreground` / `muted-foreground`), so every secondary element competes at the
same weight. Linear also pairs each type size with its own tracking (-0.011em
at 15px, -0.013em at 14px) and uses variable-font optical weights (510, 590,
680) rather than 500/600/700.

Colour then gets reserved almost entirely for status — which is the discipline
that makes a single cobalt accent land.

### R5 · Table and empty-state content rules — **TAKE, low effort**

Geist publishes the most directly implementable spec I found. Adopt wholesale:

- `tabular-nums` on every numeric column.
- **Em-dash `—` for unknown values.** Never `N/A`, never blank.
- Relative time under seven days (`2m ago`), absolute beyond (`14 Mar 2026`),
  with exact UTC on hover.
- Pagination copy is `21–40 of 142`, en-dash inside the range.
- Sortable headers are buttons that announce the *next* sort state.
- **Render the empty state outside the table**, never as an empty `<tbody>`.
- Empty-state CTAs are Title Case verb-plus-noun — never `Get Started`,
  `Continue` or `OK`. **Three CTAs is a smell.**
- A skeleton is not an empty state. If there was never any data, don't shimmer.
- Status colours are deliberately **not** brand-themeable: a red error stays red
  regardless of Bright.Blue hue.

### R6 · Live telemetry: drill-down and honest status — **ADAPT**

Vercel Observability's shape — chart → ranked list → detail → raw log, with the
time selection carried through a drag-select — maps cleanly onto live event
mode: chart of the hour, ranked list of machines, machine detail, raw telemetry
feed. We have all four surfaces already; they just aren't connected as a
drill-down.

One rule to apply immediately: **don't re-render status colour on every polling
tick, only when the underlying state changes.** A status dot strobing between
amber and green during a live event destroys credibility faster than showing
nothing. We poll every 10 seconds.

### R7 · Plain English for customer-facing labels — **TAKE**

Our internal stage names (`configuration`, `qa`) are jargon to a brand marketer.
Linear's rule is "aim for clarity — don't invent terms". The customer-facing
labels should read "We're building your game" and "We're testing it" even where
the underlying enum is unchanged. `src/lib/customer-copy.ts` is already the
right home for this; it just needs completing.

### R8 · What not to bring into the portal — **LEAVE**

- **Keyboard shortcuts as the only path to anything.** Keep `⌘K` and `?` for
  internal staff; a fortnightly visitor will never learn `G` then `I`.
- **A configurable dashboard for customers.** They will never configure it, so
  the default is the only view they will ever see. Make the default correct.
- **Auto-launching the product tour.** Always pair `Start Tour` with `Skip`.
- **Infinite scroll on anything referenceable.** Pagination is deep-linkable and
  conveys total volume; infinite scroll loses position on every return visit,
  which is exactly what an occasional visitor does.
- **Clickable badges.** Geist keeps badges static. A user who learns that some
  pills are buttons stops trusting all of them.
- **Scroll reveals on portal lists.** Entrance animation belongs to genuinely
  new content — a live feed item — not to rows that were already there. Our
  `feed-item-in` keyframe already gets this right.

---

## Part 7 · Suggested sequence

Ordered so that foundations land before anything built on top of them.

| # | Change | Effort | Why here |
|---|---|---|---|
| 1 | **P1** reduced-motion fix (`MotionConfig` + duration zeroing + 6 rAF guards) | ~3h | A real accessibility bug, and the foundation for every animation below |
| 2 | **P2** add three easings, two durations, stagger constants | ~1h | Everything else references these |
| 3 | **H1** case-study tile: staged reveal, per-client colour, number visible at rest | ~6h | Biggest single homepage win; fixes the hard-coded dark surfaces |
| 4 | **H4** proof numbers: strip chrome, scale up, count-up on enter | ~3h | The category's blind spot, and we already own the data |
| 5 | **R4** four-step grey ramp + per-size tracking | ~4h | Highest craft-per-hour in the portal; touches every screen |
| 6 | **R1** split "Needs you" from "Recent activity" | ~5h | Highest-leverage change for the occasional customer |
| 7 | **H3** "Let's plan ___" self-selection section | ~3h | Feeds the existing quiz funnel |
| 8 | **H2** hero: retune display type, put the product in it | ~4h | Do the type retune even if the imagery slips |
| 9 | **R5** table + empty-state content rules | ~4h | Removes a whole class of future inconsistency |
| 10 | **R2** health as a property distinct from stage | ~5h | Unblocks honest "at risk" reporting |
| 11 | **R3** version stacks → compare slider → audit export → guest links | ~3–4 days | The largest item; sequence it internally in that order |
| 12 | **H5** editorial serif for marketing surfaces | — | Blocked on a brand decision, not on engineering |

Items 1–4 are roughly a week and would move the homepage further than anything
else on the list. Item 11 is a project in its own right and should be scoped
separately.
