import { formatMoneyFromPence } from "@/lib/currency";

/**
 * Typed venue revenue models over `placements.pricing_model_json`.
 *
 * Venues already think in three shapes (docs/19 §venues: the 15–40% mental
 * model): a straight share of booked revenue, a flat fee for the position,
 * or a minimum guarantee against a share — whichever pays more. The JSON
 * column stays schemaless in the database; this module is the single place
 * that parses it (tolerating the legacy ad-hoc shapes) and computes the
 * venue's share of booked slot revenue.
 */

export type RevenueModel =
  | { model: "revenue_share"; rate: number }
  | { model: "fixed_fee"; feePence: number }
  | { model: "guarantee_overage"; guaranteePence: number; overageRate: number };

export const REVENUE_MODEL_LABELS: Record<RevenueModel["model"], string> = {
  revenue_share: "Share of booked revenue",
  fixed_fee: "Flat fee",
  guarantee_overage: "Guarantee vs share",
};

function asNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse whatever sits in `pricing_model_json` into a typed model, or null
 * when the placement has no usable pricing configured.
 *
 * Legacy tolerance: early rows carried `fee_usd` / `floor_usd` in whole
 * currency units (converted to pence here, ×100) and a `media_rate` shape
 * that never encoded venue economics — those read as unconfigured.
 */
export function parseRevenueModel(json: unknown): RevenueModel | null {
  if (!json || typeof json !== "object") return null;
  const record = json as Record<string, unknown>;

  switch (record.model) {
    case "revenue_share": {
      const rate = asNumber(record.rate);
      if (rate === null || rate <= 0 || rate > 1) return null;
      // Legacy rows sometimes pair a share with a floor — that is a
      // guarantee-vs-share in today's vocabulary.
      const floor = asNumber(record.floor_usd ?? record.floorPence);
      if (floor !== null && floor > 0) {
        const guaranteePence =
          record.floorPence != null ? floor : Math.round(floor * 100);
        return { model: "guarantee_overage", guaranteePence, overageRate: rate };
      }
      return { model: "revenue_share", rate };
    }
    case "fixed_fee": {
      const pence = asNumber(record.feePence);
      if (pence !== null && pence >= 0) {
        return { model: "fixed_fee", feePence: Math.round(pence) };
      }
      const legacy = asNumber(record.fee_usd);
      if (legacy !== null && legacy >= 0) {
        return { model: "fixed_fee", feePence: Math.round(legacy * 100) };
      }
      return null;
    }
    case "guarantee_overage": {
      const guaranteePence = asNumber(record.guaranteePence);
      const overageRate = asNumber(record.overageRate);
      if (
        guaranteePence === null ||
        guaranteePence < 0 ||
        overageRate === null ||
        overageRate <= 0 ||
        overageRate > 1
      ) {
        return null;
      }
      return {
        model: "guarantee_overage",
        guaranteePence: Math.round(guaranteePence),
        overageRate,
      };
    }
    default:
      return null;
  }
}

/**
 * The venue's share of `bookedPence` (booked slot revenue on the placement)
 * under a model, in pence.
 *
 * guarantee_overage pays the guarantee or the share, whichever is greater —
 * the venue can never earn below the floor they negotiated.
 */
export function venueShareForBooked(
  bookedPence: number,
  model: RevenueModel,
): number {
  const booked = Math.max(0, bookedPence);
  switch (model.model) {
    case "revenue_share":
      return Math.round(booked * model.rate);
    case "fixed_fee":
      return model.feePence;
    case "guarantee_overage":
      return Math.max(
        model.guaranteePence,
        Math.round(booked * model.overageRate),
      );
  }
}

/** Human line for a model, e.g. "18% of booked revenue". */
export function formatRevenueModel(model: RevenueModel): string {
  switch (model.model) {
    case "revenue_share":
      return `${Math.round(model.rate * 100)}% of booked revenue`;
    case "fixed_fee":
      return `${formatMoneyFromPence(model.feePence)} flat`;
    case "guarantee_overage":
      return `${formatMoneyFromPence(model.guaranteePence)} guaranteed or ${Math.round(
        model.overageRate * 100,
      )}%, whichever is greater`;
  }
}
