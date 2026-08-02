-- ============================================================
-- benchmarks: the unique key the recompute upsert has always assumed
-- ============================================================
--
-- `updateBenchmarks` (src/app/actions/reports.ts) upserts against this
-- table. No matching unique index existed, so against real Postgres every run
-- failed with "there is no unique or exclusion constraint matching the ON
-- CONFLICT specification" — the benchmark table that every organizer
-- expectation and sponsor pitch range is drawn from was never refreshed.
--
-- The key is the full scope, location tier included: the curated rows are
-- tier-specific (a tier-1 pitch expects more plays than a tier-2 one) and
-- `lib/metrics/expected-performance` merges the tiers at read time. Leaving the
-- tier out of the key would make that curated data illegal.
--
-- `location_tier`, `machine_type` and `game_type` are all nullable, and the
-- "all tiers, all machines, all games" aggregate row that recompute writes is
-- exactly the NULL case. A plain unique index treats NULLs as distinct, so it
-- would accumulate a fresh duplicate on every run. NULLS NOT DISTINCT
-- (Postgres 15+) gives the intended behaviour and, unlike a coalesce()
-- expression index, can still be named as an ON CONFLICT target.

-- Collapse any duplicates a previous partial run left behind, keeping the most
-- recently updated row for each key.
delete from benchmarks a
  using benchmarks b
  where a.ctid < b.ctid
    and a.event_type = b.event_type
    and a.metric_name = b.metric_name
    and a.location_tier is not distinct from b.location_tier
    and a.machine_type is not distinct from b.machine_type
    and a.game_type is not distinct from b.game_type;

create unique index if not exists benchmarks_scope_metric_key
  on benchmarks (event_type, location_tier, machine_type, game_type, metric_name)
  nulls not distinct;

comment on index benchmarks_scope_metric_key is
  'ON CONFLICT target for updateBenchmarks; NULLS NOT DISTINCT so the all-tiers/all-machines aggregate row stays a single row.';
