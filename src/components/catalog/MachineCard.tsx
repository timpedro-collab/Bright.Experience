/** Machine card for the catalog grid — editorial product tile */
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface MachineCardProps {
  machine: {
    name: string;
    slug: string;
    tagline?: string;
    heroImageUrl?: string | null;
    capacityLabel?: string | null;
    mechanisms?: string[] | null;
    playsPerDayLabel?: string;
  };
  index?: number;
  featured?: boolean;
}

export function MachineCard({ machine, index = 0, featured = false }: MachineCardProps) {
  return (
    <Link
      href={`/catalog/machines/${machine.slug}`}
      className={cn(
        // Theme-aware surface — this card renders on the light homepage and
        // the dark catalog alike, so it must use semantic tokens, never a
        // hard-coded dark wash (docs/18-design-research.md Part 0).
        "group relative block overflow-hidden rounded-[var(--radius-card)] border border-border",
        "bg-card",
        "shadow-[var(--bb-shadow-card)] transition-all duration-300",
        "hover:border-ring/40 hover:-translate-y-1 hover:shadow-[var(--bb-shadow-premium)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "stagger-item",
        featured && "md:col-span-2"
      )}
      style={{ "--stagger-index": index } as React.CSSProperties}
    >
      <div
        className={cn(
          "relative aspect-[4/3] overflow-hidden",
          // Token plate under product photography — avoids white-box framing on Ink.
          "bg-muted",
          "bg-[radial-gradient(circle_at_30%_30%,color-mix(in_srgb,var(--color-bb-cobalt)_25%,transparent),transparent_60%),radial-gradient(circle_at_70%_70%,color-mix(in_srgb,var(--color-bb-cyan)_18%,transparent),transparent_55%)]"
        )}
      >
        {machine.heroImageUrl ? (
          <Image
            src={machine.heroImageUrl}
            alt={machine.name}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-heading text-6xl font-bold text-foreground/10">
              {machine.name[0]}
            </span>
          </div>
        )}
        {/* Photography scrim + chip over it — literal by design (§2.7). */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
        {machine.capacityLabel && (
          <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[0.7rem] font-medium text-white/90 backdrop-blur-sm">
            {machine.capacityLabel}
          </span>
        )}
      </div>

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-heading text-lg font-semibold tracking-tight text-foreground">
              {machine.name}
            </h3>
            {machine.tagline && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {machine.tagline}
              </p>
            )}
            {machine.playsPerDayLabel && (
              <p className="mt-1 text-xs text-muted-foreground">
                {machine.playsPerDayLabel} · fleet benchmark
              </p>
            )}
          </div>
          <span
            aria-hidden
            className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground transition-all group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
