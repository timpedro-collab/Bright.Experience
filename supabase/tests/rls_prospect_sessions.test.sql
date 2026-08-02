-- =====================================================================
-- RLS: prospect_sessions (post 20260728000003_prospect_sessions_read_scope)
--
-- "Public read own prospect session" was `using (true)`, exposing every
-- prospect's email address and session token to anonymous callers.
--
-- Verifies:
--   1. Anonymous callers read nothing
--   2. A signed-in customer reads nothing
--   3. Internal staff still read the table
--   4. The anonymous funnel can still record a session (INSERT kept)
--   5. No unconditional SELECT policy remains on the table
-- =====================================================================

begin;
\ir _fixtures.psql

insert into prospect_sessions (id, session_token, contact_email) values
  ('00000000-0000-4000-8000-000000000901', 'tok-prospect-1', 'prospect@lead.test')
on conflict (id) do nothing;

select plan(5);

-- (1) Anon
select _rls_test_anon();
select is(
  (select count(*)::int from prospect_sessions),
  0,
  'anon reads no prospect sessions'
);

-- (2) Signed-in customer
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select count(*)::int from prospect_sessions),
  0,
  'a customer reads no prospect sessions'
);

-- (3) Internal staff
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  (select count(*)::int from prospect_sessions
    where id = '00000000-0000-4000-8000-000000000901'),
  1,
  'internal staff still read prospect sessions'
);

-- (4) The public funnel insert still works
select _rls_test_anon();
select lives_ok(
  $$insert into prospect_sessions (session_token, contact_email)
    values ('tok-prospect-2', 'new@lead.test')$$,
  'the anonymous funnel can still record a session'
);

-- (5) Nothing world-readable left behind
reset role;
select is(
  (select count(*)::int from pg_policies
    where schemaname = 'public'
      and tablename = 'prospect_sessions'
      and cmd = 'SELECT'
      and qual = 'true'),
  0,
  'no unconditional SELECT policy remains on prospect_sessions'
);

select * from finish();
rollback;
