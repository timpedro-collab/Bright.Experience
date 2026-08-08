/** Lightweight count queries powering the internal Work Queue widget */
import { createClient } from "@/lib/supabase/server";

export interface InternalQueueCounts {
  newQuotes: number;
  newStudioOrders: number;
  pendingPartnerApps: number;
  blockedEvents: number;
  assetReviews: number;
  /** Asset reviews sitting past the reviewer SLA — a subset of assetReviews. */
  overdueAssetReviews: number;
  stuckCustomerActions: number;
  /**
   * Accepted quotes with no linked event — the customer said yes but has no
   * workspace yet. Safety net for when auto-provisioning is off or failed.
   */
  acceptedNeedingWorkspace: number;
}

/**
 * Internal reviewer SLA: creative sign-off should land within this many days
 * of upload. Mirrors STUCK_CUSTOMER_DAYS but for the Bright.Blue side of the
 * desk, so a slow review escalates just like a slow customer.
 */
const REVIEWER_SLA_DAYS = 2;

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

  const reviewerCutoff = stuckCutoffIso(REVIEWER_SLA_DAYS);
  const [
    quotes,
    studio,
    partners,
    events,
    assetReviews,
    overdueReviews,
    stuck,
    acceptedUnprovisioned,
  ] =
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
      supabase
        .from("assets")
        .select("id", { count: "exact", head: true })
        .eq("review_status", "pending_review")
        .lt("updated_at", reviewerCutoff),
      countStuckCustomerActions(),
      supabase
        .from("quotes")
        .select("id", { count: "exact", head: true })
        .eq("status", "accepted")
        .is("event_id", null),
    ]);

  return {
    newQuotes: quotes.count ?? 0,
    newStudioOrders: studio.count ?? 0,
    pendingPartnerApps: partners.count ?? 0,
    blockedEvents: events.count ?? 0,
    assetReviews: assetReviews.count ?? 0,
    overdueAssetReviews: overdueReviews.count ?? 0,
    stuckCustomerActions: stuck,
    acceptedNeedingWorkspace: acceptedUnprovisioned.count ?? 0,
  };
}

/** One stale customer-side item for the AE phone-chase queue. */
export interface StuckCustomerQueueItem {
  id: string;
  kind: "approval" | "briefing" | "asset_revision";
  title: string;
  eventName: string | null;
  accountName: string | null;
  anchor: string;
  link: string;
}

/**
 * Full list of customer-side actions past the stuck threshold, oldest first.
 * Powers `/admin/customer-queue` (the count helper above powers the dashboard tile).
 */
export async function getStuckCustomerQueueItems(
  days = STUCK_CUSTOMER_DAYS,
): Promise<StuckCustomerQueueItem[]> {
  const supabase = await createClient();
  const cutoff = stuckCutoffIso(days);

  const [approvalsRes, briefingsRes, revisionsRes] = await Promise.all([
    supabase
      .from("approvals")
      .select("id, event_id, title, requested_at, events(name, accounts(name))")
      .eq("status", "pending")
      .lt("requested_at", cutoff),
    supabase
      .from("briefing_responses")
      .select("event_id, form_type, updated_at, events(name, accounts(name))")
      .eq("is_submitted", false)
      .lt("updated_at", cutoff),
    supabase
      .from("assets")
      .select("id, event_id, name, review_decided_at, events(name, accounts(name))")
      .eq("review_status", "revision_requested")
      .lt("review_decided_at", cutoff),
  ]);

  const items: StuckCustomerQueueItem[] = [];

  for (const row of (approvalsRes.data ?? []) as Array<Record<string, unknown>>) {
    const events = row.events as
      | { name?: string; accounts?: { name?: string } }
      | null;
    items.push({
      id: `approval-${row.id}`,
      kind: "approval",
      title: `Approval pending: ${row.title as string}`,
      eventName: events?.name ?? null,
      accountName: events?.accounts?.name ?? null,
      anchor: String(row.requested_at),
      link: `/events/${row.event_id}/approvals`,
    });
  }

  for (const row of (briefingsRes.data ?? []) as Array<Record<string, unknown>>) {
    const events = row.events as
      | { name?: string; accounts?: { name?: string } }
      | null;
    items.push({
      id: `briefing-${row.event_id}-${row.form_type}`,
      kind: "briefing",
      title: `Brief not submitted (${String(row.form_type)})`,
      eventName: events?.name ?? null,
      accountName: events?.accounts?.name ?? null,
      anchor: String(row.updated_at),
      link: `/events/${row.event_id}/briefing`,
    });
  }

  for (const row of (revisionsRes.data ?? []) as Array<Record<string, unknown>>) {
    const events = row.events as
      | { name?: string; accounts?: { name?: string } }
      | null;
    items.push({
      id: `asset-${row.id}`,
      kind: "asset_revision",
      title: `Awaiting re-upload: ${row.name as string}`,
      eventName: events?.name ?? null,
      accountName: events?.accounts?.name ?? null,
      anchor: String(row.review_decided_at),
      link: `/events/${row.event_id}/assets`,
    });
  }

  items.sort((a, b) => a.anchor.localeCompare(b.anchor));
  return items;
}
