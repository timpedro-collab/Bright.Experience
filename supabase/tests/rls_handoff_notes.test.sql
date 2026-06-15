-- =====================================================================
-- RLS: handoff_notes (internal-only operational notes)
--
-- Verifies:
--   1. Internal user sees handoff notes
--   2. Internal user can insert a handoff note
--   3. Customer sees no handoff notes (internal-only)
--   4. Anonymous user gets no rows
-- =====================================================================

begin;
\ir _fixtures.psql

insert into handoff_notes (id, event_id, from_stage, to_stage, author_id, whats_done) values
  ('00000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-0000000000e1', 'briefing', 'production', '00000000-0000-4000-8000-000000000011', 'Brief locked'),
  ('00000000-0000-4000-8000-000000000802', '00000000-0000-4000-8000-0000000000e2', 'briefing', 'production', '00000000-0000-4000-8000-000000000011', 'Brief locked')
on conflict (id) do nothing;

select plan(4);

-- (1) Internal user sees handoff notes
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select cmp_ok(
  (select count(*)::int from handoff_notes),
  '>=', 2,
  'internal user sees handoff notes'
);

-- (2) Internal user can insert
insert into handoff_notes (event_id, from_stage, to_stage, author_id, whats_done)
values ('00000000-0000-4000-8000-0000000000e1', 'production', 'qa', '00000000-0000-4000-8000-000000000011', 'Assets approved');
select cmp_ok(
  (select count(*)::int from handoff_notes),
  '>=', 3,
  'internal user can insert handoff note'
);

-- (3) Customer sees no handoff notes
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select count(*)::int from handoff_notes),
  0,
  'customer sees no handoff notes'
);

-- (4) Anon gets no rows
select _rls_test_anon();
select is(
  (select count(*)::int from handoff_notes),
  0,
  'anon sees no handoff notes'
);

select * from finish();
rollback;
