-- =====================================================================
-- RLS: notifications
--
-- Verifies:
--   1. users see ONLY their own notifications
--   2. internal users see every notification
--   3. users can mark their own as read
-- =====================================================================

begin;
\ir _fixtures.psql

insert into notifications (id, user_id, event_id, type, title, kind, action_required, is_read) values
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-0000000000e1', 'stage_change', 'For Casey', 'stage.changed', false, false),
  ('00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-0000000000e2', 'stage_change', 'For Sam',   'stage.changed', false, false),
  ('00000000-0000-4000-8000-0000000000c3', '00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-0000000000e1', 'stage_change', 'For AE',    'stage.changed', false, false)
on conflict (id) do nothing;

select plan(4);

-- Casey only sees her own row
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select array_agg(id order by id)::uuid[] from notifications),
  array['00000000-0000-4000-8000-0000000000c1'::uuid],
  'customer sees only their own notifications'
);

-- Casey can mark her own as read
update notifications set is_read = true where id = '00000000-0000-4000-8000-0000000000c1';
select is(
  (select is_read from notifications where id = '00000000-0000-4000-8000-0000000000c1'),
  true,
  'customer can mark own notification read'
);

-- Sam from OtherCo cannot see Casey's notification
select _rls_test_as('00000000-0000-4000-8000-000000000021');
select is(
  (select count(*)::int from notifications where id = '00000000-0000-4000-8000-0000000000c1'),
  0,
  'cross-account customer cannot see foreign notification'
);

-- Internal user sees all three
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  (select count(*)::int from notifications),
  3,
  'internal user sees every notification'
);

select * from finish();
rollback;
