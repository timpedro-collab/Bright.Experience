CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id),
  body text NOT NULL,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_comments_asset ON comments(asset_id);
CREATE INDEX idx_comments_event ON comments(event_id);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal full access on comments"
  ON comments FOR ALL USING (is_internal_user());
CREATE POLICY "Customers see own event comments"
  ON comments FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE account_id = user_account_id())
  );
CREATE POLICY "Customers can add comments"
  ON comments FOR INSERT WITH CHECK (
    event_id IN (SELECT id FROM events WHERE account_id = user_account_id())
  );
