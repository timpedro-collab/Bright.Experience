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
  formatCount,
  formatUsdWhole,
  placementValue,
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

export function PlacementConfigurator() {
  const [attendees, setAttendees] = useState(3_000);
  const [days, setDays] = useState(3);
  const [price, setPrice] = useState(18_000);

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
            min={5_000}
            max={60_000}
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
