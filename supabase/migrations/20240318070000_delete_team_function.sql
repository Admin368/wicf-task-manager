-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS delete_team(UUID);

-- Create a function to delete a team and all its related data
CREATE OR REPLACE FUNCTION delete_team(team_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- Delete all check-ins for the team
  DELETE FROM check_ins WHERE team_id = team_id;

  -- Delete all tasks for the team
  DELETE FROM tasks WHERE team_id = team_id;

  -- Delete all team members
  DELETE FROM team_members WHERE team_id = team_id;
    
  -- Finally delete the team itself
  DELETE FROM teams WHERE id = team_id;
$$; 