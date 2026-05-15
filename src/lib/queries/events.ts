import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/types";

function mapEvent(row: Record<string, unknown>): Event {
  const account = row.accounts as Record<string, unknown> | null;
  return {
    id: row.id as string,
    accountId: row.account_id as string,
    account: account
      ? {
          id: account.id as string,
          name: account.name as string,
          slug: account.slug as string,
          logoUrl: account.logo_url as string | undefined,
        }
      : { id: row.account_id as string, name: "", slug: "" },
    name: row.name as string,
    eventType: row.event_type as Event["eventType"],
    packageType: row.package_type as Event["packageType"],
    machineType: row.machine_type as string | undefined,
    venueName: row.venue_name as string | undefined,
    venueAddress: row.venue_address as string | undefined,
    eventDateStart: row.event_date_start as string,
    eventDateEnd: row.event_date_end as string | undefined,
    setupDate: row.setup_date as string | undefined,
    collectionDate: row.collection_date as string | undefined,
    currentStage: row.current_stage as Event["currentStage"],
    healthStatus: row.health_status as Event["healthStatus"],
    pipedriveDealId: (row.pipedrive_deal_id as string | null) ?? undefined,
    pipedriveLinkedAt: (row.pipedrive_linked_at as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getEvents(): Promise<Event[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*, accounts(*)")
    .order("event_date_start");

  if (error || !data) return [];
  return data.map(mapEvent);
}

export async function getEventById(id: string): Promise<Event | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*, accounts(*)")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapEvent(data);
}
