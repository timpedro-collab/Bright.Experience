-- ============================================================
-- Backfill set_updated_at triggers
-- ------------------------------------------------------------
-- The initial schema only wired the update_updated_at() trigger onto eight
-- tables (accounts, profiles, events, tasks, assets, approvals,
-- studio_requests, briefing_responses). Every other table that carries an
-- `updated_at` column was never getting it advanced on UPDATE, so "last
-- changed" timestamps were stuck at insert time. This backfills the trigger
-- onto the remaining tables. Idempotent: drops-if-exists first so it can be
-- re-run safely.
-- ============================================================

do $$
declare
  t text;
  targets text[] := array[
    'event_templates',
    'qa_items',
    'logistics_entries',
    'machines',
    'games',
    'packages',
    'case_studies',
    'quotes',
    'locations',
    'machine_instances',
    'event_metrics_snapshot',
    'event_reports',
    'benchmarks',
    'venues',
    'placements',
    'sponsorship_slots',
    'campaigns',
    'recommendations',
    'notification_preferences',
    'pipedrive_config',
    'event_team_members',
    'partners',
    'partner_attributions',
    'compliance_documents',
    'client_compliance_requirements',
    'invoices',
    'account_payment_preferences',
    'venue_requirements',
    'scheduled_exports',
    'game_configurations',
    'product_configurations'
  ];
begin
  foreach t in array targets loop
    if to_regclass(t) is not null then
      execute format('drop trigger if exists set_updated_at on %I', t);
      execute format(
        'create trigger set_updated_at before update on %I
           for each row execute function update_updated_at()',
        t
      );
    end if;
  end loop;
end $$;
