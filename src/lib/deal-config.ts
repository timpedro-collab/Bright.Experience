/**
 * Generic, data-driven deal maths for partner pricing microsites (`/pp/:slug`).
 *
 * A `DealConfig` describes one partner deal: its inventory levers (what can
 * be sold, in what bands), the revenue split, the commitment terms and the
 * volume floor ladder. The engine below turns a config plus the buyer's
 * chosen mix into the economics shown on the page.
 *
 * IMPORTANT: configs ship to the client on pages shared with external
 * negotiating counterparties. A config may only carry deck-visible numbers
 * (retail anchors, the split, floors, commitment terms). Internal economics
 * (unit costs, margins, wholesale reserves, concession ladders) must NEVER
 * enter a config.
 *
 * Everything here is JSON-serializable so configs can live in the
 * `partner_pricing_pages.config` jsonb column.
 */

/** Currencies a deal page can present. Formatting only — no FX math. */
export type DealCurrency = "USD" | "GBP";

/** Suggested retail band for one lever — sliders never go below `min`. */
export interface RetailBand {
  min: number;
  max: number;
  suggested: number;
  step: number;
}

/**
 * One sellable inventory line, e.g. "single placements" or a 3-unit
 * takeover bundle. `unitsPerItem` is how many machines one sold item
 * deploys; `maxItems` is a physical cap on items sold (not units).
 */
export interface DealLever {
  /** Stable identifier, e.g. "single" — keys the inputs record. */
  key: string;
  /** Buyer-facing name, e.g. "Single-unit placements". */
  label: string;
  /** Machines deployed per item sold (a 3-unit bundle deploys 3). */
  unitsPerItem: number;
  /** Physical cap on items sold, if one exists (e.g. 4 corridor units). */
  maxItems?: number;
  /** Optional buyer-facing footnote rendered under the lever's sliders. */
  note?: string;
  /**
   * How this lever's money flows. "sponsorship" (the default) is revenue
   * the partner sells and the split applies to. "service" is a flat fee
   * the partner pays Bright.Blue directly (e.g. an organizer rebooking
   * engine): it never enters gross sponsorship revenue or the split, and
   * is reported separately so the partner sees their true net position.
   */
  revenue?: "sponsorship" | "service";
  /**
   * For screen-inventory levers (ad slots): slots only exist on the
   * machines the organizer controls, so sellable items are capped at
   * `slotsPerUnit` x the units currently deployed by `sourceLevers`.
   * A machine sold outright to one sponsor carries that sponsor's brand
   * alone and never appears in `sourceLevers`.
   */
  slotSource?: { slotsPerUnit: number; sourceLevers: string[] };
  retail: RetailBand;
}

/**
 * Sellable-item cap for a slot-inventory lever, given the machine units
 * deployed per source lever. Levers without `slotSource` have no
 * derived cap (returns Infinity; `maxItems` still applies separately).
 */
export function slotCapForLever(
  lever: DealLever,
  unitsByLever: Record<string, number>,
): number {
  if (!lever.slotSource) return Infinity;
  const sourceUnits = lever.slotSource.sourceLevers.reduce(
    (sum, key) => sum + (unitsByLever[key] ?? 0),
    0,
  );
  return lever.slotSource.slotsPerUnit * sourceUnits;
}

/** One rung of the volume floor ladder. */
export interface DealFloorTier {
  label: string;
  minUnits: number;
  maxUnits: number;
  floor: number;
}

/**
 * A named starting mix ("Pilot", "Scale"...) the explorer offers as a
 * one-click scenario. Counts are items per lever key; missing keys are zero.
 */
export interface DealPreset {
  key: string;
  label: string;
  /** One-line description of the scenario, shown on the preset control. */
  description?: string;
  counts: Record<string, number>;
}

/** The full description of one partner deal. */
export interface DealConfig {
  currency: DealCurrency;
  /** Fractions summing to 1, e.g. { brightBlue: 0.7, partner: 0.3 }. */
  split: { brightBlue: number; partner: number };
  commitment: {
    pilotMinUnits: number;
    pilotMaxUnits: number;
    /** Fleet ceiling shared across all levers. */
    maxUnits: number;
    /** Weeks before the show by which scale volumes must be committed. */
    cutoffWeeks: number;
  };
  levers: DealLever[];
  floorTiers: DealFloorTier[];
  /** Optional one-click scenarios; the first is the explorer's opening mix. */
  presets?: DealPreset[];
}

/** The buyer's chosen position on one lever. */
export interface LeverInput {
  /** Items sold (bundles count as one item). */
  count: number;
  /** Retail per item, in the config's currency. */
  retail: number;
}

/** Inputs keyed by lever key; missing levers are treated as zero. */
export type DealConfigInputs = Record<string, LeverInput>;

export interface DealConfigSummary {
  /** Machines on the floor across all levers. */
  totalUnits: number;
  /** Partner's gross sponsorship revenue (split-eligible levers only). */
  gross: number;
  /** Partner's retained share of gross. */
  partnerKeeps: number;
  /** Bright.Blue's share of gross. */
  brightBlueShare: number;
  /** Flat service fees the partner pays Bright.Blue directly (not split). */
  serviceFees: number;
  /** Partner's true position: retained share minus service fees paid. */
  netToPartner: number;
  /** Average retained revenue per deployed unit (0-safe). */
  partnerKeepsPerUnit: number;
  /** Floor tier the volume lands in (drives the ladder display). */
  tier: DealFloorTier;
  /** True when volume is non-zero but below the take-or-pay minimum. */
  belowPilotMinimum: boolean;
  /**
   * How far the mix's delivery revenue (Bright.Blue's split share plus
   * service fees) falls short of the tier floor across all deployed units.
   * Zero when the floor is covered; positive means the mix as built
   * wouldn't fund delivery and needs sellable inventory added.
   */
  floorGap: number;
}

/** Clamp a retail value into its allowed band — floors are non-negotiable. */
export function clampRetail(
  value: number,
  bounds: { min: number; max: number },
): number {
  return Math.min(bounds.max, Math.max(bounds.min, value));
}

/** The floor tier a given deployed-unit count lands in. */
export function floorTierForVolume(
  config: DealConfig,
  totalUnits: number,
): DealFloorTier {
  const clamped = Math.max(
    1,
    Math.min(totalUnits, config.commitment.maxUnits),
  );
  return (
    config.floorTiers.find(
      (t) => clamped >= t.minUnits && clamped <= t.maxUnits,
    ) ?? config.floorTiers[config.floorTiers.length - 1]
  );
}

/**
 * Compute the partner-facing economics for a buyer's chosen mix.
 * Counts are floored and clamped to each lever's physical cap; retail is
 * clamped into its band, so the result can never express a price below
 * the negotiated floors.
 */
export function computeConfigDeal(
  config: DealConfig,
  inputs: DealConfigInputs,
): DealConfigSummary {
  let totalUnits = 0;
  let gross = 0;
  let serviceFees = 0;

  const addRevenue = (lever: DealLever, count: number, retail: number) => {
    if (lever.revenue === "service") serviceFees += count * retail;
    else gross += count * retail;
  };

  // Machine levers resolve first so slot-inventory levers can cap
  // against the units they put on the floor.
  const unitsByLever: Record<string, number> = {};
  const machineLevers = config.levers.filter((l) => !l.slotSource);
  const slotLevers = config.levers.filter((l) => l.slotSource);

  for (const lever of machineLevers) {
    const input = inputs[lever.key];
    if (!input) continue;
    const rawCount = Math.max(0, Math.floor(input.count));
    const count =
      lever.maxItems != null ? Math.min(rawCount, lever.maxItems) : rawCount;
    const retail = clampRetail(input.retail, lever.retail);
    unitsByLever[lever.key] = count * lever.unitsPerItem;
    totalUnits += count * lever.unitsPerItem;
    addRevenue(lever, count, retail);
  }

  for (const lever of slotLevers) {
    const input = inputs[lever.key];
    if (!input) continue;
    const rawCount = Math.max(0, Math.floor(input.count));
    const cap = Math.min(
      lever.maxItems ?? Infinity,
      slotCapForLever(lever, unitsByLever),
    );
    const count = Math.min(rawCount, cap);
    const retail = clampRetail(input.retail, lever.retail);
    totalUnits += count * lever.unitsPerItem;
    addRevenue(lever, count, retail);
  }

  const partnerKeeps = Math.round(gross * config.split.partner);
  const brightBlueShare = gross - partnerKeeps;
  const tier = floorTierForVolume(config, totalUnits);

  // The floor is a delivery promise: Bright.Blue's revenue on the mix
  // (split share plus direct service fees) must cover the tier floor for
  // every machine on the floor. A positive gap means the mix as built
  // wouldn't fund its own delivery.
  const deliveryRevenue = brightBlueShare + serviceFees;
  const floorGap =
    totalUnits > 0
      ? Math.max(0, tier.floor * totalUnits - deliveryRevenue)
      : 0;

  return {
    totalUnits,
    gross,
    partnerKeeps,
    brightBlueShare,
    serviceFees,
    netToPartner: partnerKeeps - serviceFees,
    partnerKeepsPerUnit:
      totalUnits > 0 ? Math.round(partnerKeeps / totalUnits) : 0,
    tier,
    belowPilotMinimum:
      totalUnits > 0 && totalUnits < config.commitment.pilotMinUnits,
    floorGap,
  };
}

const CURRENCY_LOCALE: Record<DealCurrency, string> = {
  USD: "en-US",
  GBP: "en-GB",
};

const CURRENCY_SYMBOL: Record<DealCurrency, string> = {
  USD: "$",
  GBP: "£",
};

/** "$45,000" / "£45,000" — whole-unit currency for pricing surfaces. */
export function formatDealCurrency(
  currency: DealCurrency,
  value: number,
): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * "$450k" / "£19.6k" / "$1.2m" — compact currency for stat headlines.
 * Sub-100k values keep one decimal so derived figures stay consistent
 * with their totals (e.g. $392k across 20 machines is $19.6k, not $20k).
 */
export function formatDealCurrencyCompact(
  currency: DealCurrency,
  value: number,
): string {
  const symbol = CURRENCY_SYMBOL[currency];
  if (Math.abs(value) >= 1_000_000) {
    const m = value / 1_000_000;
    return `${symbol}${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}m`;
  }
  if (Math.abs(value) >= 1_000) {
    const k =
      Math.abs(value) < 100_000
        ? Math.round(value / 100) / 10
        : Math.round(value / 1_000);
    return `${symbol}${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return formatDealCurrency(currency, value);
}
