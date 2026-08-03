/** Track 1 (Book Now) quoting server actions. */
"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { revalidatePath } from "next/cache";
import { quoteLimiter, getClientIp } from "@/lib/rate-limit";
import { sanitiseCapabilitySlugs } from "@/lib/capabilities";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { recordAttribution } from "@/app/actions/partners";
import { provisionEventFromQuote } from "@/server/provisioning";
import { shouldAutoProvisionQuote } from "@/lib/booking-flags";
import { bookNowSchema } from "@/lib/validations/quotes";
import { PARTNER_ATTRIBUTION_COOKIE } from "./constants";

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
  if (!(await quoteLimiter(await getClientIp()))) {
    return {
      success: false as const,
      error: "Too many submissions. Please wait a moment and try again.",
    };
  }

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

  // Insert + returned id via service role: anon can insert under RLS but
  // cannot select the new row back (see getBookingReceipt below).
  const { data: quote, error } = await getServiceRoleClient()
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

  // The buyer's own confirmation. Separate from the internal fan-out below
  // because a Book Now buyer has no portal account to notify into.
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    await sendBookingConfirmationEmail({
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      packageName: pkg.name as string,
      companyName: data.companyName ?? null,
      eventDateStart: data.eventDateStart ?? null,
      eventDateEnd: data.eventDateEnd ?? null,
      totalAmount,
      receiptUrl: `${baseUrl}/book/confirmation/${quote.id}`,
    });
  } catch (emailError) {
    console.error("[submitBookNowQuote] confirmation email failed", emailError);
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

  // Book-now track: auto-provision event immediately — but only when the
  // demo-safe gate is enabled, so funnel walkthroughs don't create real events.
  if (shouldAutoProvisionQuote()) {
    try {
      await provisionEventFromQuote(quote.id);
    } catch (provisionError) {
      console.error("[submitBookNowQuote] provisioning failed", provisionError);
    }
  }

  revalidatePath("/admin/quotes");
  revalidatePath("/admin/customer-queue");
  revalidatePath("/pipeline");
  revalidatePath("/ops");
  revalidatePath("/");
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
