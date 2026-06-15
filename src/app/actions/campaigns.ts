/** Server actions for campaign management and multi-event coordination. */
"use server";

import { requireInternalUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/** Create a new campaign in draft status. */
export async function createCampaign(data: {
  name: string;
  description?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { supabase } = await requireInternalUser();

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      name: data.name,
      description: data.description || null,
      account_id: data.accountId || null,
      start_date: data.startDate || null,
      end_date: data.endDate || null,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) return { success: false as const, error: "Failed to create campaign" };

  revalidatePath("/admin/campaigns");
  return { success: true as const, data: { id: campaign.id } };
}

/** Link an event to a campaign. */
export async function addEventToCampaign(campaignId: string, eventId: string) {
  const { supabase } = await requireInternalUser();

  const { data: existing } = await supabase
    .from("campaign_events")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("event_id", eventId)
    .single();

  if (existing) return { success: false as const, error: "Event already in campaign" };

  const { data: maxOrder } = await supabase
    .from("campaign_events")
    .select("sort_order")
    .eq("campaign_id", campaignId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxOrder?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("campaign_events").insert({
    campaign_id: campaignId,
    event_id: eventId,
    sort_order: nextOrder,
  });

  if (error) return { success: false as const, error: "Failed to add event to campaign" };

  revalidatePath(`/admin/campaigns/${campaignId}`);
  revalidatePath(`/events/${eventId}/campaign`);
  return { success: true as const, data: { campaignId, eventId } };
}

/** Remove an event from a campaign. */
export async function removeEventFromCampaign(campaignId: string, eventId: string) {
  const { supabase } = await requireInternalUser();

  const { error } = await supabase
    .from("campaign_events")
    .delete()
    .eq("campaign_id", campaignId)
    .eq("event_id", eventId);

  if (error) return { success: false as const, error: "Failed to remove event from campaign" };

  revalidatePath(`/admin/campaigns/${campaignId}`);
  revalidatePath(`/events/${eventId}/campaign`);
  return { success: true as const, data: { campaignId, eventId } };
}

/** Update a campaign's lifecycle status. */
export async function updateCampaignStatus(id: string, status: string) {
  const { supabase } = await requireInternalUser();

  const { error } = await supabase
    .from("campaigns")
    .update({ status })
    .eq("id", id);

  if (error) return { success: false as const, error: "Failed to update campaign status" };

  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${id}`);
  return { success: true as const, data: { id, status } };
}

/** Duplicate an event with new dates/location for campaign rollout. */
export async function duplicateEventForCampaign(
  eventId: string,
  newDates: { start: string; end: string },
  newLocation?: string
) {
  const { supabase } = await requireInternalUser();

  const { data: source, error: fetchError } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (fetchError || !source) {
    return { success: false as const, error: "Source event not found" };
  }

  const { data: newEvent, error: insertError } = await supabase
    .from("events")
    .insert({
      account_id: source.account_id,
      name: `${source.name} (Copy)`,
      event_type: source.event_type,
      package_type: source.package_type,
      machine_type: source.machine_type,
      venue_name: newLocation || source.venue_name,
      venue_address: newLocation ? null : source.venue_address,
      event_date_start: newDates.start,
      event_date_end: newDates.end,
      current_stage: "confirmed",
      health_status: "green",
      template_id: source.template_id,
    })
    .select("id")
    .single();

  if (insertError || !newEvent) {
    return { success: false as const, error: "Failed to duplicate event" };
  }

  revalidatePath("/");
  return { success: true as const, data: { id: newEvent.id } };
}
