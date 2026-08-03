/**
 * Public proposal decisions — accept / decline.
 *
 * The caller is an anonymous prospect on the proposal microsite; `quotes`
 * RLS gives the cookie-bound client no update rights (an anon update would
 * silently match zero rows). These actions therefore write through the
 * service-role client, with the guards enforced here in code: the quote
 * UUID is the credential, the status transition is pinned to
 * `proposal_sent`, and a zero-row update is reported as a failure rather
 * than a success.
 */
"use server";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { revalidatePath } from "next/cache";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { provisionEventFromQuote } from "@/server/provisioning";
import { shouldAutoProvisionQuote } from "@/lib/booking-flags";
import { decisionLimiter, getClientIp } from "@/lib/rate-limit";

const RATE_LIMITED = "Too many requests. Please wait a moment and try again.";
const NOT_OPEN = "This proposal is no longer open for a decision.";

/** Accept a proposal (public). */
export async function acceptQuote(quoteId: string) {
  if (!(await decisionLimiter(await getClientIp()))) {
    return { success: false as const, error: RATE_LIMITED };
  }

  const supabase = getServiceRoleClient();

  // Enforce the expiry the proposal page displays — an expired link must not
  // still accept quietly on the server.
  const { data: current } = await supabase
    .from("quotes")
    .select("status, expires_at, contact_name, company_name")
    .eq("id", quoteId)
    .maybeSingle();
  if (!current || current.status !== "proposal_sent") {
    return { success: false as const, error: NOT_OPEN };
  }
  if (current.expires_at && new Date(current.expires_at) < new Date()) {
    return { success: false as const, error: NOT_OPEN };
  }

  const { data: updated, error } = await supabase
    .from("quotes")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", quoteId)
    .eq("status", "proposal_sent")
    .select("id");

  if (error || !updated?.length) {
    return { success: false as const, error: "Failed to accept proposal" };
  }

  await dispatchNotification("quote.accepted", {
    quoteId,
    contactName: current.contact_name ?? "Customer",
    eventName: current.company_name ?? "the new event",
    entityType: "quote",
    entityId: quoteId,
  });

  // Auto-provision event from the accepted quote (gated for demo safety).
  if (shouldAutoProvisionQuote()) {
    try {
      await provisionEventFromQuote(quoteId);
    } catch (provisionError) {
      console.error("[acceptQuote] provisioning failed", provisionError);
    }
  }

  revalidatePath(`/proposal/${quoteId}`);
  revalidatePath("/admin/quotes");
  revalidatePath("/admin/customer-queue");
  revalidatePath("/pipeline");
  revalidatePath("/ops");
  revalidatePath("/");
  return { success: true as const, data: { id: quoteId } };
}

/** Decline a proposal (public). */
export async function declineQuote(quoteId: string) {
  if (!(await decisionLimiter(await getClientIp()))) {
    return { success: false as const, error: RATE_LIMITED };
  }

  const supabase = getServiceRoleClient();

  const { data: updated, error } = await supabase
    .from("quotes")
    .update({ status: "declined", declined_at: new Date().toISOString() })
    .eq("id", quoteId)
    .eq("status", "proposal_sent")
    .select("id");

  if (error || !updated?.length) {
    return { success: false as const, error: "Failed to decline proposal" };
  }

  revalidatePath(`/proposal/${quoteId}`);
  revalidatePath("/admin/quotes");
  revalidatePath("/admin/customer-queue");
  return { success: true as const, data: { id: quoteId } };
}
