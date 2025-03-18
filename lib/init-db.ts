import { createServerSupabaseClient } from "./supabase"

export async function initDatabase() {
  try {
    const supabase = createServerSupabaseClient()

    // Check if tables exist
    const { data: existingTables } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")

    const tables = existingTables?.map((t) => t.table_name) || []

    // Create tables if they don't exist
    if (!tables.includes("tasks")) {
      await supabase.rpc('exec', {
        query: `
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        -- Teams table
        CREATE TABLE IF NOT EXISTS teams (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(100) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_teams_slug ON teams(slug);

        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        -- Add team_id to tasks table
        CREATE TABLE IF NOT EXISTS tasks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
          position INT DEFAULT 0,
          team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_team ON tasks(team_id);
        
        -- Add team membership table
        CREATE TABLE IF NOT EXISTS team_members (
          team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          role VARCHAR(50) DEFAULT 'member',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          PRIMARY KEY (team_id, user_id)
        );

        -- Check-ins table to track user attendance
        CREATE TABLE IF NOT EXISTS check_ins (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          check_in_date DATE NOT NULL,
          checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          notes TEXT,
          UNIQUE(team_id, user_id, check_in_date)
        );
        
        CREATE INDEX IF NOT EXISTS idx_check_ins_team_date ON check_ins(team_id, check_in_date);
        CREATE INDEX IF NOT EXISTS idx_check_ins_user ON check_ins(user_id);

        CREATE TABLE IF NOT EXISTS completions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          completed_date DATE NOT NULL,
          completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          completed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          CONSTRAINT fk_completed_by FOREIGN KEY (completed_by) REFERENCES users(id)
        );

        CREATE INDEX IF NOT EXISTS idx_tasks_position ON tasks(position);
        CREATE INDEX IF NOT EXISTS idx_completions_user_date ON completions(user_id, completed_date);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_completion ON completions(task_id, user_id, completed_date);

        -- Create stored procedure for updating task positions
        CREATE OR REPLACE FUNCTION update_task_positions(position_updates jsonb)
        RETURNS void AS $$
        DECLARE
          task_update record;
        BEGIN
          FOR task_update IN 
            SELECT * FROM jsonb_to_recordset(position_updates) AS x(task_id uuid, new_position int)
          LOOP
            UPDATE tasks
            SET position = task_update.new_position
            WHERE id = task_update.task_id;
          END LOOP;
        END;
        $$ LANGUAGE plpgsql;
      `});
    }

    console.log("Database initialized successfully")
    return true
  } catch (error) {
    console.error("Error initializing database:", error)
    throw error
  }
}

