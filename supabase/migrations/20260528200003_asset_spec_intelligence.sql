-- Workstream 2: Asset Specification Intelligence
-- Extends the assets table with richer spec metadata for automated validation
-- and clearer customer-facing upload guidance.

alter table assets
  add column if not exists required_resolution_min text,
  add column if not exists required_duration_range text,
  add column if not exists required_file_types text[],
  add column if not exists animation_requirements text,
  add column if not exists safe_zone_description text,
  add column if not exists reference_url text,
  add column if not exists is_physical boolean default false,
  add column if not exists spec_document_url text,
  add column if not exists upload_warnings jsonb;
