/** Server actions for the partner and reseller portal. */
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Generate a partner code from a name.
 * Produces codes like "BB-SMITH" from "Smith Events Ltd".
 */
function generatePartnerCode(name: string): string {
  const slug = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `BB-${slug || "PARTNER"}${suffix}`;
}

/** Submit a partner application with status 'pending'. */
export async function applyAsPartner(data: {
  name: string;
  contactName: string;
  contactEmail: string;
  type: string;
  companyName?: string;
}) {
  const supabase = await createClient();

  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const partnerCode = generatePartnerCode(data.name);

  const { data: partner, error } = await supabase
    .from("partners")
    .insert({
      name: data.companyName || data.name,
      slug,
      type: data.type,
      contact_name: data.contactName,
      contact_email: data.contactEmail,
      partner_code: partnerCode,
      status: "pending",
    })
    .select("id, partner_code")
    .single();

  if (error) return { success: false as const, error: "Failed to submit application" };

  revalidatePath("/admin/partners");
  return { success: true as const, data: { id: partner.id, partnerCode: partner.partner_code } };
}

/** Approve a pending partner, setting status to 'active'. */
export async function approvePartner(partnerId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("partners")
    .update({
      status: "active",
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", partnerId);

  if (error) return { success: false as const, error: "Failed to approve partner" };

  revalidatePath("/admin/partners");
  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: true as const, data: { id: partnerId } };
}

/** Suspend an active partner. */
export async function suspendPartner(partnerId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("partners")
    .update({ status: "suspended" })
    .eq("id", partnerId);

  if (error) return { success: false as const, error: "Failed to suspend partner" };

  revalidatePath("/admin/partners");
  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: true as const, data: { id: partnerId } };
}

/** Add a user to a partner organisation. */
export async function addPartnerUser(
  partnerId: string,
  profileId: string,
  role: string = "member"
) {
  const supabase = await createClient();

  const { data: membership, error } = await supabase
    .from("partner_users")
    .insert({
      partner_id: partnerId,
      profile_id: profileId,
      role,
    })
    .select("id")
    .single();

  if (error) return { success: false as const, error: "Failed to add partner user" };

  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: true as const, data: { id: membership.id } };
}

/**
 * Record a partner attribution for a quote.
 *
 * Callers pass *either* a `partnerId` (UUID) or a `partnerCode` (the short
 * grep-able code stored in the cookie set on `/p/[code]`). Passing the code
 * is the common path from the public funnel; passing the id is the common
 * path from internal tooling.
 */
export async function recordAttribution(input: {
  partnerId?: string;
  partnerCode?: string;
  quoteId: string;
}) {
  if (!input.partnerId && !input.partnerCode) {
    return { success: false as const, error: "Need partnerId or partnerCode" };
  }

  const supabase = await createClient();

  let partnerId = input.partnerId ?? null;
  if (!partnerId && input.partnerCode) {
    const { data: partner } = await supabase
      .from("partners")
      .select("id, status")
      .eq("partner_code", input.partnerCode)
      .maybeSingle();
    if (!partner || partner.status !== "active") {
      return {
        success: false as const,
        error: "Partner not found or not active",
      };
    }
    partnerId = partner.id;
  }

  const { data: attribution, error } = await supabase
    .from("partner_attributions")
    .insert({
      partner_id: partnerId,
      quote_id: input.quoteId,
      commission_status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[recordAttribution] insert failed", error);
    return { success: false as const, error: "Failed to record attribution" };
  }

  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: true as const, data: { id: attribution.id } };
}

/** Approve a commission with a specific amount. */
export async function approveCommission(attributionId: string, amount: number) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("partner_attributions")
    .update({
      commission_amount: amount,
      commission_status: "approved",
    })
    .eq("id", attributionId);

  if (error) return { success: false as const, error: "Failed to approve commission" };

  revalidatePath("/admin/partners");
  return { success: true as const, data: { id: attributionId } };
}

/** Mark a commission as paid. */
export async function markCommissionPaid(attributionId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("partner_attributions")
    .update({
      commission_status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("id", attributionId);

  if (error) return { success: false as const, error: "Failed to mark commission paid" };

  revalidatePath("/admin/partners");
  return { success: true as const, data: { id: attributionId } };
}
