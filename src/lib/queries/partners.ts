/** Supabase read queries for partner entities. */
import { createClient } from "@/lib/supabase/server";

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

  if (error || !data) return [];
  return data;
}

/** Fetch a single partner by slug with its users. */
export async function getPartnerBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partners")
    .select(
      `*, partner_users ( id, profile_id, role, created_at )`
    )
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data;
}

/** Look up a partner by its unique partner code. */
export async function getPartnerByCode(code: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partners")
    .select(
      `id, name, slug, type, contact_name, contact_email,
       partner_code, status`
    )
    .eq("partner_code", code)
    .single();

  if (error || !data) return null;
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

  if (error || !data) return null;

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
