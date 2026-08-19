"use client";

/**
 * Data-driven deal explorer for generic partner pricing microsites.
 *
 * Generalizes the NrsPricingExplorer layout to arbitrary `DealConfig`
 * shapes: one count + retail lever pair per config lever, shared fleet
 * ceiling, volume ladder and pilot-minimum warning.
 */

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  computeConfigDeal,
  formatDealCurrency,
  formatDealCurrencyCompact,
  slotCapForLever,
  type DealConfig,
  type DealConfigInputs,
} from "@/lib/deal-config";
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

/** Machine units currently deployed per lever, from effective counts. */
function unitsByLeverFrom(
  config: DealConfig,
  effective: Record<string, number>,
): Record<string, number> {
  return Object.fromEntries(
    config.levers.map((lever) => [
      lever.key,
      (effective[lever.key] ?? 0) * lever.unitsPerItem,
    ]),
  );
}

/**
 * Effective item counts after fleet ceiling, physical caps and slot
 * derivation. Machine levers resolve first; slot-inventory levers then cap
 * against the machines those levers actually put on the floor, so shrinking
 * a machine mix pulls sold slots down with it.
 */
function effectiveCountsForLevers(
  config: DealConfig,
  rawCounts: Record<string, number>,
): Record<string, number> {
  const effective: Record<string, number> = {};
  const machineLevers = config.levers.filter((l) => !l.slotSource);
  const slotLevers = config.levers.filter((l) => l.slotSource);

  for (const lever of machineLevers) {
    const otherUnits = machineLevers.reduce((sum, other) => {
      if (other.key === lever.key) return sum;
      const otherCount =
        effective[other.key] ?? Math.max(0, Math.floor(rawCounts[other.key] ?? 0));
      return sum + otherCount * other.unitsPerItem;
    }, 0);

    const raw = Math.max(0, Math.floor(rawCounts[lever.key] ?? 0));
    effective[lever.key] = Math.min(
      raw,
      leverItemCap(config, lever, otherUnits),
    );
  }

  const unitsByLever = unitsByLeverFrom(config, effective);
  for (const lever of slotLevers) {
    const raw = Math.max(0, Math.floor(rawCounts[lever.key] ?? 0));
    const cap = Math.min(
      lever.maxItems ?? Infinity,
      slotCapForLever(lever, unitsByLever),
    );
    effective[lever.key] = Math.min(raw, cap);
  }

  return effective;
}

/**
 * How many items of a machine lever can still be sold given the units
 * already consumed by other levers. Levers that deploy no machines
 * (`unitsPerItem: 0`) never touch the fleet ceiling — dividing by their
 * zero would yield Infinity or NaN — so they are capped by `maxItems`
 * and, for slot-inventory levers, by their derived slot cap.
 */
const NO_FLEET_ITEM_FALLBACK_CAP = 60;

function leverItemCap(
  config: DealConfig,
  lever: DealConfig["levers"][number],
  otherUnits: number,
): number {
  if (lever.unitsPerItem === 0) {
    return lever.maxItems ?? NO_FLEET_ITEM_FALLBACK_CAP;
  }
  const itemCap = lever.maxItems ?? Infinity;
  const fleetCap = Math.floor(
    (config.commitment.maxUnits - otherUnits) / lever.unitsPerItem,
  );
  return Math.min(itemCap, Math.max(0, fleetCap));
}

function countValueLabel(
  lever: DealConfig["levers"][number],
  count: number,
  maxCount: number,
): string {
  if (lever.slotSource) {
    if (maxCount === 0) return "no host machines in the mix";
    return count === 0 ? `0 of ${maxCount} slots` : `${count} of ${maxCount} slots`;
  }
  if (count === 0) return "None";
  if (lever.unitsPerItem === 0) return `${count} sold`;
  if (lever.unitsPerItem === 1) return `${count} units`;
  if (lever.maxItems != null) return `${count} of ${lever.maxItems}`;
  return `${count} units`;
}

function maxCountForLever(
  config: DealConfig,
  lever: DealConfig["levers"][number],
  effective: Record<string, number>,
): number {
  if (lever.slotSource) {
    return Math.min(
      lever.maxItems ?? Infinity,
      slotCapForLever(lever, unitsByLeverFrom(config, effective)),
    );
  }
  const otherUnits = config.levers.reduce((sum, other) => {
    if (other.key === lever.key) return sum;
    return sum + (effective[other.key] ?? 0) * other.unitsPerItem;
  }, 0);
  return leverItemCap(config, lever, otherUnits);
}

interface DealExplorerProps {
  config: DealConfig;
  partnerName: string;
}

export function DealExplorer({ config, partnerName }: DealExplorerProps) {
  const [inputs, setInputs] = useState<DealConfigInputs>(() => {
    const initial: DealConfigInputs = {};
    config.levers.forEach((lever, index) => {
      initial[lever.key] = {
        count: index === 0 ? config.commitment.pilotMinUnits : 0,
        retail: lever.retail.suggested,
      };
    });
    return initial;
  });

  const rawCounts = useMemo(
    () =>
      Object.fromEntries(
        config.levers.map((lever) => [lever.key, inputs[lever.key]?.count ?? 0]),
      ),
    [config.levers, inputs],
  );

  const effective = effectiveCountsForLevers(config, rawCounts);

  const dealInputs: DealConfigInputs = useMemo(() => {
    const next: DealConfigInputs = {};
    for (const lever of config.levers) {
      next[lever.key] = {
        count: effective[lever.key] ?? 0,
        retail: inputs[lever.key]?.retail ?? lever.retail.suggested,
      };
    }
    return next;
  }, [config.levers, effective, inputs]);

  const deal = computeConfigDeal(config, dealInputs);

  const partnerPct = Math.round(config.split.partner * 100);
  const bbPct = Math.round(config.split.brightBlue * 100);
  const splitLabel = `${bbPct} / ${partnerPct}`;

  const setCount = (key: string, count: number) => {
    setInputs((prev) => ({
      ...prev,
      [key]: { ...prev[key], count },
    }));
  };

  const setRetail = (key: string, retail: number) => {
    setInputs((prev) => ({
      ...prev,
      [key]: { ...prev[key], retail },
    }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[5fr_7fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Build the inventory mix</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {config.levers.map((lever) => {
            const count = effective[lever.key] ?? 0;
            const maxCount = maxCountForLever(config, lever, effective);
            const retail = inputs[lever.key]?.retail ?? lever.retail.suggested;
            // Levers with a zero retail band earn nothing directly (the
            // revenue arrives through the slot inventory they host), so a
            // price slider would be meaningless.
            const hasRetail = lever.retail.max > 0;
            const retailDisabled = count === 0;
            const retailUnit =
              lever.slotSource != null
                ? "slot"
                : lever.unitsPerItem > 1
                  ? "bundle"
                  : "placement";
            const retailLabel = `Recommended retail per ${retailUnit}`;
            const retailValueLabel = retailDisabled
              ? lever.slotSource != null
                ? "add a slot above"
                : lever.unitsPerItem === 1
                  ? "add one above"
                  : "add a bundle above"
              : formatDealCurrency(config.currency, retail);

            return (
              <div key={lever.key} className="space-y-6">
                <LeverRow
                  label={lever.label}
                  ariaLabel={`${lever.label} count`}
                  valueLabel={countValueLabel(lever, count, maxCount)}
                  value={count}
                  min={0}
                  max={maxCount}
                  step={1}
                  disabled={lever.slotSource != null && maxCount === 0}
                  onChange={(next) => setCount(lever.key, next)}
                />
                {hasRetail ? (
                  <LeverRow
                    label={retailLabel}
                    ariaLabel={`${lever.label} ${retailLabel}`}
                    valueLabel={retailValueLabel}
                    value={retail}
                    min={lever.retail.min}
                    max={lever.retail.max}
                    step={lever.retail.step}
                    disabled={retailDisabled}
                    onChange={(next) => setRetail(lever.key, next)}
                  />
                ) : null}
                {lever.note ? (
                  <p className="-mt-3 text-xs leading-relaxed text-muted-foreground">
                    {lever.note}
                  </p>
                ) : null}
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground">
            Retail is yours to set. The ranges shown are our suggested bands.
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
            <dl className="grid gap-6 sm:grid-cols-3">
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Gross sponsorship revenue
                </dt>
                <dd className="mt-auto pt-1 text-3xl font-bold tabular-nums text-heading">
                  {formatDealCurrencyCompact(config.currency, deal.gross)}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {partnerName} retains ({partnerPct}%)
                </dt>
                <dd className="mt-auto pt-1 text-3xl font-bold tabular-nums text-primary">
                  {formatDealCurrencyCompact(config.currency, deal.partnerKeeps)}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Retained per machine
                </dt>
                <dd className="mt-auto pt-1 text-3xl font-bold tabular-nums text-heading">
                  {formatDealCurrencyCompact(config.currency, deal.partnerKeepsPerUnit)}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-muted-foreground">
              Bright.Blue&rsquo;s {bbPct}% share covers the machines, creative
              build, on-site crew, software platform, operational monitoring
              and post-show proof-of-performance reporting. You carry the
              sale and the in-building venue services you already contract at
              organizer rates, nothing else.
            </p>
            {deal.belowPilotMinimum ? (
              <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 [.theme-dark_&]:bg-amber-950 [.theme-dark_&]:text-amber-200">
                The pilot commitment is {config.commitment.pilotMinUnits}–
                {config.commitment.pilotMaxUnits} units. Add placements to reach the
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
                {config.floorTiers.map((tier) => {
                  const active = tier.label === deal.tier.label && deal.totalUnits > 0;
                  return (
                    <tr
                      key={tier.label}
                      className={cn(
                        "border-b last:border-0",
                        active && "bg-primary/5 font-medium",
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
                      <td className="py-2 tabular-nums">{splitLabel}</td>
                      <td className="py-2 tabular-nums">
                        {formatDealCurrency(config.currency, tier.floor)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-3 text-sm text-muted-foreground">
              Volume is rewarded through the floor, because delivery economics
              genuinely improve at scale. Up to {config.commitment.maxUnits} machines
              can be on the floor, with volumes committed{" "}
              {config.commitment.cutoffWeeks} weeks before the show.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
