import { createClient } from "@/lib/supabase/server";
import type { StudioRequest } from "@/types";

function mapRequest(row: Record<string, unknown>): StudioRequest {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    serviceType: row.service_type as StudioRequest["serviceType"],
    title: row.title as string,
    description: (row.description as string) ?? undefined,
    estimatedCost: (row.estimated_cost as number) ?? undefined,
    estimatedDays: (row.estimated_days as number) ?? undefined,
    status: row.status as StudioRequest["status"],
    quotedCost: (row.quoted_cost as number) ?? undefined,
    quotedDays: (row.quoted_days as number) ?? undefined,
    approvedBy: (row.approved_by as string) ?? undefined,
    approvedAt: (row.approved_at as string) ?? undefined,
    deliveredAt: (row.delivered_at as string) ?? undefined,
    customerVisible: row.customer_visible as boolean,
    createdBy: (row.created_by as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export async function getStudioRequestsByEvent(
  eventId: string
): Promise<StudioRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("studio_requests")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(mapRequest);
}

export interface StudioRequestWithContext extends StudioRequest {
  eventName: string;
  accountName: string;
  createdByName?: string;
}

export async function getAllStudioRequests(): Promise<
  StudioRequestWithContext[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("studio_requests")
    .select(
      "*, events(name, accounts(name)), creator:profiles!studio_requests_created_by_fkey(name)"
    )
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const event = row.events as Record<string, unknown> | null;
    const account = event?.accounts as Record<string, unknown> | null;
    const creator = row.creator as Record<string, unknown> | null;
    return {
      ...mapRequest(row),
      eventName: (event?.name as string) ?? "Unknown Event",
      accountName: (account?.name as string) ?? "Unknown Account",
      createdByName: (creator?.name as string) ?? undefined,
    };
  });
}
