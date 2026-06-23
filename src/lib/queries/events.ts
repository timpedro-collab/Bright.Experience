import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, paginateQuery, totalPages } from "@/lib/pagination";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
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

/** Fetch all events (unpaginated) — used by the home page editorial view. */
export async function getEvents(): Promise<Event[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*, accounts(*)")
    .order("event_date_start");

  if (error || !data) return [];
  return data.map(mapEvent);
}

export interface EventFilters {
  q?: string;
  stage?: string;
  health?: string;
  /** Filter by customer account name. */
  account?: string;
}

/** Paginated event list for admin / library views, with optional filters. */
export async function getEventsPaginated(
  page: number = 1,
  pageSize: number = PAGE_SIZE,
  filters?: EventFilters,
): Promise<{ data: Event[]; totalCount: number; totalPages: number }> {
  const supabase = await createClient();
  // Customer roles only ever see their own account's events. In production this
  // is enforced by Supabase RLS; the mock client does no scoping, so we apply
  // the same constraint explicitly here to keep the two environments in sync.
  const user = await getUser();
  const scopeAccountId =
    user && !isInternalRole(user.role) ? user.accountId : null;
  // Inner-join accounts so account-name filters (search + account picker)
  // actually constrain the result set rather than just nulling the embed.
  const needsAccountFilter = Boolean(filters?.q || filters?.account);
  let query = supabase
    .from("events")
    .select(
      needsAccountFilter ? "*, accounts!inner(*)" : "*, accounts(*)",
      { count: "exact" },
    )
    .order("event_date_start");

  if (scopeAccountId) query = query.eq("account_id", scopeAccountId);
  if (filters?.stage) query = query.eq("current_stage", filters.stage);
  if (filters?.health) query = query.eq("health_status", filters.health);
  if (filters?.q) query = query.or(`name.ilike.%${filters.q}%,accounts.name.ilike.%${filters.q}%`);
  if (filters?.account) query = query.eq("accounts.name", filters.account);

  const { data, error, count } = await paginateQuery(query, page, pageSize);
  if (error || !data) return { data: [], totalCount: 0, totalPages: 1 };

  const total = count ?? 0;
  return { data: data.map(mapEvent), totalCount: total, totalPages: totalPages(total, pageSize) };
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
