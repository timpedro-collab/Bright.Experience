/**
 * System-level provisioning: auto-creates event + account + invite from a quote.
 *
 * Server-only, not a Server Action. It runs entirely on the service role and
 * takes nothing but a quote id, so while it was exported from a `"use server"`
 * module anyone could POST a quote id and have an account, an event workspace
 * and a `customer_admin` invite created for them. Callers authorise first:
 * `acceptProposal` (signed proposal token) and `submitBookNowQuote` (the quote
 * it just created).
 */
import "server-only";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { createEventInternal } from "@/server/events";
import { inviteCustomerUserInternal } from "@/server/invites";
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
 * Choose the active template that best fits the booked package.
 *
 * Preference order: exact `event_type` + `package_type` match → same
 * `event_type` (any tier) → any active template. Returns `undefined` only when
 * no active templates exist, in which case `createEventInternal` falls back to
 * its built-in game-flow asset seeding.
 */
async function selectTemplateId(
  supabase: ReturnType<typeof getServiceRoleClient>,
  eventType: string,
  packageTier: string
): Promise<string | undefined> {
  const { data } = await supabase
    .from("event_templates")
    .select("id, event_type, package_type")
    .eq("is_active", true);

  type TemplateRow = { id: string; event_type: string; package_type: string };
  const templates = (data ?? []) as TemplateRow[];
  if (templates.length === 0) return undefined;

  const exact = templates.find(
    (t) => t.event_type === eventType && t.package_type === packageTier
  );
  if (exact) return exact.id;

  const byType = templates.find((t) => t.event_type === eventType);
  if (byType) return byType.id;

  return templates[0].id;
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

  // Pick the blueprint that best fits the booked package so the new event is
  // born with its full delivery runway (milestones, tasks, assets, QA) instead
  // of an empty shell. Without this the headline "auto-provision" promise lands
  // a customer in a workspace with nothing to do.
  const templateId = await selectTemplateId(supabase, eventType, packageTier);

  const eventResult = await createEventInternal({
    accountId,
    name: eventName,
    eventType: eventType as "activation" | "sampling" | "vending" | "hybrid" | "custom",
    packageType: packageTier as "standard" | "premium" | "custom",
    venueName: (quote.venue_name as string) || undefined,
    eventDateStart: (quote.event_date_start as string) || new Date().toISOString().split("T")[0],
    eventDateEnd: (quote.event_date_end as string) || undefined,
    templateId,
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

  // Carry partner attribution forward from the quote to the new event so a
  // reseller's commission stays tied to the live booking (not just the lead).
  const { error: attrErr } = await supabase
    .from("partner_attributions")
    .update({ event_id: eventId })
    .eq("quote_id", quoteId)
    .is("event_id", null);
  if (attrErr) {
    console.error("[provisionEventFromQuote] attribution link failed", attrErr);
  }

  // Seed compliance document requirements from account profile
  try {
    await seedComplianceFromAccount(eventId, accountId);
  } catch (complianceErr) {
    console.error("[provisionEventFromQuote] compliance seeding failed", complianceErr);
  }

  // Invite customer contact
  try {
    await inviteCustomerUserInternal(
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
  revalidatePath("/pipeline");
  revalidatePath("/ops");
  revalidatePath("/admin/quotes");
  revalidatePath("/admin/customer-queue");
  revalidatePath("/admin/partners");
  return { success: true, data: { eventId, accountId } };
}
