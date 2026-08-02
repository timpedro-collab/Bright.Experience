-- =====================================================================
-- count_by_account (20260728000005_count_by_account_rpc)
--
-- Backs the per-account user/event counts on /admin/accounts. Before this
-- function existed the RPC returned PGRST202 and every account showed zero.
--
-- Verifies:
--   1. Counts profiles per account
--   2. Counts events per account
--   3. Omits accounts with no rows rather than returning zero rows for them
--   4. Ignores account ids that were not asked for
--   5. Rejects an unexpected table name instead of interpolating it
--   6. Respects the caller's RLS — a customer cannot count another tenant
-- =====================================================================

begin;
\ir _fixtures.psql

select plan(6);

-- (1) Profiles: two internal users have no account, Casey is the only Acme one.
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  (select cnt::int from count_by_account(
    array['00000000-0000-4000-8000-0000000000a1']::uuid[], 'profiles'
  )),
  1,
  'counts profiles for the account'
);

-- (2) Events: one fixture event per account.
select is(
  (select cnt::int from count_by_account(
    array['00000000-0000-4000-8000-0000000000a2']::uuid[], 'events'
  )),
  1,
  'counts events for the account'
);

-- (3) An account with nothing simply does not appear, which is why the caller
-- defaults to 0 when building its lookup map.
select is(
  (select count(*)::int from count_by_account(
    array['00000000-0000-4000-8000-00000000dead']::uuid[], 'profiles'
  )),
  0,
  'accounts with no rows are omitted'
);

-- (4) Only the requested accounts come back.
select results_eq(
  $$select account_id from count_by_account(
      array['00000000-0000-4000-8000-0000000000a1']::uuid[], 'events'
    )$$,
  $$values ('00000000-0000-4000-8000-0000000000a1'::uuid)$$,
  'returns only the requested accounts'
);

-- (5) A table name outside the allowlist is an error, not dynamic SQL.
select throws_ok(
  $$select * from count_by_account(
      array['00000000-0000-4000-8000-0000000000a1']::uuid[], 'auth.users'
    )$$,
  '22023',
  null,
  'rejects an unsupported table name'
);

-- (6) SECURITY INVOKER: OtherCo's admin cannot count Acme.
select _rls_test_as('00000000-0000-4000-8000-000000000021');
select is(
  (select count(*)::int from count_by_account(
    array['00000000-0000-4000-8000-0000000000a1']::uuid[], 'events'
  )),
  0,
  'a customer cannot count another tenant'
);

select * from finish();
rollback;
