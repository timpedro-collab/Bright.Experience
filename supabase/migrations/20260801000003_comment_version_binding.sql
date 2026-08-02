-- Bind threaded asset comments to the version that was current when posted.
-- Annotations already carry asset_version_id; comments did not until this
-- migration. Nullable so legacy rows and event-level comments stay valid.

ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS asset_version_id uuid
    REFERENCES asset_versions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_comments_asset_version ON comments(asset_version_id);

-- Undo: DROP INDEX idx_comments_asset_version; ALTER TABLE comments DROP COLUMN asset_version_id;
