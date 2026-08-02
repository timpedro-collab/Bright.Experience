-- Live stock telemetry (client-committed feature, P2.2 in
-- docs/13-dev-handover-priorities.md).
--
-- event_metrics_snapshot gains stock columns so the live dashboard can show
-- prizes/samples remaining and a reload estimate without anyone WhatsApping
-- the ops team. Capacity comes from product_configurations.total_units;
-- remaining is capacity minus prizes dispensed, recomputed on webhook ingest.

alter table event_metrics_snapshot
  add column if not exists stock_remaining integer,
  add column if not exists stock_capacity integer;

comment on column event_metrics_snapshot.stock_remaining is
  'Prize/sample units left in the machine(s); null when capacity is unknown';
comment on column event_metrics_snapshot.stock_capacity is
  'Total units loaded for the event (product_configurations.total_units)';
