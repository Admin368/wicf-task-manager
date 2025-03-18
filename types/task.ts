export interface Task {
  id: string
  title: string
  parent_id: string | null
  position: number
  team_id: string | null
  created_at: string
} 