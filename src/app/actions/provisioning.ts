/** System-level provisioning: auto-creates event + account + invite from a quote. */
"use server";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { createEventInternal } from "@/app/actions/events";
import { inviteCustomerUserSystem } from "@/app/actions/invites";
import { seedComplianceFromAccount } from "@/app/actions/compliance";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types/actions";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/**
 * Auto-provision an event from an accepted or book-now quote.
 *
 * 1. Reads the full quote row (contact info, package, dates, venue).
 * 2. Finds or creates an `accounts` row from `company_name`.
 * 3. Creates the event via `createEventInternal` (service-role).
 * 4. Links `quotes.event_id` back to the new event.
 * 5. Invites the customer contact as `customer_admin`.
 * 6. Dispatches a `booking.provisioned` notification for internal visibility.
 */
export async function provisionEventFromQuote(
  quoteId: string
): Promise<ActionResult<{ eventId: string; accountId: string }>> {
  const supabase = getServiceRoleClient();

  const { data: quote, error: quoteErr } = await supabase
    .from("quotes")
    .select(
      `id, contact_name, contact_email, company_name, package_id,
       event_date_start, event_date_end, venue_name, event_type, track,
       packages ( name, tier )`
    )
    .eq("id", quoteId)
    .single();

  if (quoteErr || !quote) {
    console.error("[provisionEventFromQuote] quote lookup failed", quoteErr);
    return { success: false, error: "Quote not found" };
  }

  const companyName = (quote.company_name as string) || quote.contact_name || "Unnamed";
  const slug = slugify(companyName);

  // Find-or-create account
  let accountId: string;
  const { data: existingAccount } = await supabase
    .from("accounts")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existingAccount) {
    accountId = existingAccount.id as string;
  } else {
    const { data: newAccount, error: accErr } = await supabase
      .from("accounts")
      .insert({ name: companyName, slug })
      .select("id")
      .single();
    if (accErr || !newAccount) {
      console.error("[provisionEventFromQuote] account creation failed", accErr);
      return { success: false, error: "Failed to create customer account" };
    }
    accountId = newAccount.id as string;
  }

  type PkgJoin = { name?: string; tier?: string };
  const pkg = (quote as { packages?: PkgJoin }).packages;
  const eventName = `${companyName} — ${pkg?.name ?? "Event"}`;
  const eventType = (quote.event_type as string) || "activation";
  const packageTier = (pkg?.tier as string) || "standard";

  const eventResult = await createEventInternal({
    accountId,
    name: eventName,
    eventType: eventType as "activation" | "sampling" | "vending" | "hybrid" | "custom",
    packageType: packageTier as "standard" | "premium" | "custom",
    venueName: (quote.venue_name as string) || undefined,
    eventDateStart: (quote.event_date_start as string) || new Date().toISOString().split("T")[0],
    eventDateEnd: (quote.event_date_end as string) || undefined,
  });

  if (!eventResult.success) {
    console.error("[provisionEventFromQuote] event creation failed", eventResult.error);
    return { success: false, error: "Failed to create event" };
  }

  const eventId = eventResult.data.id;

  // Link quote → event
  const { error: linkErr } = await supabase
    .from("quotes")
    .update({ event_id: eventId })
    .eq("id", quoteId);
  if (linkErr) {
    console.error("[provisionEventFromQuote] quote link failed", linkErr);
  }

  // Seed compliance document requirements from account profile
  try {
    await seedComplianceFromAccount(eventId, accountId);
  } catch (complianceErr) {
    console.error("[provisionEventFromQuote] compliance seeding failed", complianceErr);
  }

  // Invite customer contact
  try {
    await inviteCustomerUserSystem(
      quote.contact_email as string,
      accountId,
      "customer_admin"
    );
  } catch (inviteErr) {
    console.error("[provisionEventFromQuote] invite failed", inviteErr);
  }

  // Notify internal team
  try {
    await dispatchNotification(
      "booking.provisioned",
      {
        eventId,
        companyName,
        contactName: quote.contact_name as string,
        entityType: "event",
        entityId: eventId,
      },
      { supabaseClient: supabase }
    );
  } catch (notifyErr) {
    console.error("[provisionEventFromQuote] notification failed", notifyErr);
  }

  revalidatePath("/");
  revalidatePath(`/events/${eventId}`);
  return { success: true, data: { eventId, accountId } };
}
