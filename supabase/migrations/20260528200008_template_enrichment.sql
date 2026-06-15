-- Workstream 8: Template Enrichment
-- Extends event_templates with additional JSON columns for new domain objects.

alter table event_templates
  add column if not exists compliance_json jsonb default '[]',
  add column if not exists game_config_defaults_json jsonb,
  add column if not exists product_config_defaults_json jsonb,
  add column if not exists venue_requirements_json jsonb default '[]';
