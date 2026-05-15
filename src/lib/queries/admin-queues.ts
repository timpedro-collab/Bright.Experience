/** Lightweight count queries powering the internal Work Queue widget */
import { createClient } from "@/lib/supabase/server";

export interface InternalQueueCounts {
  newQuotes: number;
  newStudioOrders: number;
  pendingPartnerApps: number;
  blockedEvents: number;
  assetReviews: number;
  stuckCustomerActions: number;
}

/**
 * Days after which a customer-side action is treated as "stuck". Used
 * by both the dashboard tile and `/admin/customer-queue`, kept here so
 * the two surfaces never drift apart.
 */
export const STUCK_CUSTOMER_DAYS = 7;

/**
 * Returns the cutoff timestamp used by stuck-customer queries. Always
 * called fresh because the cutoff is a relative now-7-days value.
 */
function stuckCutoffIso(days = STUCK_CUSTOMER_DAYS): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Count customer-side actions that have sat past the stuck threshold.
 * Three buckets that mirror `/admin/customer-queue`:
 *   - Pending Bright.Blue creative approvals waiting on the customer
 *   - Unsubmitted briefing responses
 *   - Asset revisions the customer hasn't re-uploaded
 *
 * Implemented as `head: true` count queries so we don't pay to ship
 * rows we won't render. Returns the aggregated total.
 */
export async function countStuckCustomerActions(
  days = STUCK_CUSTOMER_DAYS
): Promise<number> {
  const supabase = await createClient();
  const cutoff = stuckCutoffIso(days);
  const [approvals, briefings, revisions] = await Promise.all([
    supabase
      .from("approvals")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .lt("requested_at", cutoff),
    supabase
      .from("briefing_responses")
      .select("event_id", { count: "exact", head: true })
      .eq("is_submitted", false)
      .lt("updated_at", cutoff),
    supabase
      .from("assets")
      .select("id", { count: "exact", head: true })
      .eq("review_status", "revision_requested")
      .lt("review_decided_at", cutoff),
  ]);
  return (
    (approvals.count ?? 0) + (briefings.count ?? 0) + (revisions.count ?? 0)
  );
}

export async function getInternalQueueCounts(): Promise<InternalQueueCounts> {
  const supabase = await createClient();

  const [quotes, studio, partners, events, assetReviews, stuck] =
    await Promise.all([
      supabase
        .from("quotes")
        .select("id", { count: "exact", head: true })
        .in("status", ["submitted", "draft"]),
      supabase
        .from("studio_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "submitted"),
      supabase
        .from("partners")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("health_status", "red"),
      supabase
        .from("assets")
        .select("id", { count: "exact", head: true })
        .eq("review_status", "pending_review"),
      countStuckCustomerActions(),
    ]);

  return {
    newQuotes: quotes.count ?? 0,
    newStudioOrders: studio.count ?? 0,
    pendingPartnerApps: partners.count ?? 0,
    blockedEvents: events.count ?? 0,
    assetReviews: assetReviews.count ?? 0,
    stuckCustomerActions: stuck,
  };
}
