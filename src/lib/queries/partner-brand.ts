/**
 * Co-brand-safe partner lookups for anonymous public surfaces.
 *
 * The public report page is anonymous, so brand reads use the service-role
 * client (RLS has no anon policy on partners). This module is the whole
 * public surface: it selects only id, name, logo_url, brand_color, and only
 * for status = 'active' partners.
 */
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { logQueryError } from "@/lib/observability/log-query-error";

export interface PartnerBrand {
  id: string;
  name: string;
  logoUrl: string | null;
  brandColor: string | null;
}

/** Fetch co-brand-safe partner branding for an active partner. */
export async function getPartnerBrandById(
  partnerId: string,
): Promise<PartnerBrand | null> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("partners")
    .select("id, name, logo_url, brand_color")
    .eq("id", partnerId)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) {
    logQueryError("getPartnerBrandById", error, { partnerId });
    return null;
  }

  return {
    id: String(data.id),
    name: String(data.name),
    logoUrl: data.logo_url ? String(data.logo_url) : null,
    brandColor: data.brand_color ? String(data.brand_color) : null,
  };
}

/**
 * Resolve the default brand partner for an event at publish time —
 * organizer partner first, then the most recent attribution row.
 */
export async function getDefaultBrandPartnerForEvent(
  eventId: string,
): Promise<string | null> {
  const supabase = await createClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("organizer_partner_id")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) {
    logQueryError("getDefaultBrandPartnerForEvent", eventError, { eventId });
    return null;
  }

  if (event?.organizer_partner_id) {
    return String(event.organizer_partner_id);
  }

  const { data: attribution, error: attrError } = await supabase
    .from("partner_attributions")
    .select("partner_id")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (attrError) {
    logQueryError("getDefaultBrandPartnerForEvent", attrError, { eventId });
    return null;
  }

  return attribution?.partner_id ? String(attribution.partner_id) : null;
}
