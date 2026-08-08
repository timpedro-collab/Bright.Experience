/**
 * Authenticated rebook — one click from a finished event to a pre-filled
 * quote under the customer's existing account.
 *
 * Unlike the public /book funnel (which starts a prospect from zero), this
 * action runs for a signed-in customer: it copies the machine/game/package
 * configuration from the event's original quote, attaches the new quote to
 * the same account, and drops it into the internal quote queue with the
 * source event named so the AE has full context.
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { dispatchNotification } from "@/lib/notifications/dispatch";

/**
 * Create a pre-filled rebook quote from a completed event.
 *
 * Authorisation: the caller must be signed in and the event must belong to
 * their account (internal users may rebook on a customer's behalf). Returns
 * the new quote id on success.
 */
export async function createRebookQuote(eventId: string) {
  const user = await getUser();
  if (!user) {
    return { success: false as const, error: "Not signed in" };
  }

  // The cookie-bound client enforces RLS: a customer can only read events
  // in their own account, so a foreign eventId comes back empty.
  const supabase = await createClient();
  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("id, name, account_id, event_type, venue_name, accounts(name)")
    .eq("id", eventId)
    .maybeSingle();

  if (eventErr || !event) {
    return { success: false as const, error: "Event not found" };
  }
  if (!isInternalRole(user.role) && event.account_id !== user.accountId) {
    return { success: false as const, error: "Not authorised" };
  }

  // The original quote holds the exact configuration (machine, game,
  // package, add-ons). Customers can't always read it under RLS (older
  // quotes were never linked to an account), so this lookup runs on the
  // service role — after the ownership check above.
  const service = getServiceRoleClient();
  const { data: originalQuote } = await service
    .from("quotes")
    .select("machine_id, game_id, package_id, addons, track, event_type")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const account = (event as { accounts?: { name?: string } | null }).accounts;

  const { data: quote, error: insertErr } = await service
    .from("quotes")
    .insert({
      track: "proposal",
      status: "submitted",
      account_id: event.account_id,
      contact_name: user.name,
      contact_email: user.email,
      company_name: account?.name ?? null,
      event_type: originalQuote?.event_type ?? event.event_type ?? null,
      venue_name: event.venue_name ?? null,
      machine_id: originalQuote?.machine_id ?? null,
      game_id: originalQuote?.game_id ?? null,
      package_id: originalQuote?.package_id ?? null,
      addons: originalQuote?.addons ?? [],
      special_requirements: `Rebook of "${event.name}" — same configuration, new dates/venue to confirm.`,
    })
    .select("id")
    .single();

  if (insertErr || !quote) {
    console.error("[createRebookQuote] insert failed", insertErr, { eventId });
    return { success: false as const, error: "Failed to start your rebook" };
  }

  try {
    await dispatchNotification("booking.received", {
      quoteId: quote.id,
      contactName: user.name,
      contactEmail: user.email,
      companyName: account?.name ?? null,
      entityType: "quote",
      entityId: quote.id,
    });
  } catch (notifyErr) {
    console.error("[createRebookQuote] notification failed", notifyErr);
  }

  revalidatePath("/admin/quotes");
  revalidatePath("/");
  return { success: true as const, data: { id: quote.id } };
}
