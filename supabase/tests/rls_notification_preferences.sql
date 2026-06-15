-- =====================================================================
-- RLS: notification_preferences
--
-- Verifies:
--   1. users see only their own preferences
--   2. users can write their own preferences (any kind)
--   3. users cannot write preferences for someone else
-- =====================================================================

begin;
\ir _fixtures.psql

insert into notification_preferences (user_id, kind, in_portal, email_mode)
values
  ('00000000-0000-4000-8000-000000000020', 'stage.changed', true, 'immediate'),
  ('00000000-0000-4000-8000-000000000021', 'stage.changed', true, 'immediate');

select plan(4);

-- Casey sees only her row
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select count(*)::int from notification_preferences),
  1,
  'user sees only their own preference rows'
);

-- Casey can update her own row
update notification_preferences set email_mode = 'off'
  where user_id = '00000000-0000-4000-8000-000000000020' and kind = 'stage.changed';
select is(
  (select email_mode from notification_preferences
    where user_id = '00000000-0000-4000-8000-000000000020' and kind = 'stage.changed'),
  'off',
  'user can update their own preferences'
);

-- Casey cannot insert a row impersonating Sam
prepare bad_insert as
  insert into notification_preferences(user_id, kind, in_portal, email_mode)
  values ('00000000-0000-4000-8000-000000000021', 'forged.kind', true, 'immediate');
select throws_ok(
  'execute bad_insert',
  '42501',
  null,
  'cross-user insert is rejected by RLS'
);
deallocate bad_insert;

-- Internal user can read both
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  (select count(*)::int from notification_preferences),
  2,
  'internal user sees every preference row'
);

select * from finish();
rollback;
