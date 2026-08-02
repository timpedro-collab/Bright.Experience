/** Fetches studio pricing tiers from the database */

import { createClient } from "@/lib/supabase/server";
import type { StudioTier } from "@/components/studio/StudioServiceCard";
import type { StudioServiceType } from "@/types";
import { logQueryError } from "@/lib/observability/log-query-error";

interface StudioPricingRow {
  id: string;
  service_type: string;
  tier_name: string;
  description: string | null;
  price_gbp: number;
  price_label: string;
  price_unit: string;
  features: string[];
  is_featured: boolean;
  sort_order: number;
}

function mapRowToTier(row: StudioPricingRow): StudioTier {
  return {
    id: row.id,
    serviceType: row.service_type as StudioServiceType,
    name: row.tier_name,
    subtitle: row.description ?? "",
    price: row.price_label,
    priceUnit: row.price_unit,
    features: row.features,
    featured: row.is_featured,
  };
}
/** Returns all pricing tiers grouped by service type */
export async function getAllStudioPricing(): Promise<{
  design: StudioTier[];
  animation: StudioTier[];
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("studio_pricing")
    .select("*")
    .order("sort_order");

  if (error || !data) {
    logQueryError("getAllStudioPricing", error);
    return { design: [], animation: [] };
  }

  const rows = data as unknown as StudioPricingRow[];
  return {
    design: rows.filter((r) => r.service_type === "design").map(mapRowToTier),
    animation: rows.filter((r) => r.service_type === "animation").map(mapRowToTier),
  };
}
