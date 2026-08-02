-- =====================================================================
-- RLS: the account-scoped and self-scoped tables.
--
-- campaigns, campaign_events, client_compliance_requirements,
-- account_payment_preferences, api_keys, webhook_subscriptions and
-- notification_user_settings are keyed on an account, a partner, or the
-- user themself rather than on an event, so they need their own cover.
--
-- The two that matter most are api_keys and webhook_subscriptions: the
-- rows hold a credential hash and a signing secret, so a broken policy
-- there hands one tenant another tenant's integration credentials.
-- account_payment_preferences holds finance contact details.
-- =====================================================================

begin;
\ir _fixtures.psql

insert into campaigns (id, account_id, name, status) values
  ('00000000-0000-4000-8000-000000000b01', '00000000-0000-4000-8000-0000000000a1', 'Acme summer tour', 'active'),
  ('00000000-0000-4000-8000-000000000b02', '00000000-0000-4000-8000-0000000000a2', 'Other roadshow',   'active')
on conflict (id) do nothing;

insert into campaign_events (id, campaign_id, event_id) values
  ('00000000-0000-4000-8000-000000000b03', '00000000-0000-4000-8000-000000000b01', '00000000-0000-4000-8000-0000000000e1'),
  ('00000000-0000-4000-8000-000000000b04', '00000000-0000-4000-8000-000000000b02', '00000000-0000-4000-8000-0000000000e2')
on conflict (id) do nothing;

insert into client_compliance_requirements (id, account_id, document_type) values
  ('00000000-0000-4000-8000-000000000b05', '00000000-0000-4000-8000-0000000000a1', 'insurance_pl'),
  ('00000000-0000-4000-8000-000000000b06', '00000000-0000-4000-8000-0000000000a2', 'insurance_pl')
on conflict (id) do nothing;

insert into account_payment_preferences (id, account_id, finance_contact_email) values
  ('00000000-0000-4000-8000-000000000b07', '00000000-0000-4000-8000-0000000000a1', 'finance@acme.test'),
  ('00000000-0000-4000-8000-000000000b08', '00000000-0000-4000-8000-0000000000a2', 'finance@other.test')
on conflict (id) do nothing;

insert into api_keys (id, account_id, partner_id, name, key_hash, key_prefix) values
  ('00000000-0000-4000-8000-000000000b09', '00000000-0000-4000-8000-0000000000a1', null, 'Acme key',  'hash-acme',  'bb_acme'),
  ('00000000-0000-4000-8000-000000000b0a', '00000000-0000-4000-8000-0000000000a2', null, 'Other key', 'hash-other', 'bb_other'),
  ('00000000-0000-4000-8000-000000000b0b', null, '00000000-0000-4000-8000-0000000000b1', 'North key', 'hash-north', 'bb_north')
on conflict (id) do nothing;

insert into webhook_subscriptions (id, account_id, partner_id, url, secret) values
  ('00000000-0000-4000-8000-000000000b0c', '00000000-0000-4000-8000-0000000000a1', null, 'https://acme.test/hook',  'whsec_acme'),
  ('00000000-0000-4000-8000-000000000b0d', '00000000-0000-4000-8000-0000000000a2', null, 'https://other.test/hook', 'whsec_other')
on conflict (id) do nothing;

insert into notification_user_settings (user_id, digest_hour) values
  ('00000000-0000-4000-8000-000000000020', 7),
  ('00000000-0000-4000-8000-000000000021', 8)
on conflict (user_id) do nothing;

select plan(14);

-- ── (1-7) The Acme customer sees their account's rows and no others ──
select _rls_test_as('00000000-0000-4000-8000-000000000020');

select is(
  (select count(*)::int from campaigns where id in ('00000000-0000-4000-8000-000000000b01','00000000-0000-4000-8000-000000000b02')),
  1, 'a customer sees their own campaigns only');

select is(
  (select count(*)::int from campaign_events where id in ('00000000-0000-4000-8000-000000000b03','00000000-0000-4000-8000-000000000b04')),
  1, 'a customer sees their own campaign events only');

select is(
  (select count(*)::int from client_compliance_requirements where id in ('00000000-0000-4000-8000-000000000b05','00000000-0000-4000-8000-000000000b06')),
  1, 'a customer sees their own compliance requirements only');

select is(
  (select count(*)::int from account_payment_preferences where id in ('00000000-0000-4000-8000-000000000b07','00000000-0000-4000-8000-000000000b08')),
  1, 'a customer sees their own payment preferences only');

select is(
  (select count(*)::int from api_keys where id in ('00000000-0000-4000-8000-000000000b09','00000000-0000-4000-8000-000000000b0a','00000000-0000-4000-8000-000000000b0b')),
  1, 'a customer sees their own API keys only — never another tenant''s key hash');

select is(
  (select count(*)::int from webhook_subscriptions where id in ('00000000-0000-4000-8000-000000000b0c','00000000-0000-4000-8000-000000000b0d')),
  1, 'a customer sees their own webhook subscriptions only — never another tenant''s secret');

select is(
  (select count(*)::int from notification_user_settings where user_id in ('00000000-0000-4000-8000-000000000020','00000000-0000-4000-8000-000000000021')),
  1, 'a user sees only their own notification timing');

-- ── (8-9) Self-scoped writes ─────────────────────────────────────────
select lives_ok(
  $$update notification_user_settings set digest_hour = 6
     where user_id = '00000000-0000-4000-8000-000000000020'$$,
  'a user can change their own notification timing');

with changed as (
  update notification_user_settings set digest_hour = 23
   where user_id = '00000000-0000-4000-8000-000000000021'
   returning 1
)
select is(
  (select count(*)::int from changed),
  0,
  'a user cannot change someone else''s notification timing');

-- ── (10) A partner sees the key issued to their partner org ──────────
select _rls_test_as('00000000-0000-4000-8000-000000000030');
select is(
  (select count(*)::int from api_keys where id in ('00000000-0000-4000-8000-000000000b09','00000000-0000-4000-8000-000000000b0a','00000000-0000-4000-8000-000000000b0b')),
  1, 'a partner sees only the API key issued to their partner org');

-- ── (11-13) Internal staff see everything ────────────────────────────
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  (select count(*)::int from campaigns where id in ('00000000-0000-4000-8000-000000000b01','00000000-0000-4000-8000-000000000b02')),
  2, 'internal staff see campaigns across accounts');
select is(
  (select count(*)::int from api_keys where id in ('00000000-0000-4000-8000-000000000b09','00000000-0000-4000-8000-000000000b0a','00000000-0000-4000-8000-000000000b0b')),
  3, 'internal staff see every API key');
select is(
  (select count(*)::int from account_payment_preferences where id in ('00000000-0000-4000-8000-000000000b07','00000000-0000-4000-8000-000000000b08')),
  2, 'internal staff see payment preferences across accounts');

-- ── (14) Anonymous callers get nothing ───────────────────────────────
select _rls_test_anon();
select is(
  (select
     (select count(*) from campaigns)
   + (select count(*) from campaign_events)
   + (select count(*) from client_compliance_requirements)
   + (select count(*) from account_payment_preferences)
   + (select count(*) from api_keys)
   + (select count(*) from webhook_subscriptions)
   + (select count(*) from notification_user_settings))::int,
  0,
  'anon reads nothing from the account-scoped tables');

select * from finish();
rollback;
