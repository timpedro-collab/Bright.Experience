/**
 * CplCalculator — interactive cost-per-lead arithmetic on /business-case.
 *
 * Divides the published tier bands (docs/20) by a lead count the visitor
 * controls, next to the third-party benchmarks a CMO already knows. Only the
 * tiers that include lead capture appear — Showstopper has no lead layer, so
 * a cost-per-lead number for it would be dishonest.
 */
"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import {
  TIERS,
  formatBandAmount,
  type PriceRegion,
  type PricingTier,
} from "@/lib/pricing/tiers";

const REGIONS: ReadonlyArray<{ id: PriceRegion; label: string }> = [
  { id: "uk", label: "UK £" },
  { id: "us", label: "US $" },
  { id: "eu", label: "EU €" },
];

/** External benchmarks a buyer can verify — sources named in the UI. */
const COMPARISONS = [
  { label: "Trade-show average (CEIR)", value: "$112 per lead" },
  { label: "Typical trade-show range", value: "$150–350 per lead" },
  { label: "LinkedIn Lead Gen ads", value: "$75–200 per lead" },
];

/** Cost-per-lead range for a tier at a lead count, in whole major units. */
function cplRange(tier: PricingTier, region: PriceRegion, leads: number): string {
  const band = tier.bands[region];
  const low = Math.round(band.lowMinor / 100 / leads);
  const high = band.highMinor === null ? null : Math.round(band.highMinor / 100 / leads);
  const lowLabel = formatBandAmount(band.currency, low * 100);
  if (high === null) return `From ${lowLabel}`;
  return `${lowLabel}–${formatBandAmount(band.currency, high * 100)}`;
}

export function CplCalculator() {
  const [region, setRegion] = useState<PriceRegion>("uk");
  const [leads, setLeads] = useState(300);

  const leadTiers = TIERS.filter(
    (t) => t.slug !== "bespoke" && t.includedCapabilitySlugs.includes("lead-capture"),
  );

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <label htmlFor="cpl-leads" className="block text-sm font-medium text-foreground">
            Opted-in leads you expect to capture
          </label>
          <div className="mt-2 flex items-center gap-4">
            <input
              id="cpl-leads"
              type="range"
              min={100}
              max={1000}
              step={50}
              value={leads}
              onChange={(e) => setLeads(Number(e.target.value))}
              className="h-2 w-56 cursor-pointer appearance-none rounded-full bg-border accent-[var(--color-bb-cobalt)]"
            />
            <span className="w-14 text-right text-lg font-semibold tabular-nums text-foreground">
              {leads}
            </span>
          </div>
        </div>

        <div
          role="group"
          aria-label="Price region"
          className="flex w-fit rounded-full border border-border p-1"
        >
          {REGIONS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRegion(r.id)}
              aria-pressed={region === r.id}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                region === r.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {leadTiers.map((tier) => (
          <div
            key={tier.slug}
            className="rounded-[var(--radius-card)] border border-border/60 bg-background/60 p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {tier.displayName}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {cplRange(tier, region, leads)}
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                per lead
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              at {leads} opted-in leads
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-border/60 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          What the same lead costs elsewhere
        </p>
        <dl className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-3">
          {COMPARISONS.map((c) => (
            <div key={c.label}>
              <dt className="text-xs text-muted-foreground">{c.label}</dt>
              <dd className="text-sm font-medium text-foreground">{c.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          And unlike a badge scan, every lead here chose to play, chose to opt
          in, and left with something in their hand.
        </p>
      </div>
    </div>
  );
}
