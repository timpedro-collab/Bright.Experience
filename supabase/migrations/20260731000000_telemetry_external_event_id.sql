-- ============================================================
-- telemetry_events: an idempotency key for inbound Cloud batches
-- ============================================================
--
-- `/api/webhooks/brightblue` ingested `telemetry.batch` with a plain insert, so
-- every redelivery duplicated rows. Cloud retries on any non-2xx and on a
-- timeout, and our own 500 path guaranteed one — so a machine's plays, prizes
-- and interactions could be counted two or three times. Those counts drive the
-- live dashboard, the post-show report, the benchmark table and every "expected
-- performance" range quoted to an organizer.
--
-- `external_event_id` is the sender's identity for one telemetry event. The
-- webhook uses Cloud's own id when the payload carries one and otherwise
-- derives a digest of the batch body plus the item's position, so a byte-identical
-- redelivery lands on the same key either way. Rows written by anything other
-- than the webhook (seed data, the mock dataset, future first-party producers)
-- leave it NULL.
--
-- The index is deliberately NOT `nulls not distinct`: NULLs must stay distinct
-- so unkeyed rows don't collide with each other. A plain single-column unique
-- index is also inferrable as an ON CONFLICT target, which a partial index
-- (`where external_event_id is not null`) is not through PostgREST, since its
-- `on_conflict` parameter takes column names only.

alter table telemetry_events
  add column if not exists external_event_id text;

-- Collapse anything a pre-migration redelivery already duplicated. Rows with no
-- external id are untouched; only exact key collisions are removed, keeping the
-- first-written row.
delete from telemetry_events a
  using telemetry_events b
  where a.ctid > b.ctid
    and a.external_event_id is not null
    and a.external_event_id = b.external_event_id;

create unique index if not exists telemetry_events_external_event_id_key
  on telemetry_events (external_event_id);

comment on column telemetry_events.external_event_id is
  'Sender-side id for one telemetry event; ON CONFLICT target that makes Cloud webhook redelivery a no-op. NULL for rows not ingested from a webhook.';

comment on index telemetry_events_external_event_id_key is
  'Idempotency key for /api/webhooks/brightblue telemetry.batch. NULLs stay distinct so unkeyed rows never collide.';
