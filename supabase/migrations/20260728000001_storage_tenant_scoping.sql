-- ============================================================
-- Storage cross-tenant read fix
-- ============================================================
--
-- Four buckets granted SELECT to `auth.uid() is not null`: any authenticated
-- user could list and download every other tenant's briefing packs, creative
-- assets, compliance documents, lead exports and studio deliverables. Signed
-- URLs are minted with the caller's RLS-scoped client, so the policy was the
-- only thing standing between one brand and another brand's files.
--
-- Every upload path is `<eventId>/<entityType>/<entityId>/<ts>-<filename>` (see
-- storagePathFor in src/lib/storage/signed-url.ts), so the first path segment
-- identifies the owning event and therefore the owning account. The one
-- exception was the scheduled-export writer, which used `exports/<eventId>/...`;
-- it now follows the same convention.
--
-- Access mirrors the `assets` table policies exactly:
--   internal staff  -> everything
--   customer users  -> events belonging to their account
--   organizer users -> their own shows (read-only, sponsor creative)
-- Service-role callers bypass RLS and are unaffected, which is what keeps the
-- cron export writer and the machine webhook working.

-- Returns the event id encoded in a storage object path, or null when the path
-- does not start with a uuid. Written defensively because a bad cast inside a
-- policy surfaces as a 500 on unrelated requests.
create or replace function public.storage_object_event_id(object_name text)
returns uuid
language sql
immutable
set search_path = public
as $$
  select case
    when split_part(object_name, '/', 1)
         ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(object_name, '/', 1)::uuid
  end;
$$;

comment on function public.storage_object_event_id(text) is
  'Event id from the first segment of a storage object path; null if absent.';

-- True when the current user may read a storage object belonging to an event.
create or replace function public.can_read_event_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from events e
    where e.id = public.storage_object_event_id(object_name)
      and (
        public.is_internal_user()
        or e.account_id = public.user_account_id()
        or e.organizer_partner_id = public.user_partner_id()
      )
  );
$$;

comment on function public.can_read_event_object(text) is
  'Storage read predicate: internal staff, the owning account, or the show organizer.';

-- event-assets ------------------------------------------------------------
drop policy if exists "Users can view event assets" on storage.objects;
create policy "Users can view event assets"
  on storage.objects for select
  using (
    bucket_id = 'event-assets'
    and public.can_read_event_object(name)
  );

-- Uploads were `auth.uid() is not null` with no bucket or path constraint, so
-- any authenticated user could write into any bucket, including catalog-media.
drop policy if exists "Authenticated users can upload assets" on storage.objects;
create policy "Authenticated users can upload assets"
  on storage.objects for insert
  with check (
    bucket_id = 'event-assets'
    and public.can_read_event_object(name)
  );

-- briefings ---------------------------------------------------------------
drop policy if exists "briefings_authenticated_read" on storage.objects;
create policy "briefings_authenticated_read"
  on storage.objects for select
  using (
    bucket_id = 'briefings'
    and public.can_read_event_object(name)
  );

drop policy if exists "briefings_authenticated_upload" on storage.objects;
create policy "briefings_authenticated_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'briefings'
    and public.can_read_event_object(name)
  );

-- reports -----------------------------------------------------------------
drop policy if exists "reports_authenticated_read" on storage.objects;
create policy "reports_authenticated_read"
  on storage.objects for select
  using (
    bucket_id = 'reports'
    and public.can_read_event_object(name)
  );

-- studio-deliverables -----------------------------------------------------
drop policy if exists "studio_authenticated_read" on storage.objects;
create policy "studio_authenticated_read"
  on storage.objects for select
  using (
    bucket_id = 'studio-deliverables'
    and public.can_read_event_object(name)
  );
