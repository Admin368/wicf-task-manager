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
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          parent_id?: string | null
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          parent_id?: string | null
          position?: number
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
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          completed_date: string
          completed_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          completed_date?: string
          completed_at?: string
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
    }
  }
}

