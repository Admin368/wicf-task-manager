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
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          parent_id UUID REFERENCES tasks(id),
          position INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `)

      await supabase.query(`
        CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
      `)
    }

    if (!tables.includes("completions")) {
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS completions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          completed_date DATE NOT NULL,
          completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          completed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          CONSTRAINT fk_completed_by FOREIGN KEY (completed_by) REFERENCES users(id)
        );
      `)

      await supabase.query(`
        CREATE INDEX IF NOT EXISTS idx_completions_task_id ON completions(task_id);
        CREATE INDEX IF NOT EXISTS idx_completions_user_date ON completions(user_id, completed_date);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_completion ON completions(task_id, user_id, completed_date);
      `)
    }

    if (!tables.includes("users")) {
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `)
    }

    console.log("Database initialized successfully")
    return true
  } catch (error) {
    console.error("Error initializing database:", error)
    return false
  }
}

