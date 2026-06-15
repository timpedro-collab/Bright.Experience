-- Event team members with approval workflow
CREATE TABLE event_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id),
  email text NOT NULL,
  role_label text NOT NULL DEFAULT 'Team Member',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'removed')),
  requested_by uuid REFERENCES profiles(id),
  approved_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_event_team_event ON event_team_members(event_id);
ALTER TABLE event_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal full access on event_team_members"
  ON event_team_members FOR ALL USING (is_internal_user());
CREATE POLICY "Customers see own event team"
  ON event_team_members FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE account_id = user_account_id())
  );
CREATE POLICY "Customers can request team members"
  ON event_team_members FOR INSERT WITH CHECK (
    event_id IN (SELECT id FROM events WHERE account_id = user_account_id())
  );
