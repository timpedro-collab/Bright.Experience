-- Enforce one configuration row per event so the upsert in
-- src/app/actions/game-config.ts (onConflict: "event_id") works.
-- Previously these tables had only a non-unique index on event_id,
-- so a second save on the same event threw a conflict error.

-- Defensive dedupe: keep an arbitrary single row per event before
-- adding the unique constraint (no-op on a clean DB).
delete from game_configurations a
  using game_configurations b
  where a.event_id = b.event_id
    and a.ctid < b.ctid;

alter table game_configurations
  add constraint game_configurations_event_id_key unique (event_id);

delete from product_configurations a
  using product_configurations b
  where a.event_id = b.event_id
    and a.ctid < b.ctid;

alter table product_configurations
  add constraint product_configurations_event_id_key unique (event_id);
