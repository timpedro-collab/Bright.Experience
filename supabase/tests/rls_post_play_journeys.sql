-- =====================================================================
-- RLS: post_play_journeys + journey_touches (Stage 5)
--
-- Verifies:
--   1. internal users manage journeys
--   2. customers see journeys on their own events only
--   3. customers cannot create journeys (internal-configured)
--   4. customers see journey touches for their own events only
--   5. customers cannot fabricate journey touches
-- =====================================================================

begin;
\ir _fixtures.psql

insert into post_play_journeys (id, event_id, kind, headline, cta_label, cta_url, is_active) values
  ('00000000-0000-4000-8000-0000000000d6', '00000000-0000-4000-8000-0000000000e1', 'discount', 'Your 10% code', 'Shop now', 'https://example.com/shop', true),
  ('00000000-0000-4000-8000-0000000000d7', '00000000-0000-4000-8000-0000000000e2', 'review',   'Rate the game', 'Review',   'https://example.com/review', true)
on conflict (id) do nothing;

insert into leads (id, event_id, contact_email) values
  ('00000000-0000-4000-8000-0000000000d8', '00000000-0000-4000-8000-0000000000e1', 'player@acme.test'),
  ('00000000-0000-4000-8000-0000000000d9', '00000000-0000-4000-8000-0000000000e2', 'player@other.test')
on conflict (id) do nothing;

insert into journey_touches (journey_id, lead_id, touch) values
  ('00000000-0000-4000-8000-0000000000d6', '00000000-0000-4000-8000-0000000000d8', 'sent'),
  ('00000000-0000-4000-8000-0000000000d7', '00000000-0000-4000-8000-0000000000d9', 'sent')
on conflict do nothing;

select plan(5);

-- 1. Internal sees both journeys
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  (select count(*)::int from post_play_journeys where id in (
    '00000000-0000-4000-8000-0000000000d6',
    '00000000-0000-4000-8000-0000000000d7')),
  2,
  'internal user sees every journey'
);

-- 2. Acme customer sees only the Acme event journey
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select array_agg(id)::uuid[] from post_play_journeys where id in (
    '00000000-0000-4000-8000-0000000000d6',
    '00000000-0000-4000-8000-0000000000d7')),
  array['00000000-0000-4000-8000-0000000000d6'::uuid],
  'customer sees journeys on their own events only'
);

-- 3. Customers cannot create journeys
select throws_ok(
  $$insert into post_play_journeys (event_id, kind, headline, cta_label, cta_url)
    values ('00000000-0000-4000-8000-0000000000e1', 'review', 'X', 'Y', 'https://z.test')$$,
  '42501',
  'new row violates row-level security policy for table "post_play_journeys"',
  'customer cannot create a journey'
);

-- 4. Acme customer sees only their event's touches
select is(
  (select count(*)::int from journey_touches where journey_id in (
    '00000000-0000-4000-8000-0000000000d6',
    '00000000-0000-4000-8000-0000000000d7')),
  1,
  'customer sees journey touches for their own events only'
);

-- 5. Customers cannot fabricate touches
select throws_ok(
  $$insert into journey_touches (journey_id, lead_id, touch)
    values ('00000000-0000-4000-8000-0000000000d6', '00000000-0000-4000-8000-0000000000d8', 'redeemed')$$,
  '42501',
  'new row violates row-level security policy for table "journey_touches"',
  'customer cannot fabricate a journey touch'
);

select * from finish();
rollback;
