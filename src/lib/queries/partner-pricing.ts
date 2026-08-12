/** Supabase read queries for partner-pricing microsite pages. */

import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { DealConfig } from "@/lib/deal-config";
import { logQueryError } from "@/lib/observability/log-query-error";

const SLUG_RE = /^[a-z0-9-]{8,80}$/;

export type PartnerPricingPageStatus = "draft" | "live" | "revoked";
export type PartnerPricingPageTemplate = "generic" | "nrs";

/** Row shape for `partner_pricing_pages`. */
export interface PartnerPricingPage {
  id: string;
  slug: string;
  partnerName: string;
  showLabel: string;
  status: PartnerPricingPageStatus;
  template: PartnerPricingPageTemplate;
  config: DealConfig;
  hero: Record<string, unknown> | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

const PUBLIC_COLUMNS =
  "id, slug, partner_name, show_label, template, config, hero";

function toPartnerPricingPage(row: Record<string, unknown>): PartnerPricingPage {
  return {
    id: String(row.id),
    slug: String(row.slug),
    partnerName: String(row.partner_name),
    showLabel: String(row.show_label),
    status: String(row.status) as PartnerPricingPageStatus,
    template: String(row.template) as PartnerPricingPageTemplate,
    config: row.config as DealConfig,
    hero: (row.hero as Record<string, unknown> | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

/**
 * Resolve a live partner-pricing page by its public slug credential.
 *
 * The reader is anonymous — they hold only the unlisted slug from the
 * share link. Reads through the service-role client: the unguessable slug
 * is the credential, validated here rather than opening the table to the
 * whole internet.
 */
export async function getPartnerPricingPageBySlug(
  slug: string,
): Promise<
  Pick<
    PartnerPricingPage,
    "id" | "slug" | "partnerName" | "showLabel" | "template" | "config" | "hero"
  > | null
> {
  if (!SLUG_RE.test(slug)) return null;

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("partner_pricing_pages")
    .select(PUBLIC_COLUMNS)
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();

  if (error || !data) {
    if (error) logQueryError("getPartnerPricingPageBySlug", error, { slug });
    return null;
  }

  const page = toPartnerPricingPage(data as Record<string, unknown>);
  return {
    id: page.id,
    slug: page.slug,
    partnerName: page.partnerName,
    showLabel: page.showLabel,
    template: page.template,
    config: page.config,
    hero: page.hero,
  };
}

/** Every partner-pricing page for the internal admin list, newest first. */
export async function getPartnerPricingPagesForAdmin(): Promise<
  PartnerPricingPage[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partner_pricing_pages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    logQueryError("getPartnerPricingPagesForAdmin", error, {});
    return [];
  }

  return (data ?? []).map((row) =>
    toPartnerPricingPage(row as Record<string, unknown>),
  );
}
