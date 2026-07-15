/** Case study portfolio card with hero image and headline statistic */
import Image from "next/image";
import Link from "next/link";
import { MapPin, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { logoForClient } from "@/lib/marketing/client-logos";

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
  const stat = caseStudy.statsJson
    ? Object.entries(caseStudy.statsJson)[0]
    : null;
  // Photo-less studies get a deliberate branded tile (client logo on the
  // brand gradient) instead of a placeholder monogram — swap to real event
  // photography by setting hero_image_url in the seed data.
  const clientLogo = !caseStudy.heroImageUrl
    ? logoForClient(caseStudy.clientName)
    : undefined;

  return (
    <Link
      href={`/catalog/case-studies/${caseStudy.slug}`}
      className={cn(
        "group relative block overflow-hidden rounded-[var(--radius-card)] border border-white/[0.06]",
        "bg-[hsl(233,56%,11%,0.55)] backdrop-blur-md transition-all duration-300",
        "hover:border-white/20 hover:-translate-y-1 hover:shadow-[var(--bb-shadow-premium)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "stagger-item"
      )}
      style={{ "--stagger-index": index } as React.CSSProperties}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[radial-gradient(circle_at_30%_30%,hsl(189,100%,75%,0.18),transparent_60%)]">
        {caseStudy.heroImageUrl ? (
          <Image
            src={caseStudy.heroImageUrl}
            alt={caseStudy.title}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : clientLogo?.src ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_50%_40%,hsl(230,93%,53%,0.35),transparent_70%)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={clientLogo.src}
              alt={clientLogo.name}
              className="h-12 w-auto max-w-[60%] object-contain opacity-80 brightness-0 invert transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-heading text-5xl font-bold text-white/15">CS</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
        {caseStudy.clientName && (
          <span className="absolute left-4 top-4 inline-flex items-center rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-[0.625rem] uppercase tracking-widest text-white/90 backdrop-blur-md">
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
            className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-colors group-hover:text-primary"
            aria-hidden
          />
        </div>
        {caseStudy.location && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin size={11} /> {caseStudy.location}
          </div>
        )}
        {stat && (
          <div className="mt-4 flex items-baseline gap-2 border-t border-white/[0.06] pt-3">
            <span className="text-heading text-2xl font-bold text-primary tabular-nums">
              {formatStatValue(stat[0], stat[1])}
            </span>
            <span className="text-xs text-muted-foreground">
              {STAT_LABELS[stat[0]] ?? stat[0]}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
