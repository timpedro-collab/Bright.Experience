"use server";

/**
 * Server actions for deal registration — the channel-protection ledger.
 *
 * An organizer registers a sponsor conversation before quoting it; we review
 * within a 24-hour SLA; approval grants a 14-day exclusivity window on that
 * sponsor across every channel (docs/20 §4). `pushLeadToOrganizer` is the
 * reverse flow: an inbound brand lead that belongs at an organizer's show is
 * pre-registered to them so the channel wins instead of competing.
 *
 * Authorization model:
 *   - `registerDeal` runs as the partner user (RLS enforces the insert is
 *     for their own partner). The cross-partner exclusivity check needs the
 *     service-role client because RLS deliberately hides other partners'
 *     registrations — the check is read-only and leaks only a boolean.
 *   - approve / reject / push are internal-only (commercial roles).
 */

import { revalidatePath } from "next/cache";

import { requireInternalUser } from "@/lib/auth";
import { requirePartnerForSlug } from "@/lib/auth/portal";
import { canViewCommercial } from "@/lib/roles";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { logQueryError } from "@/lib/observability/log-query-error";
import {
  normaliseCompany,
  isExclusivityActive,
  exclusivityExpiry,
  type DealRegistrationStatus,
} from "@/lib/deal-registrations";
import {
  registerDealSchema,
  reviewDealSchema,
  pushLeadSchema,
  type RegisterDealInput,
} from "@/lib/validations/deal-registrations";
import type { ActionResult } from "@/types/actions";

/**
 * True when another partner already holds a live claim on this sponsor —
 * a pending registration or an approved one inside its window.
 */
async function hasCompetingClaim(
  sponsorCompany: string,
  ownPartnerId: string,
): Promise<boolean> {
  const service = getServiceRoleClient();
  const target = normaliseCompany(sponsorCompany);

  const { data: candidates } = await service
    .from("deal_registrations")
    .select("partner_id, sponsor_company, status, exclusivity_expires_at")
    .in("status", ["pending", "approved"]);

  return (candidates ?? []).some((row: Record<string, unknown>) => {
    if (row.partner_id === ownPartnerId) return false;
    if (normaliseCompany(String(row.sponsor_company)) !== target) return false;
    const status = row.status as DealRegistrationStatus;
    if (status === "pending") return true;
    return isExclusivityActive(
      status,
      row.exclusivity_expires_at as string | null,
    );
  });
}

/**
 * Register a sponsor conversation for review.
 *
 * @returns the registration id, or the existing one when this partner
 * already has a live claim on the same company.
 */
export async function registerDeal(
  input: RegisterDealInput,
): Promise<ActionResult<{ id: string; alreadyRegistered?: boolean }>> {
  const parsed = registerDealSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const data = parsed.data;

  const { supabase, partnerId } = await requirePartnerForSlug(data.partnerSlug);

  // Same partner re-registering the same company: hand back the live claim
  // instead of stacking duplicates.
  const { data: own } = await supabase
    .from("deal_registrations")
    .select("id, sponsor_company, status, exclusivity_expires_at")
    .eq("partner_id", partnerId)
    .in("status", ["pending", "approved"]);
  const target = normaliseCompany(data.sponsorCompany);
  const existing = (own ?? []).find((row) => {
    if (normaliseCompany(String(row.sponsor_company)) !== target) return false;
    const status = row.status as DealRegistrationStatus;
    return (
      status === "pending" ||
      isExclusivityActive(status, row.exclusivity_expires_at as string | null)
    );
  });
  if (existing) {
    return {
      success: true,
      data: { id: String(existing.id), alreadyRegistered: true },
    };
  }

  if (await hasCompetingClaim(data.sponsorCompany, partnerId)) {
    return {
      success: false,
      error:
        "That sponsor is already registered to another channel right now. We can look again once the window lapses — talk to your Bright.Blue contact.",
    };
  }

  const { data: registration, error } = await supabase
    .from("deal_registrations")
    .insert({
      partner_id: partnerId,
      event_id: data.eventId ?? null,
      sponsor_company: data.sponsorCompany.trim(),
      sponsor_contact_name: data.sponsorContactName?.trim() || null,
      sponsor_contact_email: data.sponsorContactEmail?.trim() || null,
      estimated_value:
        data.estimatedValue != null ? Math.round(data.estimatedValue * 100) : null,
      notes: data.notes?.trim() || null,
      status: "pending",
      source: "organizer",
    })
    .select("id")
    .single();

  if (error || !registration) {
    logQueryError("registerDeal", error, { partnerId });
    return { success: false, error: "Failed to register the deal" };
  }

  const { data: partner } = await supabase
    .from("partners")
    .select("name")
    .eq("id", partnerId)
    .maybeSingle();

  await dispatchNotification("deal.registered", {
    dealRegistrationId: String(registration.id),
    sponsorCompany: data.sponsorCompany.trim(),
    partnerName: partner?.name ?? "A partner",
    entityType: "deal_registration",
    entityId: String(registration.id),
  });

  revalidatePath(`/organizers/${data.partnerSlug}/deals`);
  revalidatePath("/admin/deals");
  return { success: true, data: { id: String(registration.id) } };
}

/** Guard shared by the internal review actions. */
async function requireCommercialInternal() {
  const { supabase, profile } = await requireInternalUser();
  if (!canViewCommercial(profile.role)) {
    throw new Error("Forbidden: commercial access only");
  }
  return { supabase, profile };
}

/** Fetch the bits the review notifications need for their templates. */
async function registrationForNotify(registrationId: string) {
  const service = getServiceRoleClient();
  const { data } = await service
    .from("deal_registrations")
    .select("sponsor_company, partners:partner_id ( slug )")
    .eq("id", registrationId)
    .maybeSingle();
  const partner = Array.isArray(data?.partners) ? data?.partners[0] : data?.partners;
  return {
    sponsorCompany: (data?.sponsor_company as string) ?? "the sponsor",
    organizerSlug: (partner as { slug?: string } | null)?.slug ?? "",
  };
}

/** Approve a pending registration — starts the 14-day exclusivity window. */
export async function approveDealRegistration(
  registrationId: string,
): Promise<ActionResult<{ id: string }>> {
  const parsed = reviewDealSchema.safeParse({ registrationId });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { supabase } = await requireCommercialInternal();

  const { data: updated, error } = await supabase
    .from("deal_registrations")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      exclusivity_expires_at: exclusivityExpiry(),
    })
    .eq("id", registrationId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    logQueryError("approveDealRegistration", error, { registrationId });
    return { success: false, error: "Failed to approve the registration" };
  }
  if (!updated) {
    return { success: false, error: "Only a pending registration can be approved" };
  }

  const notify = await registrationForNotify(registrationId);
  await dispatchNotification("deal.approved", {
    dealRegistrationId: registrationId,
    sponsorCompany: notify.sponsorCompany,
    organizerSlug: notify.organizerSlug,
    entityType: "deal_registration",
    entityId: registrationId,
  });

  revalidatePath("/admin/deals");
  revalidatePath("/organizers");
  return { success: true, data: { id: registrationId } };
}

/** Reject a pending registration, with a reason the organizer will read. */
export async function rejectDealRegistration(
  registrationId: string,
  reason: string,
): Promise<ActionResult<{ id: string }>> {
  const parsed = reviewDealSchema.safeParse({ registrationId, reason });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { supabase } = await requireCommercialInternal();

  const { data: updated, error } = await supabase
    .from("deal_registrations")
    .update({
      status: "rejected",
      rejected_reason: reason.trim() || "No reason given",
    })
    .eq("id", registrationId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    logQueryError("rejectDealRegistration", error, { registrationId });
    return { success: false, error: "Failed to reject the registration" };
  }
  if (!updated) {
    return { success: false, error: "Only a pending registration can be rejected" };
  }

  const notify = await registrationForNotify(registrationId);
  await dispatchNotification("deal.rejected", {
    dealRegistrationId: registrationId,
    sponsorCompany: notify.sponsorCompany,
    organizerSlug: notify.organizerSlug,
    reason: reason.trim() || "No reason given",
    entityType: "deal_registration",
    entityId: registrationId,
  });

  revalidatePath("/admin/deals");
  return { success: true, data: { id: registrationId } };
}

/**
 * Reverse registration: push an inbound brand lead to an organizer as a
 * pre-approved deal shell. Arrives already inside its exclusivity window —
 * the point is to hand the organizer a live deal, not homework.
 */
export async function pushLeadToOrganizer(input: {
  quoteId: string;
  partnerId: string;
  eventId?: string;
}): Promise<ActionResult<{ id: string }>> {
  const parsed = pushLeadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { supabase } = await requireCommercialInternal();

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, company_name, contact_name, contact_email, total_amount")
    .eq("id", input.quoteId)
    .maybeSingle();
  if (!quote) return { success: false, error: "Quote not found" };

  const sponsorCompany =
    (quote.company_name as string | null)?.trim() ||
    (quote.contact_name as string | null)?.trim() ||
    "Unnamed sponsor";

  if (await hasCompetingClaim(sponsorCompany, input.partnerId)) {
    return {
      success: false,
      error: "Another channel already holds a claim on this sponsor.",
    };
  }

  const { data: registration, error } = await supabase
    .from("deal_registrations")
    .insert({
      partner_id: input.partnerId,
      event_id: input.eventId ?? null,
      quote_id: input.quoteId,
      sponsor_company: sponsorCompany,
      sponsor_contact_name: (quote.contact_name as string | null) ?? null,
      sponsor_contact_email: (quote.contact_email as string | null) ?? null,
      estimated_value: (quote.total_amount as number | null) ?? null,
      status: "approved",
      approved_at: new Date().toISOString(),
      exclusivity_expires_at: exclusivityExpiry(),
      source: "reverse",
    })
    .select("id")
    .single();

  if (error || !registration) {
    logQueryError("pushLeadToOrganizer", error, { quoteId: input.quoteId });
    return { success: false, error: "Failed to push the lead" };
  }

  const notify = await registrationForNotify(String(registration.id));
  await dispatchNotification("deal.lead_pushed", {
    dealRegistrationId: String(registration.id),
    sponsorCompany,
    organizerSlug: notify.organizerSlug,
    entityType: "deal_registration",
    entityId: String(registration.id),
  });

  revalidatePath("/admin/deals");
  revalidatePath("/organizers");
  return { success: true, data: { id: String(registration.id) } };
}
