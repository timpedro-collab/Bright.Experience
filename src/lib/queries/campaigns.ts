/** Supabase read queries for campaign entities. */
import { createClient } from "@/lib/supabase/server";

/** Fetch campaigns for an account, or all campaigns for internal users. */
export async function getCampaigns(accountId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("campaigns")
    .select(
      `id, account_id, name, description, status,
       start_date, end_date, shared_creative_json,
       aggregate_metrics_json, created_at, updated_at`
    )
    .order("created_at", { ascending: false });

  if (accountId) {
    query = query.eq("account_id", accountId);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data;
}

/** Fetch a single campaign by ID with its associated events. */
export async function getCampaignById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select(
      `*, campaign_events ( id, event_id, sort_order, created_at,
        events ( id, name, event_type, venue_name, event_date_start, event_date_end, current_stage, health_status )
      )`
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

/** Count of events linked to a campaign (head count only). */
export async function getCampaignEventCount(campaignId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("campaign_events")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId);

  if (error) return 0;
  return count ?? 0;
}

/** Fetch all events linked to a campaign, ordered by sort_order. */
export async function getCampaignEvents(campaignId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaign_events")
    .select(
      `id, event_id, sort_order, created_at,
       events ( id, name, event_type, venue_name, event_date_start, event_date_end, current_stage, health_status )`
    )
    .eq("campaign_id", campaignId)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data;
}

/** Fetch campaigns that a specific event belongs to. */
export async function getCampaignsForEvent(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaign_events")
    .select(
      `campaign_id,
       campaigns ( id, name, status, start_date, end_date )`
    )
    .eq("event_id", eventId);

  if (error || !data) return [];
  return data;
}
