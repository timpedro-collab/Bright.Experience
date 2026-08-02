/** Public proposal decisions — accept / decline. */
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { provisionEventFromQuote } from "@/server/provisioning";
import { shouldAutoProvisionQuote } from "@/lib/booking-flags";
import { decisionLimiter, getClientIp } from "@/lib/rate-limit";

const RATE_LIMITED = "Too many requests. Please wait a moment and try again.";

/** Accept a proposal (public). */
export async function acceptQuote(quoteId: string) {
  if (!(await decisionLimiter(await getClientIp()))) {
    return { success: false as const, error: RATE_LIMITED };
  }

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

  const supabase = await createClient();

  const { error } = await supabase
    .from("quotes")
    .update({ status: "declined", declined_at: new Date().toISOString() })
    .eq("id", quoteId);

  if (error) return { success: false as const, error: "Failed to decline proposal" };

  revalidatePath(`/proposal/${quoteId}`);
  revalidatePath("/admin/quotes");
  revalidatePath("/admin/customer-queue");
  return { success: true as const, data: { id: quoteId } };
}
