"use client";

/**
 * Create a partner-pricing microsite with a minted slug credential.
 *
 * Defaults mirror the standard NRS-style deal structure; every field is
 * editable before issue because each prospect's terms differ.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPartnerPricingPage } from "@/app/actions/partner-pricing";
import type { DealConfig, DealCurrency } from "@/lib/deal-config";
import { slugifyPartnerName } from "@/lib/partner-identity";

interface LeverRow {
  label: string;
  unitsPerItem: string;
  maxItems: string;
  retailMin: string;
  retailMax: string;
  retailSuggested: string;
  retailStep: string;
}

interface FloorTierRow {
  label: string;
  minUnits: string;
  maxUnits: string;
  floor: string;
}

const DEFAULT_LEVER: LeverRow = {
  label: "Single-unit placements",
  unitsPerItem: "1",
  maxItems: "",
  retailMin: "45000",
  retailMax: "70000",
  retailSuggested: "50000",
  retailStep: "1000",
};

const DEFAULT_FLOOR_TIERS: FloorTierRow[] = [
  { label: "Pilot", minUnits: "1", maxUnits: "15", floor: "15000" },
  { label: "Scale", minUnits: "16", maxUnits: "30", floor: "13500" },
  { label: "Portfolio", minUnits: "31", maxUnits: "50", floor: "12000" },
];

function emptyLeverRow(): LeverRow {
  return {
    label: "",
    unitsPerItem: "1",
    maxItems: "",
    retailMin: "",
    retailMax: "",
    retailSuggested: "",
    retailStep: "1000",
  };
}

function emptyFloorTierRow(): FloorTierRow {
  return {
    label: "",
    minUnits: "",
    maxUnits: "",
    floor: "",
  };
}

/** Derive stable lever keys from labels, deduplicating with -2, -3, … suffixes. */
function deriveLeverKeys(rows: LeverRow[]): string[] {
  const used = new Set<string>();
  return rows.map((row) => {
    const base = slugifyPartnerName(row.label) || "lever";
    let key = base;
    let suffix = 2;
    while (used.has(key)) {
      key = `${base}-${suffix}`;
      suffix += 1;
    }
    used.add(key);
    return key;
  });
}

function parsePositiveInt(value: string): number | null {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function buildConfig(
  currency: DealCurrency,
  brightBluePct: string,
  partnerPct: string,
  pilotMinUnits: string,
  pilotMaxUnits: string,
  maxUnits: string,
  cutoffWeeks: string,
  levers: LeverRow[],
  floorTiers: FloorTierRow[],
): DealConfig {
  const keys = deriveLeverKeys(levers);

  return {
    currency,
    split: {
      brightBlue: Number(brightBluePct) / 100,
      partner: Number(partnerPct) / 100,
    },
    commitment: {
      pilotMinUnits: Number.parseInt(pilotMinUnits, 10),
      pilotMaxUnits: Number.parseInt(pilotMaxUnits, 10),
      maxUnits: Number.parseInt(maxUnits, 10),
      cutoffWeeks: Number.parseInt(cutoffWeeks, 10),
    },
    levers: levers.map((row, index) => {
      const lever: DealConfig["levers"][number] = {
        key: keys[index]!,
        label: row.label.trim(),
        unitsPerItem: Number.parseInt(row.unitsPerItem, 10),
        retail: {
          min: Number(row.retailMin),
          max: Number(row.retailMax),
          suggested: Number(row.retailSuggested),
          step: Number(row.retailStep),
        },
      };
      const maxItems = parsePositiveInt(row.maxItems);
      if (maxItems != null) lever.maxItems = maxItems;
      return lever;
    }),
    floorTiers: floorTiers.map((row) => ({
      label: row.label.trim(),
      minUnits: Number.parseInt(row.minUnits, 10),
      maxUnits: Number.parseInt(row.maxUnits, 10),
      floor: Number(row.floor),
    })),
  };
}

export function NewPartnerPricingPageForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [partnerName, setPartnerName] = useState("");
  const [showLabel, setShowLabel] = useState("");
  const [currency, setCurrency] = useState<DealCurrency>("USD");
  const [brightBluePct, setBrightBluePct] = useState("70");
  const [partnerPct, setPartnerPct] = useState("30");
  const [pilotMinUnits, setPilotMinUnits] = useState("12");
  const [pilotMaxUnits, setPilotMaxUnits] = useState("15");
  const [maxUnits, setMaxUnits] = useState("50");
  const [cutoffWeeks, setCutoffWeeks] = useState("25");
  const [levers, setLevers] = useState<LeverRow[]>([{ ...DEFAULT_LEVER }]);
  const [floorTiers, setFloorTiers] = useState<FloorTierRow[]>(
    DEFAULT_FLOOR_TIERS.map((row) => ({ ...row })),
  );

  const [splitError, setSplitError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function updateLever(index: number, patch: Partial<LeverRow>) {
    setLevers((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function updateFloorTier(index: number, patch: Partial<FloorTierRow>) {
    setFloorTiers((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  async function handleCopyUrl() {
    if (!createdSlug || typeof window === "undefined") return;
    const url = `${window.location.origin}/pp/${createdSlug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const bb = Number(brightBluePct);
    const partner = Number(partnerPct);
    if (!Number.isFinite(bb) || !Number.isFinite(partner) || bb + partner !== 100) {
      setSplitError("Bright.Blue % and Partner % must sum to 100.");
      return;
    }
    setSplitError(null);

    const config = buildConfig(
      currency,
      brightBluePct,
      partnerPct,
      pilotMinUnits,
      pilotMaxUnits,
      maxUnits,
      cutoffWeeks,
      levers,
      floorTiers,
    );

    startTransition(async () => {
      const result = await createPartnerPricingPage({
        partnerName: partnerName.trim(),
        showLabel: showLabel.trim(),
        config,
      });

      if (!result.success) {
        setSubmitError(result.error);
        return;
      }

      setCreatedSlug(result.data.slug);
      router.refresh();
    });
  }

  if (createdSlug) {
    const url =
      typeof window === "undefined"
        ? `/pp/${createdSlug}`
        : `${window.location.origin}/pp/${createdSlug}`;

    return (
      <div className="space-y-4 rounded-[var(--radius-card)] border border-border bg-card/70 p-5">
        <p className="text-heading text-sm font-semibold text-foreground">Page created</p>
        <p className="text-sm text-muted-foreground">
          Share this link only with the deal team — the slug is the credential.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="rounded bg-muted px-3 py-2 font-mono text-xs text-foreground">
            {url}
          </code>
          <Button variant="glass" size="sm" type="button" onClick={handleCopyUrl}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            Copy link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-[var(--radius-card)] border border-border bg-card/70 p-5"
    >
      <p className="text-heading text-sm font-semibold text-foreground">
        New partner pricing page
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="partner-name">Partner name</Label>
          <Input
            id="partner-name"
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            required
            maxLength={120}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="show-label">Show label</Label>
          <Input
            id="show-label"
            value={showLabel}
            onChange={(e) => setShowLabel(e.target.value)}
            required
            maxLength={160}
          />
        </div>
      </div>

      <div className="max-w-xs space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Select value={currency} onValueChange={(value) => setCurrency(value as DealCurrency)}>
          <SelectTrigger id="currency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="GBP">GBP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <section className="space-y-4 border-t border-border/50 pt-5">
        <p className="text-heading text-sm font-semibold text-foreground">Deal structure</p>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Split</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bright-blue-pct">Bright.Blue %</Label>
              <Input
                id="bright-blue-pct"
                type="number"
                min={0}
                max={100}
                value={brightBluePct}
                onChange={(e) => {
                  setBrightBluePct(e.target.value);
                  setSplitError(null);
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-pct">Partner %</Label>
              <Input
                id="partner-pct"
                type="number"
                min={0}
                max={100}
                value={partnerPct}
                onChange={(e) => {
                  setPartnerPct(e.target.value);
                  setSplitError(null);
                }}
                required
              />
            </div>
          </div>
          {splitError && <p className="text-xs text-destructive">{splitError}</p>}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Commitment</p>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="pilot-min-units">Pilot min units</Label>
              <Input
                id="pilot-min-units"
                type="number"
                min={1}
                value={pilotMinUnits}
                onChange={(e) => setPilotMinUnits(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pilot-max-units">Pilot max units</Label>
              <Input
                id="pilot-max-units"
                type="number"
                min={1}
                value={pilotMaxUnits}
                onChange={(e) => setPilotMaxUnits(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-units">Max units</Label>
              <Input
                id="max-units"
                type="number"
                min={1}
                value={maxUnits}
                onChange={(e) => setMaxUnits(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cutoff-weeks">Cutoff weeks</Label>
              <Input
                id="cutoff-weeks"
                type="number"
                min={1}
                value={cutoffWeeks}
                onChange={(e) => setCutoffWeeks(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">Levers</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLevers((rows) => [...rows, emptyLeverRow()])}
            >
              <Plus size={14} />
              Add lever
            </Button>
          </div>
          <div className="space-y-4">
            {levers.map((lever, index) => (
              <div
                key={index}
                className="space-y-3 rounded-[var(--radius-control)] border border-border/60 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-foreground">Lever {index + 1}</p>
                  {levers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setLevers((rows) => rows.filter((_, i) => i !== index))
                      }
                      aria-label={`Remove lever ${index + 1}`}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor={`lever-label-${index}`}>Lever label</Label>
                    <Input
                      id={`lever-label-${index}`}
                      value={lever.label}
                      onChange={(e) => updateLever(index, { label: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`lever-units-${index}`}>Units per item</Label>
                    <Input
                      id={`lever-units-${index}`}
                      type="number"
                      min={1}
                      value={lever.unitsPerItem}
                      onChange={(e) => updateLever(index, { unitsPerItem: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`lever-max-items-${index}`}>Max items</Label>
                    <Input
                      id={`lever-max-items-${index}`}
                      type="number"
                      min={1}
                      value={lever.maxItems}
                      onChange={(e) => updateLever(index, { maxItems: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`lever-retail-min-${index}`}>Retail min</Label>
                    <Input
                      id={`lever-retail-min-${index}`}
                      type="number"
                      min={1}
                      value={lever.retailMin}
                      onChange={(e) => updateLever(index, { retailMin: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`lever-retail-max-${index}`}>Retail max</Label>
                    <Input
                      id={`lever-retail-max-${index}`}
                      type="number"
                      min={1}
                      value={lever.retailMax}
                      onChange={(e) => updateLever(index, { retailMax: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`lever-retail-suggested-${index}`}>Retail suggested</Label>
                    <Input
                      id={`lever-retail-suggested-${index}`}
                      type="number"
                      min={1}
                      value={lever.retailSuggested}
                      onChange={(e) =>
                        updateLever(index, { retailSuggested: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`lever-retail-step-${index}`}>Retail step</Label>
                    <Input
                      id={`lever-retail-step-${index}`}
                      type="number"
                      min={1}
                      value={lever.retailStep}
                      onChange={(e) => updateLever(index, { retailStep: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">Floor tiers</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFloorTiers((rows) => [...rows, emptyFloorTierRow()])}
            >
              <Plus size={14} />
              Add tier
            </Button>
          </div>
          <div className="space-y-3">
            {floorTiers.map((tier, index) => (
              <div
                key={index}
                className="grid grid-cols-2 gap-3 rounded-[var(--radius-control)] border border-border/60 p-4 lg:grid-cols-5"
              >
                <div className="space-y-2">
                  <Label htmlFor={`tier-label-${index}`}>Tier label</Label>
                  <Input
                    id={`tier-label-${index}`}
                    value={tier.label}
                    onChange={(e) => updateFloorTier(index, { label: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`tier-min-${index}`}>Tier min units</Label>
                  <Input
                    id={`tier-min-${index}`}
                    type="number"
                    min={1}
                    value={tier.minUnits}
                    onChange={(e) => updateFloorTier(index, { minUnits: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`tier-max-${index}`}>Tier max units</Label>
                  <Input
                    id={`tier-max-${index}`}
                    type="number"
                    min={1}
                    value={tier.maxUnits}
                    onChange={(e) => updateFloorTier(index, { maxUnits: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`tier-floor-${index}`}>Floor</Label>
                  <Input
                    id={`tier-floor-${index}`}
                    type="number"
                    min={1}
                    value={tier.floor}
                    onChange={(e) => updateFloorTier(index, { floor: e.target.value })}
                    required
                  />
                </div>
                <div className="flex items-end">
                  {floorTiers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setFloorTiers((rows) => rows.filter((_, i) => i !== index))
                      }
                      aria-label={`Remove floor tier ${index + 1}`}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <Button variant="brand" size="sm" type="submit" disabled={pending}>
        {pending ? <Loader2 size={14} className="animate-spin" /> : null}
        Create page
      </Button>
    </form>
  );
}

// Exported for tests — builds the DealConfig the form submits.
export { buildConfig, deriveLeverKeys, DEFAULT_LEVER, DEFAULT_FLOOR_TIERS };
