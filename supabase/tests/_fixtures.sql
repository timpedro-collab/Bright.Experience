-- =====================================================================
-- Bright.Experience — RLS test fixtures (pgTAP).
--
-- This file isn't a test on its own; the per-table test files include
-- it via `\i` so they all share a known seed of accounts + users +
-- events + child rows. Every fixture row uses a deterministic UUID so
-- assertions can reference them by literal.
--
-- Personas:
--   user_admin          → internal `admin`              (00000000-0000-4000-8000-000000000010)
--   user_events_lead    → internal `events_lead`        (00000000-0000-4000-8000-000000000011)
--   user_creative_lead  → internal `creative_lead`      (00000000-0000-4000-8000-000000000012)
--   user_customer_admin → customer_admin @ Acme         (00000000-0000-4000-8000-000000000020)
--   user_customer_other → customer_admin @ OtherCo      (00000000-0000-4000-8000-000000000021)
--
-- Accounts:
--   acc_acme  (00000000-0000-4000-8000-0000000000a1)
--   acc_other (00000000-0000-4000-8000-0000000000a2)
--
-- Events:
--   evt_acme  (account=acme)  (00000000-0000-4000-8000-0000000000e1)
--   evt_other (account=other) (00000000-0000-4000-8000-0000000000e2)
-- =====================================================================

-- Disable email confirmation for fixture inserts into auth.users
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, instance_id, aud, role)
values
  ('00000000-0000-4000-8000-000000000010', 'admin@brightblue.test', '', now(), '{}', now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-000000000011', 'ae@brightblue.test',    '', now(), '{}', now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-000000000012', 'creative@brightblue.test', '', now(), '{}', now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-000000000020', 'casey@acme.test',       '', now(), '{}', now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-000000000021', 'sam@other.test',        '', now(), '{}', now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
on conflict (id) do nothing;

insert into accounts (id, name, slug) values
  ('00000000-0000-4000-8000-0000000000a1', 'Acme',   'acme'),
  ('00000000-0000-4000-8000-0000000000a2', 'OtherCo', 'other')
on conflict (id) do nothing;

insert into profiles (id, name, email, role, account_id, is_active) values
  ('00000000-0000-4000-8000-000000000010', 'Admin',          'admin@brightblue.test',    'admin',          null,                                       true),
  ('00000000-0000-4000-8000-000000000011', 'AE',             'ae@brightblue.test',       'events_lead',    null,                                       true),
  ('00000000-0000-4000-8000-000000000012', 'Creative',       'creative@brightblue.test', 'creative_lead',  null,                                       true),
  ('00000000-0000-4000-8000-000000000020', 'Casey Customer', 'casey@acme.test',          'customer_admin', '00000000-0000-4000-8000-0000000000a1',     true),
  ('00000000-0000-4000-8000-000000000021', 'Sam Other',      'sam@other.test',           'customer_admin', '00000000-0000-4000-8000-0000000000a2',     true)
on conflict (id) do nothing;

insert into events (id, account_id, name, event_type, event_date_start, created_by) values
  ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000a1', 'Acme Spring',   'activation', '2026-06-15', '00000000-0000-4000-8000-000000000011'),
  ('00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-0000000000a2', 'Other Summer',  'activation', '2026-07-01', '00000000-0000-4000-8000-000000000011')
on conflict (id) do nothing;

-- Helper to switch the active JWT in tests.
create or replace function _rls_test_as(user_id uuid)
returns void as $$
begin
  -- Use the same claim shape Supabase's JWT verifier produces.
  perform set_config('request.jwt.claims', json_build_object('sub', user_id::text, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$ language plpgsql;

create or replace function _rls_test_anon()
returns void as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
end;
$$ language plpgsql;
