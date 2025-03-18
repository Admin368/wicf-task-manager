export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          title: string
          parent_id: string | null
          position: number
          team_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          parent_id?: string | null
          position?: number
          team_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          parent_id?: string | null
          position?: number
          team_id?: string | null
          created_at?: string
        }
      }
      completions: {
        Row: {
          id: string
          task_id: string
          user_id: string
          completed_date: string
          completed_at: string
          completed_by: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          completed_date: string
          completed_at?: string
          completed_by: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          completed_date?: string
          completed_at?: string
          completed_by?: string
        }
      }
      users: {
        Row: {
          id: string
          name: string
          email: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          slug: string
          password: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          password: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          password?: string
          created_at?: string
        }
      }
      team_members: {
        Row: {
          team_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          team_id: string
          user_id: string
          role?: string
          created_at?: string
        }
        Update: {
          team_id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
      }
    }
  }
}

