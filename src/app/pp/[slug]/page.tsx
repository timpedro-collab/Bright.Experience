/**
 * Partner pricing microsite — a chromeless, capability-URL page that lets a
 * named partner explore Bright.Blue's deal inventory interactively.
 *
 * The unguessable slug in the path is the credential (same model as
 * /proposal/:id); anything not in the registry 404s. The page is buyer-safe
 * by construction: it composes only deck-visible content, and the maths lives
 * in `@/lib/partner-pricing` which is documented as never carrying internal
 * economics. Deliberately outside the (public) route group so the marketing
 * nav and footer never wrap a negotiation document.
 */
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { NrsModelsShowcase } from "@/components/partners/NrsModelsShowcase";
import { NrsPricingExplorer } from "@/components/partners/NrsPricingExplorer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { COMMITMENT } from "@/lib/partner-pricing";

/**
 * Registry of live partner pricing pages. The slug doubles as the
 * credential, so entries must stay unguessable — mint new ones with
 * `openssl rand -hex 6` appended to a readable prefix.
 */
const PARTNER_PAGES = {
  "nrs-europa-4e9d1c7a2b86": {
    partner: "Informa Connect",
    show: "National Restaurant Show, Chicago",
  },
} as const;

type Slug = keyof typeof PARTNER_PAGES;

export const metadata: Metadata = {
  title: "Machine inventory for NRS · Bright.Blue",
  robots: { index: false, follow: false },
};

/**
 * Live activation photography — real wrapped Europas, not renders.
 * Cleaned copies (deck frames trimmed by scripts/clean-nrs-gallery.py);
 * `position` keeps the machine in frame when landscape shots are cropped
 * into the portrait tiles.
 */
const EUROPA_GALLERY = [
  {
    src: "/partners/nrs/gallery/01-hero-pelion.jpg",
    alt: "Europa machine fully wrapped in Pelion branding at a live activation",
    position: "55% 50%",
  },
  {
    src: "/partners/nrs/gallery/02-costa-cup.jpg",
    alt: "Costa-branded Europa activation with custom cup creative",
    position: "100% 50%",
  },
  {
    src: "/partners/nrs/gallery/04-pepsi.jpg",
    alt: "Pepsi-branded Europa machine on an event floor",
    position: "50% 50%",
  },
  {
    src: "/partners/nrs/gallery/05-play-to-win.jpg",
    alt: "Europa running a play-to-win interactive game screen",
    position: "50% 50%",
  },
];

const MODEL_TERMS = [
  {
    term: "Revenue share, 70 / 30",
    detail:
      "You sell each placement into your prospectus at a price you set. Bright.Blue takes 70%, you retain 30%. The machines, creative, crew, platform and reporting are all carried on our side of the line.",
  },
  {
    term: "A per-unit floor",
    detail:
      "Bright.Blue's take never falls below the tier floor, however placements are packaged or discounted. Above the floor, pricing is entirely yours to play with.",
  },
  {
    term: `Pilot: ${COMMITMENT.pilotMinUnits}–${COMMITMENT.pilotMaxUnits} units, take-or-pay`,
    detail:
      `We commit build capacity, you commit placement. Your unit count stays flexible, up or down, until the production lock date, ${COMMITMENT.cutoffWeeks} weeks before the show. From that date we're building, so the number is fixed. Any unsold unit can deploy as show-branded activation, so committed units always do work.`,
  },
  {
    term: "McCormick logistics, split sensibly",
    detail:
      "Everything inside the building (drayage, positioning, electrical) runs through your GSC master contract, where your rates are a fraction of what an outside exhibitor pays. Everything up to the dock (build, freight, crew, wrap) is ours.",
  },
];

export default async function PartnerPricingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = PARTNER_PAGES[slug as Slug];
  if (!page) notFound();

  return (
    /* Always dark: `.theme-dark` remaps every semantic token (globals.css),
       so this page renders the same cinematic slate for every visitor
       regardless of their app theme or OS setting. */
    <div className="theme-dark min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
        {/* Hero */}
        <header className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Page is dark-only; `-light.png` is the white-ink wordmark
                (asset names describe their own ink, not the background). */}
            <Image
              src="/brand/bright-blue-wordmark-light.png"
              alt="Bright.Blue"
              width={150}
              height={40}
              priority
              className="h-8 w-auto"
            />
            <Badge variant="outline" className="text-xs">
              Prepared for {page.partner} · {page.show}
            </Badge>
          </div>
          <div className="space-y-4">
            <h1 className="text-display-grotesk text-4xl leading-tight sm:text-5xl">
              A new inventory line for NRS,
              <br className="hidden sm:block" /> sold the way you already sell
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Interactive brand machines with lead capture, live dashboards and
              post-show reporting, sold through your prospectus like any other
              sponsorship line. The numbers below are live. Drag them and see
              what the program earns.
            </p>
          </div>
        </header>

        {/* Europa in the wild — the product, up top, before any numbers */}
        <section className="mt-10">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {EUROPA_GALLERY.map((photo) => (
              <div
                key={photo.src}
                className="relative aspect-[3/4] overflow-hidden rounded-xl border"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                  style={{ objectPosition: photo.position }}
                />
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            The Europa in the wild. Every placement ships fully wrapped in
            the sponsor&rsquo;s creative. These are live activations, not
            renders.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
            The Europa is a black-box experience engine: a 55&Prime;
            interactive touchscreen that runs branded games, surveys, measured
            sampling and lead capture, and carries a six-slot DOOH ad loop.
            Every sponsor gets a live dashboard during the show and a
            proof-of-performance report after it, which is what brings them
            back the following year.
          </p>
        </section>

        {/* The three models, presented as one programme */}
        <section className="mt-14">
          <h2 className="text-heading text-xl font-bold">
            The three models, one program
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            All three models from the briefing are kept. They run on one set
            of commercial rails, so there&rsquo;s a single agreement behind
            all of them.
          </p>
          <div className="mt-6">
            <NrsModelsShowcase />
          </div>
        </section>

        {/* Embedded media value */}
        <section className="mt-14">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-heading text-xl font-bold">
                The screen is a media channel in its own right
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                Each machine runs a rolling loop of six 10-second video slots.
                On a fully sponsored unit, every slot carries the
                sponsor&rsquo;s creative: sole-sponsor screen time for the
                entire show, in front of an audience of 55,000+ foodservice
                professionals. On the Cross-Hall Takeover that&rsquo;s three
                screens running the brand all show long.
              </p>
              {/* flex-col + mt-auto keeps the values level even when a
                  label wraps to a second line at narrow widths. */}
              <dl className="mt-5 grid gap-6 sm:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Video slots per screen
                  </dt>
                  <dd className="mt-auto pt-1 text-3xl font-bold tabular-nums text-heading">
                    6 × 10s
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Creative plays per show
                  </dt>
                  <dd className="mt-auto pt-1 text-3xl font-bold tabular-nums text-heading">
                    ~1,800
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Audience on the floor
                  </dt>
                  <dd className="mt-auto pt-1 text-3xl font-bold tabular-nums text-primary">
                    55,000+
                  </dd>
                </div>
              </dl>
              <p className="mt-4 max-w-3xl text-sm text-muted-foreground">
                For context: the NRS rate card prices <em>static</em>{" "}
                signage at $27,500–$37,000 against a comparable audience. The screen
                time here is dynamic, sponsor-exclusive and interactive, and
                it&rsquo;s bundled inside the placement price, not sold on top.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* The model */}
        <section className="mt-14">
          <h2 className="text-heading text-xl font-bold">How the partnership works</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {MODEL_TERMS.map((item) => (
              <Card key={item.term}>
                <CardContent className="pt-6">
                  <p className="font-semibold">{item.term}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Explorer */}
        <section className="mt-14">
          <h2 className="text-heading text-xl font-bold">Play with the numbers</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Build the mix you&rsquo;d actually sell and watch the economics
            respond. Every figure updates live.
          </p>
          <div className="mt-6">
            <NrsPricingExplorer />
          </div>
        </section>

        {/* Scale */}
        <section className="mt-14">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="pt-6">
              <h2 className="text-heading text-xl font-bold">
                Fifty machines on the floor in May is real
              </h2>
              <p className="mt-2 max-w-3xl text-sm opacity-90">
                Production capacity for up to {COMMITMENT.maxUnits} units is
                confirmed. The only condition is time. Volumes committed{" "}
                {COMMITMENT.cutoffWeeks} weeks before the show give us the
                runway for builds, creative wraps, consolidation and shipping.
                For a mid-May show, that means locking numbers by
                late November. The volume ladder above already writes down the
                price of growth, so scaling never reopens the negotiation.
              </p>
            </CardContent>
          </Card>
        </section>

        <footer className="mt-14 border-t pt-6 text-sm text-muted-foreground">
          <p>
            Prepared by Bright.Blue for {page.partner}. Suggested retail bands
            are exactly that: final pricing is yours. This page is private to
            this link, so please don&rsquo;t forward it outside the deal team.
          </p>
        </footer>
      </div>
    </div>
  );
}
