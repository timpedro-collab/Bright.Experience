/** Server actions for the partner and reseller portal. */
"use server";

import { requireInternalUser } from "@/lib/auth";
import { requirePartnerForSlug } from "@/lib/auth/portal";
import { isAdminRole } from "@/lib/roles";
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
  website?: string;
  industry?: string;
  companySize?: string;
  contactPhone?: string;
  contactRole?: string;
  referralSource?: string;
  notes?: string;
}) {
  const supabase = await createClient();

  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const partnerCode = generatePartnerCode(data.name);

  // The application detail captured by the wizard has no dedicated columns, so
  // keep it on the flexible jsonb (a new pending partner has no commission
  // model yet) under an `application` namespace for the reviewing admin.
  const application = Object.fromEntries(
    Object.entries({
      website: data.website,
      industry: data.industry,
      companySize: data.companySize,
      contactPhone: data.contactPhone,
      contactRole: data.contactRole,
      referralSource: data.referralSource,
      notes: data.notes,
    }).filter(([, v]) => v != null && v !== "")
  );

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
      commission_model_json:
        Object.keys(application).length > 0 ? { application } : {},
    })
    .select("id, partner_code")
    .single();

  if (error) return { success: false as const, error: "Failed to submit application" };

  revalidatePath("/admin/partners");
  return { success: true as const, data: { id: partner.id, partnerCode: partner.partner_code } };
}

/** Approve a pending partner, setting status to 'active'. */
export async function approvePartner(partnerId: string) {
  const { supabase, profile } = await requireInternalUser();
  if (!isAdminRole(profile.role)) {
    return { success: false as const, error: "Forbidden: admin access only" };
  }

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
  const { supabase, profile } = await requireInternalUser();
  if (!isAdminRole(profile.role)) {
    return { success: false as const, error: "Forbidden: admin access only" };
  }

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
  const { supabase, profile } = await requireInternalUser();
  if (!isAdminRole(profile.role)) {
    return { success: false as const, error: "Forbidden: admin access only" };
  }

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

/**
 * Reseller "send a quote" write-path.
 *
 * Lets a reseller raise a quote for a prospect directly from their portal.
 * The quote is created on the `proposal` track and immediately attributed
 * back to the partner so it appears in their pipeline and accrues
 * commission once closed — closing the reseller revenue loop without the
 * prospect having to come through the public referral link first.
 */
export async function createPartnerQuote(
  slug: string,
  data: {
    contactName: string;
    contactEmail: string;
    companyName?: string;
    eventType?: string;
    eventDateStart?: string;
    /** Whole dollars from the form; stored as integer cents on the quote. */
    estimatedValue?: number;
  },
) {
  if (!data.contactName.trim() || !data.contactEmail.trim()) {
    return { success: false as const, error: "Contact name and email are required" };
  }

  const { supabase, partnerId } = await requirePartnerForSlug(slug);

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      track: "proposal",
      status: "submitted",
      contact_name: data.contactName.trim(),
      contact_email: data.contactEmail.trim(),
      company_name: data.companyName?.trim() || null,
      event_type: data.eventType || null,
      event_date_start: data.eventDateStart || null,
      total_amount:
        data.estimatedValue != null ? Math.round(data.estimatedValue * 100) : null,
    })
    .select("id")
    .single();

  if (error || !quote) {
    return { success: false as const, error: "Failed to create quote" };
  }

  const { error: attrError } = await supabase
    .from("partner_attributions")
    .insert({
      partner_id: partnerId,
      quote_id: quote.id,
      commission_status: "pending",
    });

  if (attrError) {
    return { success: false as const, error: "Quote created but attribution failed" };
  }

  revalidatePath(`/partners/${slug}/quotes`);
  revalidatePath(`/partners/${slug}/clients`);
  revalidatePath(`/partners/${slug}/dashboard`);
  return { success: true as const, data: { id: quote.id } };
}

/** Approve a commission. `amountDollars` is the whole-dollar figure the admin types; stored as integer cents. */
export async function approveCommission(attributionId: string, amountDollars: number) {
  const { supabase, profile } = await requireInternalUser();
  if (!isAdminRole(profile.role)) {
    return { success: false as const, error: "Forbidden: admin access only" };
  }

  const { error } = await supabase
    .from("partner_attributions")
    .update({
      commission_amount: Math.round(amountDollars * 100),
      commission_status: "approved",
    })
    .eq("id", attributionId);

  if (error) return { success: false as const, error: "Failed to approve commission" };

  revalidatePath("/admin/partners");
  return { success: true as const, data: { id: attributionId } };
}

/** Mark a commission as paid. */
export async function markCommissionPaid(attributionId: string) {
  const { supabase, profile } = await requireInternalUser();
  if (!isAdminRole(profile.role)) {
    return { success: false as const, error: "Forbidden: admin access only" };
  }

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
