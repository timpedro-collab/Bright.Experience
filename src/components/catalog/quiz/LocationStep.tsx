/** Experiential location cards with footfall heat and tier badges. */
"use client";

import { MapPin, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumberUS } from "@/lib/currency";
import {
  EXPERIENTIAL_LOCATIONS,
  FALLBACK_EXPERIENTIAL_LOCATION,
  reachForLocation,
  TIER_LABEL,
  TIER_HEAT,
  type ExperientialLocation,
} from "@/lib/experiential-locations";
import { FootfallHeat } from "./FootfallHeat";

const ALL_LOCATIONS: ExperientialLocation[] = [
  ...EXPERIENTIAL_LOCATIONS,
  FALLBACK_EXPERIENTIAL_LOCATION,
];

export function LocationStep({
  selectedKey,
  days,
  onPick,
}: {
  selectedKey: string | null;
  days: number;
  onPick: (key: string) => void;
}) {

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {ALL_LOCATIONS.map((loc) => {
          const isSelected = selectedKey === loc.key;
          const reach = reachForLocation(loc, days || 3);
          return (
            <button
              key={loc.key}
              type="button"
              onClick={() => onPick(loc.key)}
              aria-pressed={isSelected}
              className={cn(
                "group relative flex flex-col gap-2 rounded-[var(--radius-control)] border border-border bg-muted/40 p-4 text-left transition-all duration-150",
                "hover:border-primary/40 hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected && "border-primary bg-primary/10 shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-bb-cobalt)_50%,transparent),var(--bb-shadow-premium)]"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex items-center gap-2">
                  {loc.partner ? (
                    <Network size={16} className="text-primary" aria-hidden />
                  ) : (
                    <MapPin size={16} className="text-primary" aria-hidden />
                  )}
                  <span className="text-sm font-semibold text-foreground">{loc.shortName}</span>
                </span>
                {loc.hero ? (
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-primary">
                    Hero
                  </span>
                ) : loc.partner ? (
                  <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-muted-foreground">
                    Partner
                  </span>
                ) : null}
              </div>

              <span className="text-xs leading-snug text-muted-foreground">{loc.blurb}</span>

              <div className="flex items-center gap-2 pt-0.5">
                <FootfallHeat level={TIER_HEAT[loc.tier]} />
                <span className="text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">
                  {TIER_LABEL[loc.tier]}
                </span>
              </div>

              <div className="mt-1 flex items-center justify-between border-t border-border/60 pt-2 text-xs">
                <span className="text-muted-foreground">
                  {loc.key === "other"
                    ? "Footfall varies"
                    : `${formatNumberUS(loc.dailyFootfall)}/day${loc.partner ? " avg" : ""}`}
                </span>
                <span className="font-semibold text-foreground">
                  ≈ {formatNumberUS(reach.impressions)} impressions
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        More sites and partner networks — Space &amp; People, Simon Property and others — are added all the time.
      </p>
    </div>
  );
}
