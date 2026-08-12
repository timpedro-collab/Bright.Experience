"use client";

/**
 * Interactive deal explorer for the NRS partner pricing microsite.
 *
 * Buyer-facing: every number rendered here is deck-visible (retail anchors,
 * the 70/30 split, the floor ladder, commitment terms). The slider bounds
 * are the negotiating floors — the UI deliberately cannot express a price
 * below them. Internal economics must never appear in this component.
 */

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  computeDeal,
  formatUsd,
  formatUsdCompact,
  COMMITMENT,
  FLOOR_TIERS,
  RETAIL,
} from "@/lib/partner-pricing";
import { cn } from "@/lib/utils";

/** One labelled slider row with its live value. */
function LeverRow({
  label,
  valueLabel,
  value,
  min,
  max,
  step,
  onChange,
  ariaLabel,
  disabled = false,
}: {
  label: string;
  valueLabel: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (next: number) => void;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn("space-y-2", disabled && "opacity-50")}>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm tabular-nums text-muted-foreground">{valueLabel}</span>
      </div>
      <Slider
        aria-label={ariaLabel}
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={([next]) => onChange(next)}
      />
    </div>
  );
}

export function NrsPricingExplorer() {
  const [singles, setSingles] = useState(12);
  const [singleRetail, setSingleRetail] = useState<number>(RETAIL.single.suggested);
  const [takeovers, setTakeovers] = useState(0);
  const [takeoverRetail, setTakeoverRetail] = useState<number>(RETAIL.takeover.suggested);
  const [corridors, setCorridors] = useState(0);
  const [corridorRetail, setCorridorRetail] = useState<number>(RETAIL.corridor.suggested);

  // Fleet ceiling: every placement draws from the same 50-unit fleet, so
  // each count slider shrinks as the others grow (bundles deploy 3 machines).
  const takeoverUnits = takeovers * RETAIL.takeover.unitsPerBundle;
  const maxSingles = COMMITMENT.maxUnits - takeoverUnits - corridors;
  const effectiveSingles = Math.min(singles, maxSingles);
  const maxCorridors = COMMITMENT.maxUnits - takeoverUnits - effectiveSingles;
  const effectiveCorridors = Math.min(corridors, maxCorridors);

  const deal = computeDeal({
    singles: effectiveSingles,
    singleRetail,
    takeovers,
    takeoverRetail,
    corridors: effectiveCorridors,
    corridorRetail,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[5fr_7fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Build the inventory mix</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <LeverRow
            label="Single-unit placements"
            ariaLabel="Single-unit placements"
            valueLabel={`${effectiveSingles} units`}
            value={effectiveSingles}
            min={0}
            max={maxSingles}
            step={1}
            onChange={setSingles}
          />
          <LeverRow
            label="Recommended retail per single placement"
            ariaLabel="Recommended retail per single placement"
            valueLabel={formatUsd(singleRetail)}
            value={singleRetail}
            min={RETAIL.single.min}
            max={RETAIL.single.max}
            step={RETAIL.single.step}
            onChange={setSingleRetail}
          />
          <LeverRow
            label="Cross-Hall Takeover bundles (3 units each)"
            ariaLabel="Cross-Hall Takeover bundles"
            valueLabel={takeovers === 0 ? "None" : `${takeovers} of ${RETAIL.takeover.maxBundles}`}
            value={takeovers}
            min={0}
            max={RETAIL.takeover.maxBundles}
            step={1}
            onChange={setTakeovers}
          />
          {/* Always mounted: conditionally inserting this row mid-drag shifts
              the layout under the visitor's cursor, which reads as "the
              sliders aren't working". Disabled until a bundle is in the mix. */}
          <LeverRow
            label="Recommended retail per takeover bundle"
            ariaLabel="Recommended retail per takeover bundle"
            valueLabel={takeovers === 0 ? "add a bundle above" : formatUsd(takeoverRetail)}
            value={takeoverRetail}
            min={RETAIL.takeover.min}
            max={RETAIL.takeover.max}
            step={RETAIL.takeover.step}
            disabled={takeovers === 0}
            onChange={setTakeoverRetail}
          />
          <LeverRow
            label="Corridor placements"
            ariaLabel="Corridor placements"
            valueLabel={effectiveCorridors === 0 ? "None" : `${effectiveCorridors} units`}
            value={effectiveCorridors}
            min={0}
            max={maxCorridors}
            step={1}
            onChange={setCorridors}
          />
          <LeverRow
            label="Recommended retail per corridor placement"
            ariaLabel="Recommended retail per corridor placement"
            valueLabel={effectiveCorridors === 0 ? "add a corridor unit above" : formatUsd(corridorRetail)}
            value={corridorRetail}
            min={RETAIL.corridor.min}
            max={RETAIL.corridor.max}
            step={RETAIL.corridor.step}
            disabled={effectiveCorridors === 0}
            onChange={setCorridorRetail}
          />
          <p className="text-xs text-muted-foreground">
            Retail is yours to set. The ranges shown are our suggested bands,
            anchored to the NRS prospectus and comparable show activations.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">What this mix earns</CardTitle>
              <Badge variant="secondary">{deal.totalUnits} machines on the floor</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* flex-col + mt-auto keeps the values on one baseline even when
                a label wraps to a second line. */}
            <dl className="grid gap-6 sm:grid-cols-3">
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Gross sponsorship revenue
                </dt>
                <dd className="mt-auto pt-1 text-3xl font-bold tabular-nums text-heading">
                  {formatUsdCompact(deal.gross)}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Informa retains (30%)
                </dt>
                <dd className="mt-auto pt-1 text-3xl font-bold tabular-nums text-primary">
                  {formatUsdCompact(deal.partnerKeeps)}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Retained per machine
                </dt>
                <dd className="mt-auto pt-1 text-3xl font-bold tabular-nums text-heading">
                  {formatUsdCompact(deal.partnerKeepsPerUnit)}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-muted-foreground">
              Bright.Blue&rsquo;s 70% share covers the machines, creative
              build, on-site crew, software platform, live dashboards and
              post-show reporting. You carry the sale, nothing else.
            </p>
            {deal.belowPilotMinimum ? (
              <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 [.theme-dark_&]:bg-amber-950 [.theme-dark_&]:text-amber-200">
                The pilot commitment is {COMMITMENT.pilotMinUnits}–
                {COMMITMENT.pilotMaxUnits} units. Add placements to reach the
                minimum.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Volume ladder: the price of growth, written down</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 font-medium">Tier</th>
                  <th className="pb-2 font-medium">Units</th>
                  <th className="pb-2 font-medium">Split</th>
                  <th className="pb-2 font-medium">Per-unit floor</th>
                </tr>
              </thead>
              <tbody>
                {FLOOR_TIERS.map((tier) => {
                  const active = tier.label === deal.tier.label && deal.totalUnits > 0;
                  return (
                    <tr
                      key={tier.label}
                      className={cn(
                        "border-b last:border-0",
                        active && "bg-primary/5 font-medium"
                      )}
                    >
                      <td className="py-2">
                        {tier.label}
                        {active ? (
                          <Badge className="ml-2" variant="default">
                            current mix
                          </Badge>
                        ) : null}
                      </td>
                      <td className="py-2 tabular-nums">
                        {tier.minUnits}–{tier.maxUnits}
                      </td>
                      <td className="py-2 tabular-nums">70 / 30</td>
                      <td className="py-2 tabular-nums">{formatUsd(tier.floor)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-3 text-sm text-muted-foreground">
              Volume is rewarded through the floor, because delivery economics
              genuinely improve at scale. Up to {COMMITMENT.maxUnits} machines
              can be on the floor for May, with volumes committed{" "}
              {COMMITMENT.cutoffWeeks} weeks before the show.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
