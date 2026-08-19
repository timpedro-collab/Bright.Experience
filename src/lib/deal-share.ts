/**
 * Shareable-mix encoding for partner pricing pages (`/pp/:slug`).
 *
 * A configured Deal Explorer mix can be captured in a compact query string
 * ("?mix=arrival.2_draw.5&r=arrival.65000") so a rep can send a colleague
 * the exact scenario they built. Encoding carries only lever counts, plus
 * retails that differ from the suggested band price; decoding validates
 * everything against the config so a mistyped or tampered link can never
 * express an out-of-band price or a negative count.
 */

import {
  clampRetail,
  type DealConfig,
  type DealConfigInputs,
} from "@/lib/deal-config";

/** Query param carrying lever counts ("arrival.2_draw.5", or "none"). */
export const MIX_PARAM = "mix";
/** Query param carrying off-suggested retails ("arrival.65000"). */
export const RETAIL_PARAM = "r";

/** Sentinel for a deliberately empty mix (all counts zero). */
const EMPTY_MIX = "none";

/** Pair separator within a param value; lever keys never contain it. */
const PAIR_JOIN = "_";
/** Key/value separator inside one pair; lever keys never contain it. */
const KV_SEP = ".";

/** Snap a retail value onto the band's step grid, clamped into the band. */
function snapRetail(
  value: number,
  band: { min: number; max: number; step: number },
): number {
  const clamped = clampRetail(value, band);
  const steps = Math.round((clamped - band.min) / band.step);
  return clampRetail(band.min + steps * band.step, band);
}

/**
 * Encode a mix as a query string (no leading "?"). Counts are encoded for
 * levers with items sold; retails only when they differ from the lever's
 * suggested price (and only on levers actually in the mix).
 */
export function encodeDealInputs(
  config: DealConfig,
  inputs: DealConfigInputs,
): string {
  const countPairs: string[] = [];
  const retailPairs: string[] = [];

  for (const lever of config.levers) {
    const input = inputs[lever.key];
    const count = Math.max(0, Math.floor(input?.count ?? 0));
    if (count === 0) continue;
    countPairs.push(`${lever.key}${KV_SEP}${count}`);

    const retail = input?.retail ?? lever.retail.suggested;
    if (retail !== lever.retail.suggested) {
      retailPairs.push(`${lever.key}${KV_SEP}${retail}`);
    }
  }

  const params = new URLSearchParams();
  params.set(MIX_PARAM, countPairs.length ? countPairs.join(PAIR_JOIN) : EMPTY_MIX);
  if (retailPairs.length) params.set(RETAIL_PARAM, retailPairs.join(PAIR_JOIN));
  return params.toString();
}

/** First string value of a possibly-arrayed query param. */
function firstValue(raw: string | string[] | undefined): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw;
}

/** Parse "key.value_key.value" into a map; malformed pairs are dropped. */
function parsePairs(raw: string): Map<string, number> {
  const out = new Map<string, number>();
  for (const pair of raw.split(PAIR_JOIN)) {
    const sep = pair.lastIndexOf(KV_SEP);
    if (sep <= 0) continue;
    const key = pair.slice(0, sep);
    const value = Number(pair.slice(sep + 1));
    if (!Number.isFinite(value)) continue;
    out.set(key, value);
  }
  return out;
}

/**
 * Decode a shared mix back into validated explorer inputs, or null when
 * the params carry no mix. Counts are floored, non-negative and capped at
 * each lever's `maxItems` (the explorer's fleet/slot ceilings still apply
 * downstream); retails are snapped into their band on the step grid.
 * Unknown lever keys are ignored; missing levers land at zero count and
 * suggested retail, so the result is always a complete inputs record.
 */
export function decodeDealInputs(
  config: DealConfig,
  searchParams: Record<string, string | string[] | undefined>,
): DealConfigInputs | null {
  const mixRaw = firstValue(searchParams[MIX_PARAM]);
  if (!mixRaw) return null;

  const counts = mixRaw === EMPTY_MIX ? new Map<string, number>() : parsePairs(mixRaw);
  const retailRaw = firstValue(searchParams[RETAIL_PARAM]);
  const retails = retailRaw ? parsePairs(retailRaw) : new Map<string, number>();

  const inputs: DealConfigInputs = {};
  for (const lever of config.levers) {
    const rawCount = Math.max(0, Math.floor(counts.get(lever.key) ?? 0));
    const count =
      lever.maxItems != null ? Math.min(rawCount, lever.maxItems) : rawCount;
    const rawRetail = retails.get(lever.key);
    const retail =
      rawRetail != null
        ? snapRetail(rawRetail, lever.retail)
        : lever.retail.suggested;
    inputs[lever.key] = { count, retail };
  }
  return inputs;
}
