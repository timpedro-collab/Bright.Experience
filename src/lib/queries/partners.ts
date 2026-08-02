/** Supabase read queries for partner entities. */
import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, paginateQuery, totalPages } from "@/lib/pagination";
import { logQueryError } from "@/lib/observability/log-query-error";

/** Fetch all partners, ordered by name (internal use). */
export async function getPartners() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partners")
    .select(
      `id, name, slug, type, contact_name, contact_email,
       logo_url, brand_color, partner_code,
       commission_model_json, status, onboarded_at,
       created_at, updated_at`
    )
    .order("name", { ascending: true });

  if (error || !data) {
    logQueryError("getPartners", error);
    return [];
  }
  return data;
}

/** Paginated partner list for admin views. */
export async function getPartnersPaginated(
  page: number = 1,
  pageSize: number = PAGE_SIZE
) {
  const supabase = await createClient();
  const query = supabase
    .from("partners")
    .select(
      `id, name, slug, type, contact_name, contact_email,
       logo_url, brand_color, partner_code,
       commission_model_json, status, onboarded_at,
       created_at, updated_at`,
      { count: "exact" }
    )
    .order("name", { ascending: true });

  const { data, error, count } = await paginateQuery(query, page, pageSize);
  if (error || !data) {
    logQueryError("getPartnersPaginated", error);
    return { data: [], totalCount: 0, totalPages: 1 };
  }

  const total = count ?? 0;
  return { data, totalCount: total, totalPages: totalPages(total, pageSize) };
}
/**
 * Look up a partner by its unique partner code.
 *
 * Returns the **public, co-brand-safe** projection — no contact details.
 * This is the only partner query that runs anon-side (e.g. on `/p/[code]`
 * or {@link PartnerAttributionBanner}), and the matching anon SELECT RLS
 * is scoped to exactly these columns + `status = 'active'`.
 */
export async function getPartnerByCode(code: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partners")
    .select(
      `id, name, slug, type, logo_url, brand_color, partner_code, status`
    )
    .eq("partner_code", code)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) {
    logQueryError("getPartnerByCode", error);
    return null;
  }
  return data;
}

interface PartnerForUser {
  id: string;
  name: string;
  slug: string;
  type: string;
  logo_url: string | null;
  brand_color: string | null;
  partner_code: string;
  status: string;
  partnerRole: string;
}

/** Get the partner organisation a user belongs to — returns flat partner record or null. */
export async function getPartnerForUser(profileId: string): Promise<PartnerForUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partner_users")
    .select(
      `partner_id, role,
       partners ( id, name, slug, type, logo_url, brand_color, partner_code, status )`
    )
    .eq("profile_id", profileId)
    .single();

  if (error || !data) {
    logQueryError("getPartnerForUser", error, { profileId });
    return null;
  }

  const p = data.partners as unknown as Record<string, unknown> | Record<string, unknown>[] | null;
  const partner = Array.isArray(p) ? p[0] : p;
  if (!partner) return null;

  return {
    id: String(partner.id),
    name: String(partner.name),
    slug: String(partner.slug),
    type: String(partner.type),
    logo_url: partner.logo_url ? String(partner.logo_url) : null,
    brand_color: partner.brand_color ? String(partner.brand_color) : null,
    partner_code: String(partner.partner_code),
    status: String(partner.status),
    partnerRole: String(data.role),
  };
}
