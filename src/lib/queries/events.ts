import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, paginateQuery, totalPages } from "@/lib/pagination";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import type { Event } from "@/types";
import { logQueryError } from "@/lib/observability/log-query-error";
import {
  anyOf,
  ilikeContains,
  inList,
  isEmptySearch,
} from "@/lib/queries/filters";
import { findAccountIdsByName } from "@/lib/queries/accounts";

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
    healthOverride: (row.health_override as boolean | null) ?? false,
    healthReason: (row.health_reason as string | null) ?? undefined,
    pipedriveDealId: (row.pipedrive_deal_id as string | null) ?? undefined,
    pipedriveLinkedAt: (row.pipedrive_linked_at as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Fetch all events (unpaginated) — used by the home page editorial view. */
export async function getEvents(): Promise<Event[]> {
  const supabase = await createClient();
  // Mirror the account scope production RLS enforces: customers only ever see
  // their own account's events. The mock client does no scoping, so apply it
  // explicitly here for environment parity.
  const user = await getUser();
  const scopeAccountId =
    user && !isInternalRole(user.role) ? user.accountId : null;
  let query = supabase
    .from("events")
    .select("*, accounts(*)")
    .order("event_date_start");
  if (scopeAccountId) query = query.eq("account_id", scopeAccountId);

  const { data, error } = await query;
  if (error || !data) {
    logQueryError("getEvents", error);
    return [];
  }
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
  // The search covers the event name OR the customer's name, which live in two
  // tables. PostgREST cannot OR across an embedded resource — `accounts.name`
  // inside a top-level `or=` is not a column it can resolve, and the whole
  // filter is rejected — so resolve the matching accounts first and search
  // events by their ids.
  const searchAccountIds = filters?.q
    ? await findAccountIdsByName(supabase, filters.q)
    : [];

  const needsAccountFilter = Boolean(filters?.account);
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
  if (filters?.q && !isEmptySearch(filters.q)) {
    query = query.or(
      anyOf(
        ilikeContains("name", filters.q),
        searchAccountIds.length > 0
          ? inList("account_id", searchAccountIds)
          : ""
      )
    );
  }
  if (filters?.account) query = query.eq("accounts.name", filters.account);

  const { data, error, count } = await paginateQuery(query, page, pageSize);
  if (error || !data) {
    logQueryError("getEventsPaginated", error);
    return { data: [], totalCount: 0, totalPages: 1 };
  }

  const total = count ?? 0;
  return { data: data.map(mapEvent), totalCount: total, totalPages: totalPages(total, pageSize) };
}

export async function getEventById(id: string): Promise<Event | null> {
  const supabase = await createClient();
  // A customer must never resolve another account's event by guessing its id.
  // Production enforces this via RLS; the mock client doesn't, so we mirror the
  // same account scope here (matching getEventsPaginated) for parity. Internal
  // roles are unscoped and can open any event.
  const user = await getUser();
  const scopeAccountId =
    user && !isInternalRole(user.role) ? user.accountId : null;
  let query = supabase.from("events").select("*, accounts(*)").eq("id", id);
  if (scopeAccountId) query = query.eq("account_id", scopeAccountId);

  const { data, error } = await query.maybeSingle();
  if (error || !data) {
    logQueryError("getEventById", error, { id });
    return null;
  }
  return mapEvent(data);
}
