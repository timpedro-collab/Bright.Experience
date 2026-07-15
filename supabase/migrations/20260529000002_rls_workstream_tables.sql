-- Row Level Security for the Workstream 1-10 tables.
--
-- The May 28 workstream migrations created these tables without RLS, which
-- (with Supabase's default grants) exposes every row to any authenticated
-- client across all accounts. This migration brings them in line with the
-- project convention established in 20260403000000_initial_schema.sql:
--   - internal staff (is_internal_user()) get full access
--   - customers are scoped to their own account's events via user_account_id()
--   - writes use WITH CHECK so rows can't be inserted/updated out of scope
--
-- Helper functions used (defined in initial schema):
--   is_internal_user()  -> true for events_lead/creative_lead/operations_lead/
--                          qa_lead/developer/admin
--   user_account_id()   -> the caller's profiles.account_id

-- ============================================================
-- Compliance: shared document exchange.
-- Either side can add/see documents on their own event; internal
-- staff manage everything. Customers can upload and update their own
-- event's documents (but the formal review fields are internal-driven).
-- ============================================================
alter table compliance_documents enable row level security;

create policy "Internal full access on compliance_documents"
  on compliance_documents for all using (is_internal_user());

create policy "Customers see own-event compliance documents"
  on compliance_documents for select using (
    event_id in (select id from events where account_id = user_account_id())
  );
create policy "Customers add own-event compliance documents"
  on compliance_documents for insert with check (
    event_id in (select id from events where account_id = user_account_id())
  );
create policy "Customers update own-event compliance documents"
  on compliance_documents for update using (
    event_id in (select id from events where account_id = user_account_id())
  ) with check (
    event_id in (select id from events where account_id = user_account_id())
  );

-- Per-account compliance profile is internal configuration only.
alter table client_compliance_requirements enable row level security;

create policy "Internal full access on client_compliance_requirements"
  on client_compliance_requirements for all using (is_internal_user());
create policy "Customers see own-account compliance requirements"
  on client_compliance_requirements for select using (
    account_id = user_account_id()
  );

-- ============================================================
-- Invoices: finance data. Internal manages; customers read their own.
-- ============================================================
alter table invoices enable row level security;

create policy "Internal full access on invoices"
  on invoices for all using (is_internal_user());
create policy "Customers see own-account invoices"
  on invoices for select using (
    account_id = user_account_id()
  );

alter table account_payment_preferences enable row level security;

create policy "Internal full access on account_payment_preferences"
  on account_payment_preferences for all using (is_internal_user());
create policy "Customers see own-account payment preferences"
  on account_payment_preferences for select using (
    account_id = user_account_id()
  );

-- ============================================================
-- Game & product configuration: customers fill these in for their
-- own events; internal staff manage and verify.
-- ============================================================
alter table game_configurations enable row level security;

create policy "Internal full access on game_configurations"
  on game_configurations for all using (is_internal_user());
create policy "Customers see own-event game config"
  on game_configurations for select using (
    event_id in (select id from events where account_id = user_account_id())
  );
create policy "Customers add own-event game config"
  on game_configurations for insert with check (
    event_id in (select id from events where account_id = user_account_id())
  );
create policy "Customers update own-event game config"
  on game_configurations for update using (
    event_id in (select id from events where account_id = user_account_id())
  ) with check (
    event_id in (select id from events where account_id = user_account_id())
  );

alter table product_configurations enable row level security;

create policy "Internal full access on product_configurations"
  on product_configurations for all using (is_internal_user());
create policy "Customers see own-event product config"
  on product_configurations for select using (
    event_id in (select id from events where account_id = user_account_id())
  );
create policy "Customers add own-event product config"
  on product_configurations for insert with check (
    event_id in (select id from events where account_id = user_account_id())
  );
create policy "Customers update own-event product config"
  on product_configurations for update using (
    event_id in (select id from events where account_id = user_account_id())
  ) with check (
    event_id in (select id from events where account_id = user_account_id())
  );

-- ============================================================
-- Venue requirements: internal manages; customers see their own event's.
-- ============================================================
alter table venue_requirements enable row level security;

create policy "Internal full access on venue_requirements"
  on venue_requirements for all using (is_internal_user());
create policy "Customers see own-event venue requirements"
  on venue_requirements for select using (
    event_id in (select id from events where account_id = user_account_id())
  );

-- ============================================================
-- Handoff notes: internal-only operational notes.
-- ============================================================
alter table handoff_notes enable row level security;

create policy "Internal full access on handoff_notes"
  on handoff_notes for all using (is_internal_user());

-- ============================================================
-- Scheduled exports: replace the permissive USING (true) policy with a
-- proper internal-only guard.
-- ============================================================
drop policy if exists "Internal users can manage scheduled exports" on scheduled_exports;

create policy "Internal full access on scheduled_exports"
  on scheduled_exports for all using (is_internal_user());
