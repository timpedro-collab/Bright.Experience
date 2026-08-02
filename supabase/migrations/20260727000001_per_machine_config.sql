-- ============================================================
-- Per-machine configuration
-- ============================================================
--
-- Until now a show could hold exactly one game configuration and one
-- product configuration (UNIQUE(event_id), added in
-- 20260602120000_config_unique_event.sql). That holds for a single-machine
-- brand activation but breaks an organizer show, where a six-unit fleet
-- runs different jobs: a welcome gift at registration, a sponsor game on
-- the floor, a reward at the rebooking desk.
--
-- Model: `machine_instance_id IS NULL` is the show-wide default, and a row
-- with a machine set overrides it for that unit only. Resolution lives in
-- src/lib/configuration/resolve-config.ts.
--
-- Note on uniqueness: NULLs are distinct in a plain unique constraint, so
-- the scope key is an expression index over coalesce(). Expression indexes
-- cannot be used as a PostgREST `on_conflict` target, so the write paths in
-- src/app/actions/game-config.ts read-then-write instead of upserting.

-- ============================================================
-- Game configurations
-- ============================================================

alter table game_configurations
  drop constraint if exists game_configurations_event_id_key;

alter table game_configurations
  add column if not exists machine_instance_id uuid
  references machine_instances(id) on delete cascade;

-- Sentinel UUID stands in for "no machine" so one index covers both the
-- show-wide default and every per-machine override.
create unique index if not exists game_configurations_event_machine_key
  on game_configurations (
    event_id,
    coalesce(machine_instance_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create index if not exists idx_game_configurations_machine
  on game_configurations(machine_instance_id);

-- ============================================================
-- Product configurations
-- ============================================================

alter table product_configurations
  drop constraint if exists product_configurations_event_id_key;

alter table product_configurations
  add column if not exists machine_instance_id uuid
  references machine_instances(id) on delete cascade;

create unique index if not exists product_configurations_event_machine_key
  on product_configurations (
    event_id,
    coalesce(machine_instance_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create index if not exists idx_product_configurations_machine
  on product_configurations(machine_instance_id);

-- ============================================================
-- Capture method
-- ============================================================
-- How a play is unlocked and identity established. 'form' is the current
-- behaviour; 'badge_scan' trades extra form context for verified registration
-- data; 'both' lets the attendee choose. Enforced machine-side — the portal
-- authors it and ships it in the config payload.

alter table game_configurations
  add column if not exists capture_method text not null default 'form';

alter table game_configurations
  drop constraint if exists game_configurations_capture_method_check;

alter table game_configurations
  add constraint game_configurations_capture_method_check
  check (capture_method in ('form', 'badge_scan', 'both'));
