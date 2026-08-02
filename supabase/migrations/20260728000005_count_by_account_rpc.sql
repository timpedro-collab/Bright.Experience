-- ============================================================
-- count_by_account RPC
-- ============================================================
--
-- `getAdminAccounts` (src/lib/queries/admin.ts) has always called
-- `supabase.rpc("count_by_account", ...)` to fetch per-account user and event
-- counts in two round-trips instead of 2N. The function was never created —
-- against real Postgres both calls return PGRST202 ("function not found"), the
-- error is swallowed, and every account on /admin/accounts shows 0 users and
-- 0 events. Mock mode answered the call, which is why it looked fine.
--
-- SECURITY INVOKER (the default) is deliberate: the counts must respect the
-- caller's RLS, so a non-internal caller can only ever count rows they were
-- already allowed to see.
--
-- `table_name` is matched against a fixed set rather than interpolated into
-- dynamic SQL. A `format('select ... from %I', table_name)` would work but
-- would also turn a caller-supplied string into a table reference, and this
-- function is reachable over PostgREST by any authenticated user.

create or replace function public.count_by_account(
  account_ids uuid[],
  table_name text
)
returns table (account_id uuid, cnt bigint)
language plpgsql
stable
set search_path = public
as $$
begin
  if table_name = 'profiles' then
    return query
      select p.account_id, count(*)::bigint as cnt
      from profiles p
      where p.account_id = any(account_ids)
      group by p.account_id;
  elsif table_name = 'events' then
    return query
      select e.account_id, count(*)::bigint as cnt
      from events e
      where e.account_id = any(account_ids)
      group by e.account_id;
  else
    raise exception 'count_by_account: unsupported table %', table_name
      using errcode = '22023';
  end if;
end;
$$;

comment on function public.count_by_account(uuid[], text) is
  'Per-account row counts for profiles or events, honouring the caller''s RLS.';

grant execute on function public.count_by_account(uuid[], text) to authenticated;
revoke execute on function public.count_by_account(uuid[], text) from anon;

create index if not exists idx_profiles_account_id on profiles(account_id);
