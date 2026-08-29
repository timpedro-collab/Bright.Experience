/**
 * Case-study portfolio tile with a staged hover/in-view reveal (On Board
 * Experiential pattern, docs/18-design-research.md H1). Resting: quiet,
 * uniform, scannable. On hover (desktop) or scroll-into-view (mobile
 * portrait, via useInViewClass): the client's own brand colour washes in
 * from the left carrying the headline number, then the client name arrives
 * huge behind it on a half-second delay. Choreography lives in globals.css
 * under `.cs-tile`; anonymised studies get the gating upstream in
 * `applyPublicationRights`, so this component renders whatever attribution
 * it is given.
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, ArrowUpRight, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { logoForClient } from "@/lib/marketing/client-logos";
import { useInViewClass } from "@/hooks/useInViewClass";

interface CaseStudyCardProps {
  caseStudy: {
    title: string;
    slug: string;
    clientName?: string;
    location?: string;
    heroImageUrl?: string;
    statsJson?: Record<string, unknown>;
  };
  index?: number;
}

const STAT_LABELS: Record<string, string> = {
  samples: "samples",
  plays: "plays",
  gamePlays: "game plays",
  brandImpressions: "impressions",
  marketingOptIns: "opt-ins",
  consentRatePct: "consent rate",
  leads: "leads",
  leadOptInPct: "opt-in",
  npsScore: "NPS",
  cities: "cities",
  prizeRedemptions: "prizes",
  sponsorActivations: "sponsors",
  avgDwellSec: "avg dwell",
  interactions: "interactions",
  giftsVended: "gifts vended",
  satisfactionPct: "satisfaction",
};

/** Render a stat value with thousands grouping and a unit suffix where helpful. */
function formatStatValue(key: string, value: unknown): string {
  if (typeof value === "number") {
    if (key.endsWith("Pct")) return `${value}%`;
    if (key === "npsScore") return `${value} / 5`;
    if (key === "avgDwellSec") return `${value}s`;
    return value.toLocaleString("en-US");
  }
  return String(value);
}

export function CaseStudyCard({ caseStudy, index = 0 }: CaseStudyCardProps) {
  const inViewRef = useInViewClass();
  const stat = caseStudy.statsJson
    ? Object.entries(caseStudy.statsJson)[0]
    : null;
  const clientLogo = logoForClient(caseStudy.clientName);
  // Per-client accent injected as data, not CSS (On Board pattern).
  // Anonymised clients never match a logo, so they safely fall back to
  // Bright.Blue cobalt.
  const washColor = clientLogo?.brandColor ?? "hsl(230, 93%, 43%)";
  // Photo-less studies get a deliberate branded tile (client logo on the
  // brand gradient) instead of a placeholder monogram — swap to real event
  // photography by setting hero_image_url in the seed data.
  const showLogoTile = !caseStudy.heroImageUrl && clientLogo?.src;

  return (
    <Link
      ref={inViewRef}
      href={`/catalog/case-studies/${caseStudy.slug}`}
      className={cn(
        "cs-tile group relative block overflow-hidden rounded-[var(--radius-card)]",
        "border border-border bg-card transition-shadow duration-300",
        "hover:shadow-[var(--bb-shadow-premium)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "stagger-item"
      )}
      style={{ "--stagger-index": index } as React.CSSProperties}
    >
      {/* Resting layer — quiet and uniform so a grid of tiles reads as one piece. */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[radial-gradient(circle_at_30%_30%,color-mix(in_srgb,var(--color-bb-cyan)_14%,transparent),transparent_60%)]">
        {caseStudy.heroImageUrl ? (
          <Image
            src={caseStudy.heroImageUrl}
            alt={caseStudy.title}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : showLogoTile ? (
          /* Photo-less tiles rest on the client's own brand colour (the same
             hue the hover wash uses), so the grid reads as a wall of brands
             even before any interaction. A soft dark vignette keeps the
             white logo and chip legible on light brand hues. */
          <div
            className="cs-brand-tile absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: washColor }}
          >
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_35%,rgba(0,0,0,0.38)_100%)]"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={clientLogo!.src}
              alt={clientLogo!.name}
              className="relative h-12 w-auto max-w-[60%] object-contain opacity-90 brightness-0 invert"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-heading text-5xl font-bold text-foreground/10">
              CS
            </span>
          </div>
        )}
        {caseStudy.clientName && (
          /* Chip over photography / brand wash — literal by design (§2.7). */
          <span className="absolute left-4 top-4 inline-flex items-center rounded-full border border-white/20 bg-black/35 px-2 py-0.5 text-[0.625rem] uppercase tracking-widest text-white backdrop-blur-md">
            {caseStudy.clientName}
          </span>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-heading text-base font-semibold text-foreground line-clamp-2">
            {caseStudy.title}
          </h3>
          <ArrowUpRight
            className="h-4 w-4 shrink-0 text-muted-foreground/70"
            aria-hidden
          />
        </div>
        {caseStudy.location && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin size={11} /> {caseStudy.location}
          </div>
        )}
        {stat && (
          <div className="mt-4 flex items-baseline gap-2 border-t border-border pt-3">
            <span className="text-heading text-2xl font-bold text-primary tabular-nums">
              {formatStatValue(stat[0], stat[1])}
            </span>
            <span className="text-xs text-muted-foreground">
              {STAT_LABELS[stat[0]] ?? stat[0]}
            </span>
          </div>
        )}
      </div>

      {/* Staged overlay — brand wash slides in, info trails it, the giant
          name arrives last. All choreography in globals.css `.cs-tile`. */}
      <div
        aria-hidden
        className="cs-overlay flex flex-col justify-end"
        style={{ backgroundColor: washColor }}
      >
        {/* Legibility layer: white type must survive any brand hue. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/15 to-black/5" />

        {caseStudy.clientName && (
          <div className="cs-overlay-name pointer-events-none absolute inset-0 overflow-hidden">
            <span
              className="absolute -right-[6%] -top-[8%] whitespace-nowrap text-heading text-[clamp(3.5rem,9vw,6rem)] font-bold leading-none text-transparent"
              style={{ WebkitTextStroke: "1.5px rgba(255,255,255,0.35)" }}
            >
              {caseStudy.clientName}
            </span>
            <span
              className="absolute -bottom-[6%] -left-[4%] whitespace-nowrap text-heading text-[clamp(3.5rem,9vw,6rem)] font-bold leading-none text-transparent"
              style={{ WebkitTextStroke: "1.5px rgba(255,255,255,0.22)" }}
            >
              {caseStudy.clientName}
            </span>
          </div>
        )}

        <div className="cs-overlay-info relative p-5">
          {stat && (
            <p className="text-heading text-5xl font-bold leading-none text-white tabular-nums">
              {formatStatValue(stat[0], stat[1])}
              <span className="ml-2 align-baseline text-sm font-semibold text-white/80">
                {STAT_LABELS[stat[0]] ?? stat[0]}
              </span>
            </p>
          )}
          <p className="mt-3 text-sm font-medium text-white/90 line-clamp-2">
            {caseStudy.title}
          </p>
          <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-white">
            View case study <ArrowRight aria-hidden className="size-3.5" />
          </p>
        </div>
      </div>
    </Link>
  );
}
