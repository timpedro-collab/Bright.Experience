"use server";

/**
 * Issue and revoke unlisted partner-pricing microsite links.
 *
 * Authorisation requires an internal commercial role (`canViewCommercial`).
 * Inserts and revocations use the service role because public reads bypass
 * RLS via slug credentials on the anonymous `/pp/:slug` surface.
 */
import { randomBytes } from "node:crypto";

import { getUser } from "@/lib/auth";
import { slugifyPartnerName } from "@/lib/partner-identity";
import { logQueryError } from "@/lib/observability/log-query-error";
import { canViewCommercial } from "@/lib/roles";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { createPartnerPricingPageSchema } from "@/lib/validations/partner-pricing";
import { uuidLike } from "@/lib/validations/id";
import type { ActionResult } from "@/types/actions";

const SLUG_PREFIX_MAX = 24;

/** Mint a URL-safe slug: partner prefix + 12 hex chars of entropy. */
function mintPartnerPricingSlug(partnerName: string): string {
  const prefix =
    slugifyPartnerName(partnerName)
      .slice(0, SLUG_PREFIX_MAX)
      .replace(/-$/, "") || "partner";
  return `${prefix}-${randomBytes(6).toString("hex")}`;
}

/** Resolve the caller and require a commercial internal role. */
async function requireCommercialUser(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  if (!canViewCommercial(user.role)) {
    return { ok: false, error: "Not authorized" };
  }
  return { ok: true, userId: user.id };
}

/**
 * Create a live partner-pricing page with a minted slug credential.
 *
 * @returns The new page id and public slug on success.
 */
export async function createPartnerPricingPage(
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const gate = await requireCommercialUser();
  if (!gate.ok) return { success: false, error: gate.error };

  const parsed = createPartnerPricingPageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const slug = mintPartnerPricingSlug(parsed.data.partnerName);
  const admin = getServiceRoleClient();
  const { data, error } = await admin
    .from("partner_pricing_pages")
    .insert({
      slug,
      partner_name: parsed.data.partnerName.trim(),
      show_label: parsed.data.showLabel.trim(),
      status: "live",
      template: "generic",
      config: parsed.data.config,
      created_by: gate.userId,
    })
    .select("id, slug")
    .single();

  if (error || !data) {
    logQueryError("createPartnerPricingPage", error, {
      partnerName: parsed.data.partnerName,
    });
    return { success: false, error: "Failed to create partner pricing page" };
  }

  return {
    success: true,
    data: { id: String(data.id), slug: String(data.slug) },
  };
}

/**
 * Revoke a partner-pricing page — the slug stops resolving live pages.
 *
 * @returns The revoked page id on success.
 */
export async function revokePartnerPricingPage(
  pageId: string,
): Promise<ActionResult<{ id: string }>> {
  const gate = await requireCommercialUser();
  if (!gate.ok) return { success: false, error: gate.error };

  const parsed = uuidLike("Invalid page ID").safeParse(pageId);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const admin = getServiceRoleClient();
  const { error } = await admin
    .from("partner_pricing_pages")
    .update({ status: "revoked" })
    .eq("id", parsed.data);

  if (error) {
    logQueryError("revokePartnerPricingPage", error, { pageId: parsed.data });
    return { success: false, error: "Failed to revoke partner pricing page" };
  }

  return { success: true, data: { id: parsed.data } };
}
