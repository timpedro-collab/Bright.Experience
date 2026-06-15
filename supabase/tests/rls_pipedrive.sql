-- =====================================================================
-- RLS: pipedrive_outbox + pipedrive_config
--
-- Both tables hold secrets / write-back queue rows and must be hidden
-- from customers entirely.
-- =====================================================================

begin;
\ir _fixtures.psql

insert into pipedrive_outbox (id, event_id, kind, payload, deal_id) values
  ('00000000-0000-4000-8000-0000000000a3', '00000000-0000-4000-8000-0000000000e1', 'note', '{"note":"hello"}'::jsonb, '123')
on conflict (id) do nothing;

update pipedrive_config set api_token = 'secret' where id = 1;

select plan(4);

-- (1) Customer cannot see outbox rows
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select count(*)::int from pipedrive_outbox),
  0,
  'customer cannot see any pipedrive_outbox rows'
);

-- (2) Customer cannot see pipedrive_config
select is(
  (select count(*)::int from pipedrive_config),
  0,
  'customer cannot see pipedrive_config rows'
);

-- (3) Internal user can see outbox row
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  (select count(*)::int from pipedrive_outbox),
  1,
  'internal user can read pipedrive_outbox'
);

-- (4) Internal user can see config row
select is(
  (select api_token from pipedrive_config where id = 1),
  'secret',
  'internal user can read pipedrive_config'
);

select * from finish();
rollback;
