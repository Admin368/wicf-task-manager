-- Create check_ins table
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE(team_id, user_id, check_in_date)
);

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_check_ins_team_date ON check_ins(team_id, check_in_date);
CREATE INDEX IF NOT EXISTS idx_check_ins_user ON check_ins(user_id);

-- Create RLS policies
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- Team members can view check-ins for their team
CREATE POLICY "Team members can view check-ins for their team" ON check_ins
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = check_ins.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Users can create check-ins for teams they belong to
CREATE POLICY "Users can create check-ins for teams they belong to" ON check_ins
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = check_ins.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Users can only update their own check-ins
CREATE POLICY "Users can only update their own check-ins" ON check_ins
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Team admins can delete check-ins for their team
CREATE POLICY "Team admins can delete check-ins for their team" ON check_ins
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = check_ins.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('admin', 'owner')
    )
  ); 