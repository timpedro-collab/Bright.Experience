/** Internal proposal preparation server actions (line items + walkthrough). */
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { canViewCommercial, isInternalRole } from "@/lib/roles";

/** Prepare and send a proposal with line items (internal). */
export async function prepareProposal(
  quoteId: string,
  data: {
    lineItems: { label: string; amount: number; category?: string }[];
    proposalNotes?: string;
  }
) {
  const user = await getUser();
  if (!user || !canViewCommercial(user.role)) {
    return { success: false as const, error: "Not authorised" };
  }

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
    })
    .eq("id", quoteId);

  if (updateError) {
    console.error("[prepareProposal] update failed", updateError);
    return { success: false as const, error: "Failed to send proposal" };
  }

  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath("/admin/quotes");
  revalidatePath(`/proposal/${quoteId}`);
  return { success: true as const, data: { id: quoteId } };
}

/**
 * Set the per-proposal walkthrough scheduler link and/or reveal pricing.
 *
 * Pricing on the customer proposal stays hidden until `markComplete` is set,
 * so the investment is always discussed on a 15-minute call first.
 */
export async function setProposalWalkthrough(
  quoteId: string,
  data: { url?: string; markComplete?: boolean }
) {
  const user = await getUser();
  if (!user || !isInternalRole(user.role)) {
    return { success: false as const, error: "Not authorised" };
  }

  const update: Record<string, unknown> = {};
  if (data.url !== undefined) update.walkthrough_url = data.url.trim() || null;
  if (data.markComplete !== undefined) {
    update.walkthrough_completed_at = data.markComplete
      ? new Date().toISOString()
      : null;
  }
  if (Object.keys(update).length === 0) {
    return { success: true as const, data: { id: quoteId } };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("quotes").update(update).eq("id", quoteId);
  if (error) return { success: false as const, error: "Failed to update walkthrough" };

  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath(`/proposal/${quoteId}`);
  return { success: true as const, data: { id: quoteId } };
}
