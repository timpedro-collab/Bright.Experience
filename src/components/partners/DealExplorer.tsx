"use client";

/**
 * Data-driven deal explorer for generic partner pricing microsites.
 *
 * Generalizes the NrsPricingExplorer layout to arbitrary `DealConfig`
 * shapes: one count + retail lever pair per config lever, shared fleet
 * ceiling, volume ladder and pilot-minimum warning.
 */

import { useMemo, useRef, useState } from "react";
import { FileDown, Link2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { buildDealQuoteDoc, quoteFileName } from "@/lib/deal-quote";
import { encodeDealInputs } from "@/lib/deal-share";
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
  /**
   * A shared mix decoded from the page URL (`@/lib/deal-share`), already
   * validated server-side. When present it wins over the opening preset,
   * so a forwarded link reproduces the sender's exact scenario.
   */
  initialInputs?: DealConfigInputs;
}

/** Inputs for a named preset: its counts at suggested retail. */
function inputsForPreset(
  config: DealConfig,
  counts: Record<string, number>,
): DealConfigInputs {
  const next: DealConfigInputs = {};
  for (const lever of config.levers) {
    next[lever.key] = {
      count: counts[lever.key] ?? 0,
      retail: lever.retail.suggested,
    };
  }
  return next;
}

export function DealExplorer({
  config,
  partnerName,
  initialInputs,
}: DealExplorerProps) {
  const [activePreset, setActivePreset] = useState<string | null>(
    initialInputs ? null : (config.presets?.[0]?.key ?? null),
  );
  const [inputs, setInputs] = useState<DealConfigInputs>(() => {
    // A shared mix from the URL wins; then the first named preset; then
    // fall back to the pilot minimum on the first lever.
    if (initialInputs) return initialInputs;
    const firstPreset = config.presets?.[0];
    if (firstPreset) return inputsForPreset(config, firstPreset.counts);
    const initial: DealConfigInputs = {};
    config.levers.forEach((lever, index) => {
      initial[lever.key] = {
        count: index === 0 ? config.commitment.pilotMinUnits : 0,
        retail: lever.retail.suggested,
      };
    });
    return initial;
  });

  const applyPreset = (key: string) => {
    const preset = config.presets?.find((p) => p.key === key);
    if (!preset) return;
    setActivePreset(key);
    setInputs(inputsForPreset(config, preset.counts));
  };

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

  // Service levers the partner is actually buying in this mix, itemised
  // (count × fee) so the deduction in the bottom-line box explains itself.
  const serviceLines = config.levers
    .filter((lever) => lever.revenue === "service")
    .map((lever) => ({
      key: lever.key,
      label: lever.label,
      count: effective[lever.key] ?? 0,
      fee: dealInputs[lever.key]?.retail ?? lever.retail.suggested,
    }))
    .filter((line) => line.count > 0);

  const setCount = (key: string, count: number) => {
    setActivePreset(null);
    setInputs((prev) => ({
      ...prev,
      [key]: { ...prev[key], count },
    }));
  };

  const setRetail = (key: string, retail: number) => {
    setActivePreset(null);
    setInputs((prev) => ({
      ...prev,
      [key]: { ...prev[key], retail },
    }));
  };

  // A scenario shouldn't die with the tab: the mix can leave as a link
  // (counts and off-suggested prices in the query string) or as a branded
  // one-page PDF quote sheet.
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const copyResetRef = useRef<number | null>(null);

  const scenarioLabel =
    config.presets?.find((p) => p.key === activePreset)?.label ?? "Custom mix";

  const shareUrl = () => {
    const query = encodeDealInputs(config, dealInputs);
    return `${window.location.origin}${window.location.pathname}?${query}`;
  };

  const copyMixLink = async () => {
    const url = shareUrl();
    // Sync the address bar too, so the rep can also just copy from there.
    window.history.replaceState(null, "", url);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    if (copyResetRef.current) window.clearTimeout(copyResetRef.current);
    copyResetRef.current = window.setTimeout(() => setCopied(false), 2500);
  };

  const downloadMixPdf = async () => {
    setDownloading(true);
    try {
      // pdfmake is browser-only and heavy, so it loads on demand and never
      // enters the server bundle or the page's initial JS.
      const [pdfMake, vfsModule] = await Promise.all([
        import("pdfmake/build/pdfmake"),
        import("pdfmake/build/vfs_fonts"),
      ]);
      pdfMake.addVirtualFileSystem(vfsModule.default);
      const doc = buildDealQuoteDoc({
        config,
        inputs: dealInputs,
        deal,
        partnerName,
        scenarioLabel,
        pageUrl: shareUrl(),
      });
      pdfMake.createPdf(doc).download(quoteFileName(partnerName));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[5fr_7fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Build the inventory mix</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {config.presets?.length ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {config.presets.map((preset) => (
                  <Button
                    key={preset.key}
                    type="button"
                    size="sm"
                    variant={activePreset === preset.key ? "default" : "outline"}
                    onClick={() => applyPreset(preset.key)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {config.presets.find((p) => p.key === activePreset)?.description ??
                  "Custom mix — start from a scenario or keep dragging."}
              </p>
            </div>
          ) : null}
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
            // Service levers are fees the partner pays, not retail they
            // set — the slider label has to say which way the money flows.
            const retailLabel =
              lever.revenue === "service"
                ? "Flat service fee per show"
                : `Recommended retail per ${retailUnit}`;
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
            {deal.serviceFees > 0 ? (
              <div className="mt-4 rounded-md border px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Your bottom line on this mix
                </p>
                <dl className="mt-2 space-y-1.5 text-sm">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-muted-foreground">
                      You earn: {partnerPct}% of every sponsorship and ad-slot
                      sale
                    </dt>
                    <dd className="tabular-nums">
                      +{formatDealCurrencyCompact(config.currency, deal.partnerKeeps)}
                    </dd>
                  </div>
                  {serviceLines.map((line) => (
                    <div
                      key={line.key}
                      className="flex items-baseline justify-between gap-4"
                    >
                      <dt className="text-muted-foreground">
                        You buy: {line.label} × {line.count}, at{" "}
                        {formatDealCurrency(config.currency, line.fee)} per show
                      </dt>
                      <dd className="tabular-nums">
                        −{formatDealCurrencyCompact(config.currency, line.count * line.fee)}
                      </dd>
                    </div>
                  ))}
                  <div className="flex items-baseline justify-between gap-4 border-t pt-1.5">
                    <dt className="font-medium">Net to {partnerName}</dt>
                    <dd className="font-semibold tabular-nums text-primary">
                      {formatDealCurrencyCompact(config.currency, deal.netToPartner)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Sponsor placements are money in: someone else pays, and{" "}
                  {partnerPct}% stays with you. The machines above are the one
                  line where you&rsquo;re the buyer — they run your own show
                  numbers, so they&rsquo;re a straightforward purchase at a
                  flat fee, never split.
                </p>
              </div>
            ) : null}
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
            {deal.floorGap > 0 ? (
              <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 [.theme-dark_&]:bg-amber-950 [.theme-dark_&]:text-amber-200">
                This mix sits{" "}
                {formatDealCurrencyCompact(config.currency, deal.floorGap)} below
                the {deal.tier.label} delivery floor of{" "}
                {formatDealCurrency(config.currency, deal.tier.floor)} per
                machine, so as built it wouldn&rsquo;t fund its own delivery.
                Add sellable inventory (placements or ad slots) or remove
                unsold house units.
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyMixLink}
              >
                <Link2 className="size-3.5" aria-hidden />
                {copied ? "Link copied" : "Copy link to this mix"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={downloading}
                onClick={downloadMixPdf}
              >
                <FileDown className="size-3.5" aria-hidden />
                {downloading ? "Preparing PDF…" : "Download this mix (PDF)"}
              </Button>
              <p className="w-full text-xs text-muted-foreground sm:w-auto sm:flex-1">
                Both carry the exact counts and prices set above.
              </p>
            </div>
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
