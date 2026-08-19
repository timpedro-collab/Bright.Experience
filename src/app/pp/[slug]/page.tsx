/**
 * Partner pricing microsite — a chromeless, capability-URL page that lets a
 * named partner explore Bright.Blue's deal inventory interactively.
 *
 * The unguessable slug in the path is the credential (same model as
 * /proposal/:id); pages not in the database 404. The page is buyer-safe
 * by construction: it composes only deck-visible content, and the maths lives
 * in `@/lib/deal-config` which is documented as never carrying internal
 * economics. Deliberately outside the (public) route group so the marketing
 * nav and footer never wrap a negotiation document.
 */
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { DealExplorer } from "@/components/partners/DealExplorer";
import { NrsModelsShowcase } from "@/components/partners/NrsModelsShowcase";
import { NrsPricingExplorer } from "@/components/partners/NrsPricingExplorer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { COMMITMENT } from "@/lib/partner-pricing";
import type { DealConfig, DealConfigInputs } from "@/lib/deal-config";
import { decodeDealInputs } from "@/lib/deal-share";
import { getPartnerPricingPageBySlug } from "@/lib/queries/partner-pricing";
import { recordLoopEvent } from "@/server/loop-events";

export const dynamic = "force-dynamic";

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
      "You sell each placement into your prospectus at a price you set. Of every sale, 30% is yours to keep and 70% funds the delivery: the machines, creative, crew, platform and reporting, all carried on our side of the line.",
  },
  {
    term: "A per-unit floor",
    detail:
      "Each unit carries a delivery floor: the tier price that keeps the build, crew and platform funded however placements are packaged or discounted. Above the floor, pricing is entirely yours to play with.",
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPartnerPricingPageBySlug(slug);

  if (!page) {
    return {
      title: { absolute: "Private Pricing — Bright.Blue" },
      robots: { index: false, follow: false },
    };
  }

  // Distinct, self-describing link previews: when this page is shared in
  // WhatsApp/iMessage alongside the decks, the title must say what it is.
  // WhatsApp reads og:* over <title>, so OpenGraph is set explicitly —
  // otherwise the root layout's generic OG card wins.
  const title = `Private Pricing — ${page.partnerName} × Bright.Blue`;
  const description = `The live commercial page for ${page.partnerName}: build the machine mix and see what the program earns.`;
  return {
    title: { absolute: title },
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, type: "website" },
  };
}

function NrsPartnerPricingPage({
  partnerName,
  showLabel,
}: {
  partnerName: string;
  showLabel: string;
}) {
  return (
    <>
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
            Prepared for {partnerName} · {showLabel}
          </Badge>
        </div>
        <div className="space-y-4">
          <h1 className="text-display-grotesk text-4xl leading-tight sm:text-5xl">
            A new inventory line for NRS,
            <br className="hidden sm:block" /> sold the way you already sell
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Interactive brand machines with opted-in lead capture and
            post-show proof-of-performance reporting, sold through your
            prospectus like any other sponsorship line. The numbers below are
            live. Drag them and see what the program earns.
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
          Prepared by Bright.Blue for {partnerName}. Suggested retail bands
          are exactly that: final pricing is yours. This page is private to
          this link, so please don&rsquo;t forward it outside the deal team.
        </p>
      </footer>
    </>
  );
}

function GenericPartnerPricingPage({
  partnerName,
  showLabel,
  config,
  hero,
  sharedInputs,
}: {
  partnerName: string;
  showLabel: string;
  config: DealConfig;
  hero: Record<string, unknown> | null;
  sharedInputs: DealConfigInputs | null;
}) {
  const bbPct = Math.round(config.split.brightBlue * 100);
  const partnerPct = Math.round(config.split.partner * 100);
  const { pilotMinUnits, pilotMaxUnits, maxUnits, cutoffWeeks } = config.commitment;

  const heroTitle =
    typeof hero?.title === "string"
      ? hero.title
      : "A new inventory line, sold the way you already sell";
  const heroSubtitle =
    typeof hero?.subtitle === "string"
      ? hero.subtitle
      : "Interactive brand machines with opted-in lead capture and post-show proof-of-performance reporting, sold through your prospectus like any other sponsorship line. The numbers below are live. Drag them and see what the program earns.";
  const explorerNote =
    typeof hero?.explorerNote === "string" ? hero.explorerNote : null;
  // Optional companion links (rate card, sample report...) provisioned with
  // the page, so the reader can reach the rest of the suite from here.
  const heroLinks = Array.isArray(hero?.links)
    ? hero.links.filter(
        (l): l is { label: string; href: string } =>
          typeof l === "object" &&
          l !== null &&
          typeof (l as { label?: unknown }).label === "string" &&
          typeof (l as { href?: unknown }).href === "string",
      )
    : [];

  const genericTerms = [
    {
      term: `Revenue share, ${bbPct} / ${partnerPct}`,
      detail: `You sell each placement into your prospectus at a price you set. Of every sale, ${partnerPct}% is yours to keep and ${bbPct}% funds the delivery: the machines, creative, crew, platform and reporting, all carried on our side of the line.`,
    },
    {
      term: "A per-unit floor",
      detail:
        "Each unit carries a delivery floor: the tier price that keeps the build, crew and platform funded however placements are packaged or discounted. Above the floor, pricing is entirely yours to play with.",
    },
    {
      term: `Pilot: ${pilotMinUnits}–${pilotMaxUnits} units, take-or-pay`,
      detail: `We commit build capacity, you commit placement. Your unit count stays flexible, up or down, until the production lock date, ${cutoffWeeks} weeks before the show. From that date we're building, so the number is fixed.`,
    },
    {
      term: "Venue labor, split sensibly",
      detail:
        "Everything inside the building — drayage, positioning, electrical, and union labor where the venue requires it — runs through your general-service contract, where organizer rates are a fraction of what an outside exhibitor pays. Everything up to the dock (build, freight, crew, wrap) is ours. The per-unit floor is priced on this split: buying in-building labor at exhibitor rates would push it substantially higher.",
    },
  ];

  return (
    <>
      <header className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Image
            src="/brand/bright-blue-wordmark-light.png"
            alt="Bright.Blue"
            width={150}
            height={40}
            priority
            className="h-8 w-auto"
          />
          <Badge variant="outline" className="text-xs">
            Prepared for {partnerName} · {showLabel}
          </Badge>
        </div>
        <div className="space-y-4">
          <h1 className="text-display-grotesk text-4xl leading-tight sm:text-5xl">
            {heroTitle}
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">{heroSubtitle}</p>
        </div>
      </header>

      <section className="mt-14">
        <h2 className="text-heading text-xl font-bold">How the partnership works</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {genericTerms.map((item) => (
            <Card key={item.term}>
              <CardContent className="pt-6">
                <p className="font-semibold">{item.term}</p>
                <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-heading text-xl font-bold">Play with the numbers</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Build the mix you&rsquo;d actually sell and watch the economics
          respond. Every figure updates live.
        </p>
        {explorerNote ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {explorerNote}
          </p>
        ) : null}
        <div className="mt-6">
          <DealExplorer
            config={config}
            partnerName={partnerName}
            initialInputs={sharedInputs ?? undefined}
          />
        </div>
      </section>

      <section className="mt-14">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6">
            <h2 className="text-heading text-xl font-bold">
              {maxUnits} machines on the floor is real
            </h2>
            <p className="mt-2 max-w-3xl text-sm opacity-90">
              Production capacity for up to {maxUnits} units is confirmed. The
              only condition is time. Volumes committed {cutoffWeeks} weeks before
              the show give us the runway for builds, creative wraps, consolidation
              and shipping. The volume ladder above already writes down the price
              of growth, so scaling never reopens the negotiation.
            </p>
          </CardContent>
        </Card>
      </section>

      {heroLinks.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-heading text-xl font-bold">Go deeper</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {heroLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="mt-14 border-t pt-6 text-sm text-muted-foreground">
        <p>
          Prepared by Bright.Blue for {partnerName}. Suggested retail bands
          are exactly that: final pricing is yours. This page is private to
          this link, so please don&rsquo;t forward it outside the deal team.
        </p>
      </footer>
    </>
  );
}

export default async function PartnerPricingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const page = await getPartnerPricingPageBySlug(slug);
  if (!page) notFound();

  // A shared mix in the query string ("?mix=...") reopens the explorer on
  // the exact scenario the sender built; decoding validates against the
  // config so a tampered link can't express out-of-band numbers.
  const sharedInputs =
    page.template === "generic"
      ? decodeDealInputs(page.config, await searchParams)
      : null;

  await recordLoopEvent("partner_pricing_view", {
    artifact: "partner_pricing",
    metadata: { slug },
  });

  return (
    /* Always dark: `.theme-dark` remaps every semantic token (globals.css),
       so this page renders the same cinematic slate for every visitor
       regardless of their app theme or OS setting. */
    <div className="theme-dark min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
        {page.template === "nrs" ? (
          <NrsPartnerPricingPage
            partnerName={page.partnerName}
            showLabel={page.showLabel}
          />
        ) : (
          <GenericPartnerPricingPage
            partnerName={page.partnerName}
            showLabel={page.showLabel}
            config={page.config}
            hero={page.hero}
            sharedInputs={sharedInputs}
          />
        )}
      </div>
    </div>
  );
}
