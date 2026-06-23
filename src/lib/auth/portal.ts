/**
 * Portal-scoped authorization guards for the partner-operated surfaces
 * (venue + reseller portals).
 *
 * Unlike {@link requireInternalUser}, these surfaces are run by partner
 * users who live *outside* the internal org. A venue operator must be able
 * to manage their own venue's placements and sponsorship slots, and a
 * reseller must be able to send a quote from their own portal — but neither
 * may touch a partner record that isn't theirs.
 *
 * Internal staff (admin / events_lead / ops / etc.) retain access for
 * oversight and break-glass, mirroring the read-side access already granted
 * by the portal pages.
 */
import { createClient } from "@/lib/supabase/server";
import { isInternalRole, isPartnerRole } from "@/lib/roles";
import type { UserRole } from "@/types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface PortalContext {
  supabase: SupabaseClient;
  userId: string;
  role: UserRole;
  isInternal: boolean;
}

async function resolveCaller(): Promise<PortalContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Forbidden");

  return {
    supabase,
    userId: profile.id,
    role: profile.role as UserRole,
    isInternal: isInternalRole(profile.role as UserRole),
  };
}

/** True when `profileId` belongs to the partner organisation `partnerId`. */
async function isMemberOfPartner(
  supabase: SupabaseClient,
  partnerId: string,
  profileId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("partner_users")
    .select("id")
    .eq("partner_id", partnerId)
    .eq("profile_id", profileId)
    .maybeSingle();
  return Boolean(data);
}

/**
 * Authorize management of a specific venue. Allows internal staff, or a
 * partner user who belongs to the partner that owns the venue. Throws
 * otherwise. Returns the resolved supabase client for the write that follows.
 */
export async function requireVenueManager(
  venueId: string,
): Promise<{ supabase: SupabaseClient }> {
  const ctx = await resolveCaller();
  if (ctx.isInternal) return { supabase: ctx.supabase };

  if (isPartnerRole(ctx.role)) {
    const { data: venue } = await ctx.supabase
      .from("venues")
      .select("partner_id")
      .eq("id", venueId)
      .maybeSingle();
    if (
      venue?.partner_id &&
      (await isMemberOfPartner(ctx.supabase, venue.partner_id, ctx.userId))
    ) {
      return { supabase: ctx.supabase };
    }
  }

  throw new Error("Forbidden: venue access only");
}

/**
 * Resolve the venue that owns a placement, then authorize. Used by the
 * placement-status and slot-creation actions, which only carry a placement
 * id.
 */
export async function requireVenueManagerForPlacement(
  placementId: string,
): Promise<{ supabase: SupabaseClient }> {
  const supabase = await createClient();
  const { data: placement } = await supabase
    .from("placements")
    .select("venue_id")
    .eq("id", placementId)
    .maybeSingle();
  if (!placement?.venue_id) throw new Error("Placement not found");
  return requireVenueManager(placement.venue_id);
}

/**
 * Resolve the venue that owns a slot (via its placement), then authorize.
 * Used by the reserve-slot action, which only carries a slot id.
 */
export async function requireVenueManagerForSlot(
  slotId: string,
): Promise<{ supabase: SupabaseClient }> {
  const supabase = await createClient();
  const { data: slot } = await supabase
    .from("sponsorship_slots")
    .select("placement_id")
    .eq("id", slotId)
    .maybeSingle();
  if (!slot?.placement_id) throw new Error("Slot not found");
  return requireVenueManagerForPlacement(slot.placement_id);
}

/**
 * Authorize a partner-portal write for the partner identified by `slug`.
 * Allows internal staff, or a partner user who belongs to that partner.
 * Returns the resolved partner id for the write that follows.
 */
export async function requirePartnerForSlug(
  slug: string,
): Promise<{ supabase: SupabaseClient; partnerId: string }> {
  const ctx = await resolveCaller();

  const { data: partner } = await ctx.supabase
    .from("partners")
    .select("id, status")
    .eq("slug", slug)
    .maybeSingle();
  if (!partner) throw new Error("Partner not found");

  if (ctx.isInternal) return { supabase: ctx.supabase, partnerId: partner.id };

  if (
    isPartnerRole(ctx.role) &&
    (await isMemberOfPartner(ctx.supabase, partner.id, ctx.userId))
  ) {
    return { supabase: ctx.supabase, partnerId: partner.id };
  }

  throw new Error("Forbidden: partner access only");
}
