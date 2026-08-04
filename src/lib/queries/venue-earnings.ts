/** Read queries for venue placement earnings and revenue share. */
import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";
import {
  parseRevenueModel,
  venueShareForBooked,
  formatRevenueModel,
  type RevenueModel,
} from "@/lib/venues/revenue-model";

export interface VenuePlacementEarnings {
  placementId: string;
  label: string;
  model: RevenueModel | null;
  modelLabel: string | null;
  bookedPence: number;
  bookedCount: number;
  openPence: number;
  openCount: number;
  sharePence: number | null;
}

export interface VenueEarnings {
  placements: VenuePlacementEarnings[];
  bookedPence: number;
  sharePence: number;
  openPence: number;
  unconfiguredCount: number;
}

const EMPTY: VenueEarnings = {
  placements: [],
  bookedPence: 0,
  sharePence: 0,
  openPence: 0,
  unconfiguredCount: 0,
};

const BOOKED_STATUSES = new Set(["reserved", "active", "completed"]);

function buildPlacementLabel(row: Record<string, unknown>): string {
  const base =
    (row.location_label ? String(row.location_label) : null) ??
    (row.notes ? String(row.notes) : null) ??
    "Placement";
  const sku = row.sku_code ? String(row.sku_code) : null;
  return sku ? `${sku} · ${base}` : base;
}

/**
 * Booked and open slot revenue per placement, with venue share computed
 * from each placement's `pricing_model_json`.
 */
export async function getEarningsByVenue(
  venueId: string,
): Promise<VenueEarnings> {
  const supabase = await createClient();
  const { data: placements, error: placementsError } = await supabase
    .from("placements")
    .select("id, pricing_model_json, notes, sku_code, location_label")
    .eq("venue_id", venueId);

  if (placementsError || !placements) {
    logQueryError("getEarningsByVenue", placementsError, { venueId });
    return EMPTY;
  }

  const placementRows = (placements ?? []) as Record<string, unknown>[];
  if (placementRows.length === 0) return EMPTY;

  const placementIds = placementRows.map((p) => String(p.id));

  const { data: slots, error: slotsError } = await supabase
    .from("sponsorship_slots")
    .select("id, placement_id, price, status")
    .in("placement_id", placementIds);

  if (slotsError || !slots) {
    logQueryError("getEarningsByVenue", slotsError, { venueId });
    return EMPTY;
  }

  const slotsByPlacement = new Map<string, Record<string, unknown>[]>();
  for (const slot of (slots ?? []) as Record<string, unknown>[]) {
    const pid = String(slot.placement_id);
    const list = slotsByPlacement.get(pid) ?? [];
    list.push(slot);
    slotsByPlacement.set(pid, list);
  }

  let bookedPence = 0;
  let sharePence = 0;
  let openPence = 0;
  let unconfiguredCount = 0;

  const placementEarnings: VenuePlacementEarnings[] = placementRows.map(
    (row) => {
      const placementId = String(row.id);
      const model = parseRevenueModel(row.pricing_model_json);
      const modelLabel = model ? formatRevenueModel(model) : null;

      const placementSlots = slotsByPlacement.get(placementId) ?? [];
      let placementBookedPence = 0;
      let bookedCount = 0;
      let placementOpenPence = 0;
      let openCount = 0;

      for (const slot of placementSlots) {
        const price = slot.price != null ? Number(slot.price) : 0;
        const status = String(slot.status ?? "");

        if (BOOKED_STATUSES.has(status)) {
          placementBookedPence += price;
          bookedCount += 1;
        } else if (status === "available") {
          placementOpenPence += price;
          openCount += 1;
        }
      }

      const placementSharePence = model
        ? venueShareForBooked(placementBookedPence, model)
        : null;

      bookedPence += placementBookedPence;
      openPence += placementOpenPence;
      if (placementSharePence !== null) {
        sharePence += placementSharePence;
      }
      if (model === null) {
        unconfiguredCount += 1;
      }

      return {
        placementId,
        label: buildPlacementLabel(row),
        model,
        modelLabel,
        bookedPence: placementBookedPence,
        bookedCount,
        openPence: placementOpenPence,
        openCount,
        sharePence: placementSharePence,
      };
    },
  );

  return {
    placements: placementEarnings,
    bookedPence,
    sharePence,
    openPence,
    unconfiguredCount,
  };
}
