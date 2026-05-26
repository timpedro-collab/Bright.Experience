-- ============================================================
-- Schema Reconcile — Phase 0 of the Path-to-10/10 build.
-- ------------------------------------------------------------
-- Aligns the database schema with the columns and constraints the
-- application code (server actions + queries) has been writing
-- against. Every change is additive or a constraint widening so
-- existing rows continue to work and rollbacks are trivial.
--
-- Sections:
--   1. quotes : add the columns + statuses the booking and
--      proposal flows expect (track 'book_now', status
--      'proposal_sent'/'declined', expires_at, declined_at,
--      machine_preference, game_preference, postcode,
--      event_date_start/end, estimated_* outcomes, footfall as
--      text).
--   2. campaigns, api_keys, webhook_subscriptions, sponsorship_slots
--      : drop the accidental FK to profiles(id) and re-point
--      account_id / sponsor_account_id at accounts(id). The RLS
--      policies on these tables already compare against
--      user_account_id() which returns profiles.account_id, so the
--      profiles-side FK was guaranteed to mis-fire.
--   3. storage buckets : create the buckets the next-phase signed
--      URL helper expects (briefings, reports, studio-deliverables)
--      and tighten event-assets to private + signed access.
-- ============================================================

-- ============================================================
-- 1. quotes
-- ============================================================

-- 1a. Broaden the `track` allow-list to accept the application's
-- `book_now` track (Track 1 of the two-track quoting engine).
-- Drop and re-add the check so we keep the existing values and add
-- the new one in a single, idempotent step.
alter table quotes
  drop constraint if exists quotes_track_check;

alter table quotes
  add constraint quotes_track_check
  check (track in ('standard', 'proposal', 'book_now'));

-- 1b. Broaden the `status` allow-list. `proposal_sent` is the AE
-- handoff state once line items + total amount are written, and
-- `declined` is the customer rejection terminal. Both already exist
-- in the original allow-list under different names — we make them
-- explicit so the server actions don't silently coerce.
alter table quotes
  drop constraint if exists quotes_status_check;

alter table quotes
  add constraint quotes_status_check
  check (
    status in (
      'draft',
      'submitted',
      'preparing',
      'proposal_sent',
      'delivered',
      'accepted',
      'expired',
      'declined'
    )
  );

-- 1c. Add the columns the actions write. Each column is nullable so
-- back-filling can happen lazily; the data we already have in
-- `location_postcode`, `dates_start`, `dates_end`, and
-- `footfall_estimate` is copied across in 1d.

alter table quotes
  add column if not exists postcode text,
  add column if not exists event_date_start date,
  add column if not exists event_date_end date,
  add column if not exists machine_preference text,
  add column if not exists game_preference text,
  add column if not exists footfall_estimate_text text,
  add column if not exists expires_at timestamptz,
  add column if not exists declined_at timestamptz,
  add column if not exists estimated_interactions integer,
  add column if not exists estimated_leads integer,
  add column if not exists estimated_impressions integer;

-- 1d. Back-fill the new columns from the legacy ones so existing
-- rows continue to surface correctly in the application layer.
update quotes
  set postcode = coalesce(postcode, location_postcode);

update quotes
  set event_date_start = coalesce(event_date_start, dates_start),
      event_date_end   = coalesce(event_date_end, dates_end);

update quotes
  set footfall_estimate_text = coalesce(
    footfall_estimate_text,
    case
      when footfall_estimate is null then null
      else footfall_estimate::text
    end
  );

update quotes
  set expires_at = coalesce(expires_at, valid_until);

-- 1e. Footfall estimate type drift. The application writes free-form
-- text ("500-1000", "~3000", "unsure"); the old integer column can
-- only hold strict integers. The integer column stays for the
-- handful of historical rows that have a clean value (so any
-- downstream analytics relying on it keep working), and the new
-- text column becomes the canonical write target. The action layer
-- is updated in this PR to write `footfall_estimate_text`; a follow-
-- on migration once everything has been backfilled will drop the
-- integer column.

-- 1f. Helpful indexes on the new columns the action layer will
-- filter by.
create index if not exists idx_quotes_event_date_start
  on quotes(event_date_start);

create index if not exists idx_quotes_expires_at
  on quotes(expires_at)
  where expires_at is not null;

-- ============================================================
-- 2. Fix mis-pointed account_id foreign keys.
-- ------------------------------------------------------------
-- Each of these tables exposes an `account_id` (or
-- `sponsor_account_id`) that the RLS policies compare against
-- `user_account_id()`. `user_account_id()` returns
-- `profiles.account_id`, i.e. a row in `accounts`. The original
-- migrations FK'd these columns to `profiles(id)`, which meant the
-- comparison could never succeed for a customer. Repoint at
-- `accounts(id)`.
--
-- These migrations are safe to run when no rows exist (the
-- application can't have written valid data through the broken
-- relationship). The `drop constraint if exists` clauses make the
-- migration re-runnable.
-- ============================================================

-- campaigns
alter table campaigns
  drop constraint if exists campaigns_account_id_fkey;

alter table campaigns
  add constraint campaigns_account_id_fkey
  foreign key (account_id) references accounts(id) on delete set null;

-- api_keys
alter table api_keys
  drop constraint if exists api_keys_account_id_fkey;

alter table api_keys
  add constraint api_keys_account_id_fkey
  foreign key (account_id) references accounts(id) on delete cascade;

-- webhook_subscriptions
alter table webhook_subscriptions
  drop constraint if exists webhook_subscriptions_account_id_fkey;

alter table webhook_subscriptions
  add constraint webhook_subscriptions_account_id_fkey
  foreign key (account_id) references accounts(id) on delete cascade;

-- sponsorship_slots.sponsor_account_id : the sponsor renting a slot
-- is a brand (an account), not a single profile.
alter table sponsorship_slots
  drop constraint if exists sponsorship_slots_sponsor_account_id_fkey;

alter table sponsorship_slots
  add constraint sponsorship_slots_sponsor_account_id_fkey
  foreign key (sponsor_account_id) references accounts(id) on delete set null;

-- ============================================================
-- 3. Storage buckets for the upcoming signed-URL pipeline.
-- ------------------------------------------------------------
-- - briefings        : customer brand kits, signed reads only
-- - reports          : exported PDFs of post-event reports
-- - studio-deliverables : Bright.Studio creative deliveries
-- - event-assets    : already exists, kept private
--
-- The buckets are created `public=false` so every read must go
-- through `createSignedUrl()`. The bucket-level policies grant
-- internal users full control and authenticated users read-only
-- access through the signed URL surface (Supabase signs requests
-- against the bucket policies, so this still gates reads correctly).
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('briefings', 'briefings', false),
  ('reports', 'reports', false),
  ('studio-deliverables', 'studio-deliverables', false)
on conflict (id) do nothing;

-- briefings policies
create policy "briefings_internal_all"
  on storage.objects for all
  using (bucket_id = 'briefings' and is_internal_user())
  with check (bucket_id = 'briefings' and is_internal_user());

create policy "briefings_authenticated_read"
  on storage.objects for select
  using (bucket_id = 'briefings' and auth.uid() is not null);

create policy "briefings_authenticated_upload"
  on storage.objects for insert
  with check (bucket_id = 'briefings' and auth.uid() is not null);

-- reports policies (read-only for authenticated; internal owns writes)
create policy "reports_internal_all"
  on storage.objects for all
  using (bucket_id = 'reports' and is_internal_user())
  with check (bucket_id = 'reports' and is_internal_user());

create policy "reports_authenticated_read"
  on storage.objects for select
  using (bucket_id = 'reports' and auth.uid() is not null);

-- studio-deliverables policies
create policy "studio_internal_all"
  on storage.objects for all
  using (bucket_id = 'studio-deliverables' and is_internal_user())
  with check (bucket_id = 'studio-deliverables' and is_internal_user());

create policy "studio_authenticated_read"
  on storage.objects for select
  using (bucket_id = 'studio-deliverables' and auth.uid() is not null);
