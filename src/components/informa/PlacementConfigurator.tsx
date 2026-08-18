/**
 * The seller's kit centerpiece: a rep drags the show size, run length and
 * sponsor price, and watches what the placement creates update live. Value
 * first, price second: the output leads with plays, leads and cost per
 * opted-in lead, the number a sponsor's CFO understands.
 *
 * Buyer-safe: renders only the illustrative projection model from
 * `@/lib/informa/kit-math`. No wholesale numbers, no splits, no floors.
 */
"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  cplPosition,
  formatCount,
  formatUsdWhole,
  INDUSTRY_CPL,
  placementValue,
  type CplPosition,
} from "@/lib/informa/kit-math";

function LeverRow({
  label,
  valueLabel,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  valueLabel: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm tabular-nums text-muted-foreground">{valueLabel}</span>
      </div>
      <Slider
        aria-label={label}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([next]) => onChange(next)}
      />
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
  highlight = false,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-xl border border-[var(--color-bb-cobalt)]/60 bg-[var(--color-bb-cobalt)]/10 p-4"
          : "rounded-xl border border-border/70 bg-card/50 p-4"
      }
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/**
 * The dynamic verdict against the industry benchmark. The comparison line is
 * honest at every slider position: cheaper when it is cheaper, and worth more
 * per lead when it is not.
 */
const CPL_STORIES: Record<CplPosition, string> = {
  below:
    "That is under the industry average for a trade show lead, and these are not scan-and-run leads. Every one is opted in, with a game score, declared preferences and context attached.",
  level:
    "That is level with the industry average for a trade show lead, except an average lead is a badge scan. These arrive opted in, with a game score, declared preferences and context attached, and the sponsor's creative ran on three screens all show.",
  above:
    "That is above the badge-scan average because it buys more than a scan: minutes of hands-on attention, an opt-in, declared preferences, and sole-sponsor screen time all show.",
};

function BenchmarkPanel({ position }: { position: CplPosition | null }) {
  if (!position) return null;
  return (
    <div className="rounded-xl border border-border/70 bg-card/50 p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Against the industry standard
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        The average trade show lead costs{" "}
        <span className="font-semibold text-foreground">
          {formatUsdWhole(INDUSTRY_CPL.low)} to {formatUsdWhole(INDUSTRY_CPL.high)}
        </span>{" "}
        before anyone plays anything, and a field sales call runs{" "}
        {formatUsdWhole(INDUSTRY_CPL.fieldSalesCall)} or more.{" "}
        {CPL_STORIES[position]}
      </p>
      <p className="mt-3 text-xs text-muted-foreground/70">
        Benchmarks: Exhibit Surveys 2025 ($112 average), ShowHero State of
        Trade Shows 2026 ($112 to $186), CEIR $142 blended.
      </p>
    </div>
  );
}

export function PlacementConfigurator() {
  const [attendees, setAttendees] = useState(3_000);
  const [days, setDays] = useState(3);
  const [price, setPrice] = useState(40_000);

  const v = placementValue({ attendees, days, priceUsd: price });

  const range = (low: number, high: number) =>
    low === high ? formatCount(high) : `${formatCount(low)} to ${formatCount(high)}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Build the placement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <LeverRow
            label="Show attendance"
            valueLabel={`${formatCount(attendees)} attendees`}
            value={attendees}
            min={500}
            max={60_000}
            step={500}
            onChange={setAttendees}
          />
          <LeverRow
            label="Days live"
            valueLabel={`${days} ${days === 1 ? "day" : "days"}`}
            value={days}
            min={1}
            max={6}
            step={1}
            onChange={setDays}
          />
          <LeverRow
            label="Sponsor price"
            valueLabel={formatUsdWhole(price)}
            value={price}
            min={30_000}
            max={75_000}
            step={1_000}
            onChange={setPrice}
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            The price is yours to set per show and per placement. The
            projections update so you can hold the value story next to the
            number while you move it.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatTile
            label="Cost per opted-in lead"
            value={
              v.costPerLeadLow == null || v.costPerLeadHigh == null
                ? "n/a"
                : v.costPerLeadLow === v.costPerLeadHigh
                  ? formatUsdWhole(v.costPerLeadHigh)
                  : `${formatUsdWhole(v.costPerLeadLow)} to ${formatUsdWhole(v.costPerLeadHigh)}`
            }
            hint="The number the sponsor's CFO understands"
            highlight
          />
          <StatTile
            label="Opted-in leads"
            value={range(v.leadsLow, v.leadsHigh)}
            hint="Badge-gated plays opt in at the top of the band"
          />
          <StatTile
            label="Completed plays"
            value={range(v.playsLow, v.playsHigh)}
            hint="Capped by what one machine can physically serve"
          />
          <StatTile
            label="Ad impressions"
            value={formatCount(v.impressions)}
            hint="Across three screens of sole-sponsor creative"
          />
        </div>
        <BenchmarkPanel position={cplPosition(v.costPerLeadLow, v.costPerLeadHigh)} />
        <p className="text-xs leading-relaxed text-muted-foreground/70">
          Illustrative projection from the Bright.Blue reach model, not a
          promise: footfall, placement and opening hours all move it. Live
          proposals quote benchmarked ranges with their sample size, and every
          placement reports actuals within 24 hours of close.
        </p>
      </div>
    </div>
  );
}
