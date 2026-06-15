/** Server actions for the two-track quoting engine. */
"use server";

import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { revalidatePath } from "next/cache";
import { sanitiseCapabilitySlugs } from "@/lib/capabilities";
import { sendProposalIntakeNotification } from "@/lib/email";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { recordAttribution } from "@/app/actions/partners";
import { provisionEventFromQuote } from "@/app/actions/provisioning";
import {
  bookNowSchema,
  proposalIntakeSchema,
} from "@/lib/validations/quotes";

const PARTNER_ATTRIBUTION_COOKIE = "bb_partner";

/**
 * Submit a Track 1 (Book Now) quote.
 *
 * Trusts only `packageId` (UUID) and the capability slugs from the client —
 * everything that affects price is re-read from the database here, so a
 * tampered URL can't change what the customer is charged.
 */
export async function submitBookNowQuote(data: {
  /** UUID of the chosen package, resolved server-side on the configure page. */
  packageId: string;
  /** Optional UUID of a chosen machine; validated against catalogue. */
  machineId?: string;
  /** Optional UUID of a chosen game; validated against catalogue. */
  gameId?: string;
  /** Canonical capability slugs the customer toggled on. */
  addons?: string[];
  eventDateStart?: string;
  eventDateEnd?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  companyName?: string;
}) {
  const coreFields = bookNowSchema.pick({
    packageId: true,
    contactName: true,
    contactEmail: true,
  });
  const parsed = coreFields.safeParse({
    packageId: data.packageId,
    contactName: data.contactName,
    contactEmail: data.contactEmail,
  });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const capabilitySlugs = sanitiseCapabilitySlugs(data.addons);

  // Re-read the package + addons from the DB so pricing is authoritative.
  // The `packages` table is publicly selectable for is_bookable rows.
  const { data: pkg, error: pkgError } = await supabase
    .from("packages")
    .select(
      `id, name, base_price, is_bookable,
       package_addons ( id, name, price, capability_slug )`
    )
    .eq("id", data.packageId)
    .eq("is_bookable", true)
    .maybeSingle();

  if (pkgError) {
    console.error("[submitBookNowQuote] package lookup failed", pkgError);
    return { success: false as const, error: "Failed to look up package" };
  }
  if (!pkg) {
    return { success: false as const, error: "Package not found or not bookable" };
  }

  // Match selected capability slugs back to addon rows and total their price.
  type AddonRow = { id: string; name: string; price: number; capability_slug: string | null };
  const addonRows = ((pkg as { package_addons?: AddonRow[] }).package_addons ?? []).filter(
    (a) => a.capability_slug && capabilitySlugs.includes(a.capability_slug)
  );
  const addonTotal = addonRows.reduce((sum, a) => sum + (a.price ?? 0), 0);
  const totalAmount = (pkg.base_price ?? 0) + addonTotal;

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      track: "book_now",
      status: "submitted",
      package_id: pkg.id,
      machine_id: data.machineId ?? null,
      game_id: data.gameId ?? null,
      addons: capabilitySlugs,
      event_date_start: data.eventDateStart ?? null,
      event_date_end: data.eventDateEnd ?? null,
      contact_name: data.contactName,
      contact_email: data.contactEmail,
      contact_phone: data.contactPhone ?? null,
      company_name: data.companyName ?? null,
      total_amount: totalAmount,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[submitBookNowQuote] insert failed", error);
    return { success: false as const, error: "Failed to submit booking" };
  }

  // Wire partner attribution if a partner cookie is set.
  const partnerCode = (await cookies()).get(PARTNER_ATTRIBUTION_COOKIE)?.value;
  if (partnerCode) {
    try {
      await recordAttribution({ partnerCode, quoteId: quote.id });
    } catch (attrError) {
      console.error("[submitBookNowQuote] attribution failed", attrError);
    }
  }

  try {
    await dispatchNotification("booking.received", {
      quoteId: quote.id,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      companyName: data.companyName ?? null,
      entityType: "quote",
      entityId: quote.id,
    });
  } catch (notifyError) {
    console.error("[submitBookNowQuote] notification failed", notifyError);
  }

  // Book-now track: auto-provision event immediately.
  try {
    await provisionEventFromQuote(quote.id);
  } catch (provisionError) {
    console.error("[submitBookNowQuote] provisioning failed", provisionError);
  }

  revalidatePath("/admin/quotes");
  return {
    success: true as const,
    data: { id: quote.id, totalAmount },
  };
}

/**
 * Server-side helper for the booking confirmation page.
 *
 * Anon users can insert a quote but the `quotes` RLS does not let them
 * select it back. Rather than loosen the RLS, we expose a narrow service-
 * role read here that returns only the receipt-safe fields. Pages calling
 * this must validate the id is a UUID before invoking.
 */
export async function getBookingReceipt(quoteId: string) {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("quotes")
    .select(
      `id, contact_name, contact_email, company_name,
       event_date_start, event_date_end, total_amount,
       package_id, addons, status,
       packages ( name, slug ),
       machines ( name )`
    )
    .eq("id", quoteId)
    .eq("track", "book_now")
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

/** Submit a Track 2 (Proposal) intake from the guided wizard.
 *
 * `addons` carries the canonical capability slugs the customer chose on the
 * match reveal — silently absorbed from URL params so the customer never sees
 * a configurator step. Untrusted input is filtered to the canonical list.
 */
export async function submitProposalIntake(data: {
  eventType: string;
  objective?: string;
  venueName?: string;
  postcode?: string;
  eventDateStart?: string;
  eventDateEnd?: string;
  machinePreference?: string;
  gamePreference?: string;
  /** Optional package slug carried from the quiz match (we resolve to UUID). */
  packageSlug?: string;
  footfallEstimate?: string;
  creativeNeeds?: string;
  specialRequirements?: string;
  budgetIndication?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  companyName?: string;
  addons?: string[];
}) {
  const coreFields = proposalIntakeSchema.pick({
    eventType: true,
    contactName: true,
    contactEmail: true,
  });
  const parsed = coreFields.safeParse({
    eventType: data.eventType,
    contactName: data.contactName,
    contactEmail: data.contactEmail,
  });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const addons = sanitiseCapabilitySlugs(data.addons);

  // Resolve the package slug → UUID up-front so we can store a real FK.
  let packageId: string | null = null;
  if (data.packageSlug) {
    const { data: pkg } = await supabase
      .from("packages")
      .select("id")
      .eq("slug", data.packageSlug)
      .maybeSingle();
    packageId = pkg?.id ?? null;
  }

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      track: "proposal",
      status: "submitted",
      event_type: data.eventType,
      objective: data.objective ?? null,
      venue_name: data.venueName ?? null,
      postcode: data.postcode ?? null,
      event_date_start: data.eventDateStart ?? null,
      event_date_end: data.eventDateEnd ?? null,
      machine_preference: data.machinePreference ?? null,
      game_preference: data.gamePreference ?? null,
      package_id: packageId,
      footfall_estimate_text: data.footfallEstimate ?? null,
      creative_needs: data.creativeNeeds ?? null,
      special_requirements: data.specialRequirements ?? null,
      budget_indication: data.budgetIndication ?? null,
      contact_name: data.contactName,
      contact_email: data.contactEmail,
      contact_phone: data.contactPhone ?? null,
      company_name: data.companyName ?? null,
      addons,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[submitProposalIntake] insert failed", error);
    return { success: false as const, error: "Failed to submit intake" };
  }

  // Partner attribution from the cookie set by /p/[code].
  const partnerCode = (await cookies()).get(PARTNER_ATTRIBUTION_COOKIE)?.value;
  if (partnerCode) {
    try {
      await recordAttribution({ partnerCode, quoteId: quote.id });
    } catch (attrError) {
      console.error("[submitProposalIntake] attribution failed", attrError);
    }
  }

  // Fire-and-forget AE handoff email. Capability slugs travel as structured
  // data so the AE sees the customer's outcome lines (not just slugs).
  try {
    const h = await headers();
    const host = h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? "https";
    await sendProposalIntakeNotification({
      quoteId: quote.id,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      companyName: data.companyName ?? null,
      eventType: data.eventType ?? null,
      venueName: data.venueName ?? null,
      capabilitySlugs: addons,
      portalUrl: `${proto}://${host}/admin/quotes/${quote.id}`,
    });
  } catch (notifyError) {
    console.error("[submitProposalIntake] notification failed", notifyError);
  }

  // In-portal AE ping — the existing email handoff above remains as the
  // structured outcomes-with-slugs reference; this gives the AE a row on
  // the bell + notifications page that ties back to the quote.
  try {
    await dispatchNotification("proposal.intake_received", {
      quoteId: quote.id,
      contactName: data.contactName,
      entityType: "quote",
      entityId: quote.id,
    });
  } catch (notifyError) {
    console.error("[submitProposalIntake] in-portal notify failed", notifyError);
  }

  revalidatePath("/admin/quotes");
  revalidatePath("/admin/customer-queue");
  return { success: true as const, data: { id: quote.id } };
}

/**
 * Update the canonical capability slugs on a quote.
 *
 * Backs the "Adjust the experience" link on the confirmation screen — opens the
 * same RefineDrawer the match card used, and the customer's new selection is
 * pushed back to the quote so the AE sees the latest set.
 */
export async function updateQuoteCapabilities(
  quoteId: string,
  capabilitySlugs: string[]
) {
  const supabase = await createClient();
  const addons = sanitiseCapabilitySlugs(capabilitySlugs);

  const { error } = await supabase
    .from("quotes")
    .update({ addons })
    .eq("id", quoteId);

  if (error) {
    return { success: false as const, error: "Failed to update capabilities" };
  }

  revalidatePath(`/admin/quotes/${quoteId}`);
  return { success: true as const, data: { id: quoteId, addons } };
}

/** Prepare and send a proposal with line items (internal). */
export async function prepareProposal(
  quoteId: string,
  data: {
    lineItems: { label: string; amount: number; category?: string }[];
    proposalNotes?: string;
  }
) {
  const supabase = await createClient();

  const totalAmount = data.lineItems.reduce((sum, li) => sum + li.amount, 0);

  const items = data.lineItems.map((li, i) => ({
    quote_id: quoteId,
    label: li.label,
    amount: li.amount,
    category: li.category ?? null,
    sort_order: i,
  }));

  const { error: itemsError } = await supabase
    .from("quote_line_items")
    .insert(items);

  if (itemsError) return { success: false as const, error: "Failed to add line items" };

  const expiresAt = new Date(Date.now() + 14 * 86_400_000).toISOString();
  const { error: updateError } = await supabase
    .from("quotes")
    .update({
      status: "proposal_sent",
      total_amount: totalAmount,
      proposal_notes: data.proposalNotes ?? null,
      expires_at: expiresAt,
      valid_until: expiresAt,
    })
    .eq("id", quoteId);

  if (updateError) {
    console.error("[prepareProposal] update failed", updateError);
    return { success: false as const, error: "Failed to send proposal" };
  }

  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath("/admin/quotes");
  return { success: true as const, data: { id: quoteId } };
}

/** Accept a proposal (public). */
export async function acceptQuote(quoteId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("quotes")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", quoteId);

  if (error) return { success: false as const, error: "Failed to accept proposal" };

  const { data: quote } = await supabase
    .from("quotes")
    .select("contact_name, company_name")
    .eq("id", quoteId)
    .single();

  await dispatchNotification("quote.accepted", {
    quoteId,
    contactName: quote?.contact_name ?? "Customer",
    eventName: quote?.company_name ?? "the new event",
    entityType: "quote",
    entityId: quoteId,
  });

  // Auto-provision event from the accepted quote.
  try {
    await provisionEventFromQuote(quoteId);
  } catch (provisionError) {
    console.error("[acceptQuote] provisioning failed", provisionError);
  }

  revalidatePath(`/proposal/${quoteId}`);
  revalidatePath("/admin/quotes");
  return { success: true as const, data: { id: quoteId } };
}

/** Decline a proposal (public). */
export async function declineQuote(quoteId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("quotes")
    .update({ status: "declined", declined_at: new Date().toISOString() })
    .eq("id", quoteId);

  if (error) return { success: false as const, error: "Failed to decline proposal" };

  revalidatePath(`/proposal/${quoteId}`);
  revalidatePath("/admin/quotes");
  return { success: true as const, data: { id: quoteId } };
}
