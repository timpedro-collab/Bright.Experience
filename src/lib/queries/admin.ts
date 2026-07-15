/** Admin queries — user and account management for internal users. */
import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, paginateQuery, totalPages } from "@/lib/pagination";

export interface AdminProfile {
  id: string;
  name: string | null;
  email: string;
  role: string;
  accountId: string | null;
  accountName: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AdminAccount {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  userCount: number;
  eventCount: number;
}

/** Paginated list of all profiles with optional search and role filter. */
export async function getProfilesPaginated(
  page: number = 1,
  search?: string,
  roleFilter?: string,
): Promise<{ data: AdminProfile[]; totalCount: number; totalPages: number }> {
  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("*, accounts(name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (roleFilter) {
    query = query.eq("role", roleFilter);
  }

  const { data, error, count } = await paginateQuery(query, page);
  if (error || !data) return { data: [], totalCount: 0, totalPages: 1 };

  const total = count ?? 0;
  return {
    data: data.map((row: Record<string, unknown>) => {
      const acct = row.accounts as Record<string, unknown> | null;
      return {
        id: row.id as string,
        name: row.name as string | null,
        email: row.email as string,
        role: row.role as string,
        accountId: row.account_id as string | null,
        accountName: acct?.name as string | null,
        isActive: (row.is_active as boolean) ?? true,
        createdAt: row.created_at as string,
      };
    }),
    totalCount: total,
    totalPages: totalPages(total),
  };
}

/** Paginated list of all accounts with user and event counts. */
export async function getAccountsPaginated(
  page: number = 1,
): Promise<{ data: AdminAccount[]; totalCount: number; totalPages: number }> {
  const supabase = await createClient();

  const { data: accounts, error, count } = await paginateQuery(
    supabase
      .from("accounts")
      .select("*", { count: "exact" })
      .order("name"),
    page,
  );
  if (error || !accounts) return { data: [], totalCount: 0, totalPages: 1 };

  const ids = accounts.map((a: Record<string, unknown>) => a.id as string);

  const [{ data: userCounts }, { data: eventCounts }] = await Promise.all([
    supabase.rpc("count_by_account", { account_ids: ids, table_name: "profiles" }).select("*"),
    supabase.rpc("count_by_account", { account_ids: ids, table_name: "events" }).select("*"),
  ]);

  const userMap: Record<string, number> = {};
  const eventMap: Record<string, number> = {};
  for (const r of userCounts ?? []) {
    userMap[r.account_id as string] = r.cnt as number;
  }
  for (const r of eventCounts ?? []) {
    eventMap[r.account_id as string] = r.cnt as number;
  }

  const total = count ?? 0;
  return {
    data: accounts.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      slug: row.slug as string,
      logoUrl: (row.logo_url as string) ?? null,
      userCount: userMap[row.id as string] ?? 0,
      eventCount: eventMap[row.id as string] ?? 0,
    })),
    totalCount: total,
    totalPages: totalPages(total),
  };
}

export interface AccountDetail {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  createdAt: string | null;
  users: { id: string; name: string | null; email: string; role: string; isActive: boolean }[];
  events: {
    id: string;
    name: string;
    currentStage: string;
    healthStatus: string;
    eventDateStart: string;
  }[];
}

/** Full detail for one account — profile, its users, and its events. */
export async function getAccountDetail(
  accountId: string,
): Promise<AccountDetail | null> {
  const supabase = await createClient();

  const { data: account, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", accountId)
    .maybeSingle();
  if (error || !account) return null;

  const [{ data: users }, { data: events }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, email, role, is_active")
      .eq("account_id", accountId)
      .order("created_at", { ascending: true }),
    supabase
      .from("events")
      .select("id, name, current_stage, health_status, event_date_start")
      .eq("account_id", accountId)
      .order("event_date_start", { ascending: false }),
  ]);

  const acct = account as Record<string, unknown>;
  return {
    id: acct.id as string,
    name: acct.name as string,
    slug: acct.slug as string,
    logoUrl: (acct.logo_url as string) ?? null,
    createdAt: (acct.created_at as string) ?? null,
    users: (users ?? []).map((u: Record<string, unknown>) => ({
      id: u.id as string,
      name: u.name as string | null,
      email: u.email as string,
      role: u.role as string,
      isActive: (u.is_active as boolean) ?? true,
    })),
    events: (events ?? []).map((e: Record<string, unknown>) => ({
      id: e.id as string,
      name: e.name as string,
      currentStage: e.current_stage as string,
      healthStatus: e.health_status as string,
      eventDateStart: e.event_date_start as string,
    })),
  };
}

/** Simple account list (no pagination) for lightweight dropdowns. */
export async function getAccountsList(): Promise<
  Array<{ id: string; name: string; slug: string }>
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("accounts")
    .select("id, name, slug")
    .order("name")
    .limit(200);
  return (data ?? []) as Array<{ id: string; name: string; slug: string }>;
}

/** id + name only — invite / new-event dropdowns. */
export async function getAccountOptions(): Promise<
  Array<{ id: string; name: string }>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("id, name")
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data.map((a) => ({ id: String(a.id), name: String(a.name) }));
}

/** Lightweight account name/slug for profile settings. */
export async function getAccountNameSlug(
  accountId: string,
): Promise<{ name: string; slug: string } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("name, slug")
    .eq("id", accountId)
    .single();

  if (error || !data) return null;
  return { name: String(data.name), slug: String(data.slug) };
}
