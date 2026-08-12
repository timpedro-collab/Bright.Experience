/**
 * Public read model for a venue's advertise page and embeddable widget.
 *
 * The caller is an anonymous advertiser, so these reads use the service-role
 * client (RLS has no anon policy on venues — deliberately, because a blanket
 * anon SELECT would also expose venue contact details through the REST API).
 * Instead this module is the whole public surface: it selects only
 * marketing-safe columns, only `live` SKUs, and only `available` slots, and
 * never returns raw `pricing_model_json` (the venue's commercial terms).
 */
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { logQueryError } from "@/lib/observability/log-query-error";

export interface PublicPlacement {
  id: string;
  /** Ad format label if the venue's pricing config carries one. */
  format: string | null;
  unitName: string;
  locationNote: string | null;
  footfallEstimate: number | null;
}

export interface PublicOpenSlot {
  id: string;
  placementId: string;
  startDate: string;
  endDate: string;
  pricePence: number | null;
}

export interface PublicVenuePackage {
  id: string;
  name: string;
  description: string | null;
  pricePence: number | null;
  includesBrightBlue: boolean;
}

export interface PublicVenueMedia {
  venue: {
    id: string;
    name: string;
    slug: string;
    capacity: number | null;
    locationTier: string | null;
  };
  placements: PublicPlacement[];
  openSlots: PublicOpenSlot[];
  packages: PublicVenuePackage[];
}

function firstRelated<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/**
 * Everything the public advertise page and widget show for one venue, or
 * null when the slug doesn't resolve to an active venue.
 */
export async function getPublicVenueMedia(
  slug: string,
): Promise<PublicVenueMedia | null> {
  const supabase = getServiceRoleClient();

  const { data: venue, error: venueError } = await supabase
    .from("venues")
    .select("id, name, slug, capacity, location_tier, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (venueError) logQueryError("getPublicVenueMedia", venueError, { slug });
  if (!venue || venue.is_active === false) return null;

  // The machine_instances embed must name the FK: placements point at the
  // unit and machine_instances.current_placement_id points back, so a bare
  // embed is ambiguous to PostgREST (see lib/queries/placements.ts).
  const { data: placementRows, error: placementsError } = await supabase
    .from("placements")
    .select(
      `id, status, sku_status, location_label, notes, footfall_estimate, pricing_model_json,
       machine_instances!placements_machine_instance_id_fkey ( nickname )`,
    )
    .eq("venue_id", venue.id)
    .in("status", ["active", "planned"]);

  if (placementsError) {
    logQueryError("getPublicVenueMedia", placementsError, { slug });
  }

  // The venue approval step: only published SKUs reach the public surface.
  // Rows predating the register (no sku_status) read as live.
  const livePlacements = ((placementRows ?? []) as Record<string, unknown>[])
    .filter((p) => p.sku_status !== "draft")
    .map<PublicPlacement>((p) => {
      const pricing = p.pricing_model_json as { format?: string } | null;
      const machine = firstRelated(p.machine_instances) as {
        nickname?: string | null;
      } | null;
      return {
        id: String(p.id),
        format: pricing?.format ?? null,
        unitName: machine?.nickname ?? "Boulevard unit",
        locationNote:
          (p.location_label as string | null) ??
          (p.notes as string | null) ??
          null,
        footfallEstimate:
          p.footfall_estimate != null ? Number(p.footfall_estimate) : null,
      };
    });

  let openSlots: PublicOpenSlot[] = [];
  if (livePlacements.length > 0) {
    const { data: slotRows, error: slotsError } = await supabase
      .from("sponsorship_slots")
      .select("id, placement_id, start_date, end_date, price")
      .in(
        "placement_id",
        livePlacements.map((p) => p.id),
      )
      .eq("status", "available");

    if (slotsError) logQueryError("getPublicVenueMedia", slotsError, { slug });

    openSlots = ((slotRows ?? []) as Record<string, unknown>[]).map((s) => ({
      id: String(s.id),
      placementId: String(s.placement_id),
      startDate: String(s.start_date),
      endDate: String(s.end_date),
      pricePence: s.price != null ? Number(s.price) : null,
    }));
  }

  const { data: packageRows, error: packagesError } = await supabase
    .from("venue_packages")
    .select("id, name, description, price, includes_bright_blue")
    .eq("venue_id", venue.id)
    .order("sort_order", { ascending: true });

  if (packagesError) {
    logQueryError("getPublicVenueMedia", packagesError, { slug });
  }

  const packages = ((packageRows ?? []) as Record<string, unknown>[]).map(
    (pkg) => ({
      id: String(pkg.id),
      name: String(pkg.name),
      description: pkg.description ? String(pkg.description) : null,
      pricePence: pkg.price != null ? Number(pkg.price) : null,
      includesBrightBlue: Boolean(pkg.includes_bright_blue),
    }),
  );

  return {
    venue: {
      id: String(venue.id),
      name: String(venue.name),
      slug: String(venue.slug),
      capacity: venue.capacity != null ? Number(venue.capacity) : null,
      locationTier: (venue.location_tier as string | null) ?? null,
    },
    placements: livePlacements,
    openSlots,
    packages,
  };
}
