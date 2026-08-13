/** Manual quote → event conversion, for when auto-provisioning is off. */
"use server";

import { getUser } from "@/lib/auth";
import { canViewCommercial } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import { provisionEventFromQuote } from "@/server/provisioning";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types/actions";

/**
 * Statuses a quote can be converted from.
 *
 * `submitted` covers a Book Now purchase, `accepted` a signed-off proposal,
 * and `proposal_sent` the very common case of a customer saying yes on the
 * walkthrough call rather than clicking the button. A `draft`, `declined`
 * or `expired` quote is nothing to build on.
 */
const CONVERTIBLE_STATUSES = ["submitted", "proposal_sent", "accepted"];

/**
 * Create the event workspace for a quote by hand.
 *
 * `BOOKING_AUTO_PROVISION` is off by default, so most bookings land as a quote
 * with no event behind them and no way to move forward — this is the control
 * that finishes the job. It is idempotent: a quote already carrying an
 * `event_id` returns that event instead of provisioning a second one.
 */
export async function convertQuoteToEvent(
  quoteId: string
): Promise<ActionResult<{ eventId: string; alreadyConverted: boolean }>> {
  const user = await getUser();
  if (!user || !canViewCommercial(user.role)) {
    return { success: false, error: "Not authorised" };
  }

  const supabase = await createClient();
  const { data: quote, error } = await supabase
    .from("quotes")
    .select("id, status, event_id, contact_name, company_name")
    .eq("id", quoteId)
    .maybeSingle();

  if (error || !quote) {
    return { success: false, error: "Quote not found" };
  }

  // Converting twice would give the customer two workspaces and two invites.
  if (quote.event_id) {
    return {
      success: true,
      data: { eventId: quote.event_id as string, alreadyConverted: true },
    };
  }

  if (!CONVERTIBLE_STATUSES.includes(quote.status as string)) {
    return {
      success: false,
      error: `A ${quote.status} quote can't be converted into an event`,
    };
  }

  const result = await provisionEventFromQuote(quoteId);
  if (!result.success) return result;

  await writeAudit({
    eventId: result.data.eventId,
    actorId: user.id,
    action: "quote_converted",
    entityType: "quote",
    entityId: quoteId,
    metadata: {
      quoteStatus: quote.status,
      accountId: result.data.accountId,
      actorRole: user.role,
      manual: true,
    },
  });

  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath("/admin/quotes");
  return {
    success: true,
    data: { eventId: result.data.eventId, alreadyConverted: false },
  };
}
