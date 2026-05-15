/** Supabase read queries for partner attribution and commission tracking. */
import { createClient } from "@/lib/supabase/server";

/** Fetch all attributions for a partner, most recent first. */
export async function getAttributionsByPartner(partnerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partner_attributions")
    .select(
      `id, partner_id, quote_id, event_id,
       commission_amount, commission_status, paid_at,
       created_at, updated_at`
    )
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

/** Aggregate commission totals for a partner: earned, pending, and paid. */
export async function getPartnerCommissionSummary(partnerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partner_attributions")
    .select("commission_amount, commission_status")
    .eq("partner_id", partnerId);

  if (error || !data) {
    return { totalEarned: 0, totalPending: 0, totalPaid: 0 };
  }

  let totalEarned = 0;
  let totalPending = 0;
  let totalPaid = 0;

  for (const row of data) {
    const amount = Number(row.commission_amount) || 0;
    totalEarned += amount;
    if (row.commission_status === "pending") totalPending += amount;
    if (row.commission_status === "paid") totalPaid += amount;
  }

  return { totalEarned, totalPending, totalPaid };
}
