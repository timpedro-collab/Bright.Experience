-- Creative depth: asset version history + region annotations.
--
-- `asset_versions` retains every uploaded revision of an asset (the live
-- `assets` row keeps pointing at the latest). Each version carries its own
-- review outcome so revision rounds have a real audit trail.
--
-- `asset_annotations` lets reviewers drop region-anchored notes (pins / boxes
-- as % of the rendered preview) on a specific version.

-- ── Asset versions ─────────────────────────────────────────────────────────
CREATE TABLE asset_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  version integer NOT NULL,
  file_path text NOT NULL,
  file_name text,
  file_size bigint,
  file_type text,
  uploaded_by uuid REFERENCES profiles(id),
  upload_warnings text[],
  -- Per-round review outcome (mirrors the assets review gate).
  review_status text NOT NULL DEFAULT 'pending_review'
    CHECK (review_status IN ('pending_review', 'approved', 'revision_requested')),
  review_feedback text,
  review_decided_by uuid REFERENCES profiles(id),
  review_decided_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (asset_id, version)
);

CREATE INDEX idx_asset_versions_asset ON asset_versions(asset_id);
CREATE INDEX idx_asset_versions_event ON asset_versions(event_id);
ALTER TABLE asset_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal full access on asset_versions"
  ON asset_versions FOR ALL USING (is_internal_user());
CREATE POLICY "Customers see own event asset versions"
  ON asset_versions FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE account_id = user_account_id())
  );
CREATE POLICY "Customers can record own event asset versions"
  ON asset_versions FOR INSERT WITH CHECK (
    event_id IN (SELECT id FROM events WHERE account_id = user_account_id())
  );

-- ── Asset annotations ──────────────────────────────────────────────────────
CREATE TABLE asset_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  asset_version_id uuid REFERENCES asset_versions(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id),
  -- Anchor rect as a percentage of the rendered preview (0-100).
  x numeric NOT NULL,
  y numeric NOT NULL,
  w numeric NOT NULL DEFAULT 0,
  h numeric NOT NULL DEFAULT 0,
  body text NOT NULL,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_asset_annotations_asset ON asset_annotations(asset_id);
CREATE INDEX idx_asset_annotations_event ON asset_annotations(event_id);
ALTER TABLE asset_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal full access on asset_annotations"
  ON asset_annotations FOR ALL USING (is_internal_user());
CREATE POLICY "Customers see own event asset annotations"
  ON asset_annotations FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE account_id = user_account_id())
  );

-- ── Link a Studio order back to the asset it was raised from ────────────────
ALTER TABLE studio_requests
  ADD COLUMN IF NOT EXISTS source_asset_id uuid REFERENCES assets(id) ON DELETE SET NULL;
