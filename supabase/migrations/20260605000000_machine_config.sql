-- ============================================================
-- Machine build configuration
--
-- Operations records the physical vend mechanism per event — the lanes
-- (belt / pusher / spiral), their width, spiral size, and which product
-- sits in each — so the machine setup for a specific customer is saved
-- and recoverable. Stored as JSON on the existing product_configurations
-- row (one per event); RLS on that table already grants internal full
-- access, which is what Operations needs.
-- ============================================================
alter table product_configurations
  add column if not exists machine_config_json jsonb not null default '[]';
