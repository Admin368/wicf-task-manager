"use client"

import { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Plus, ChevronRight, ChevronDown, AlertCircle } from "lucide-react"
import { api } from "@/lib/trpc/client"
import { useUser } from "./user-provider"
import { getClientSupabaseClient } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

interface TaskItemProps {
  task: {
    id: string
    title: string
    parent_id: string | null
  }
  tasks: any[]
  completions: any[]
  selectedDate: string
  level?: number
  onAddSubtask?: (parentId: string) => void
  onEditTask?: (task: any) => void
  onDeleteTask?: (taskId: string) => void
  className?: string
}

export function TaskItem({
  task,
  tasks,
  completions,
  selectedDate,
  level = 0,
  onAddSubtask,
  onEditTask,
  onDeleteTask,
  className,
}: TaskItemProps) {
  const { userId } = useUser()
  const [expanded, setExpanded] = useState(true)
  const [isCompleted, setIsCompleted] = useState(false)
  const [completedBy, setCompletedBy] = useState<string[]>([])
  const [supabaseError, setSupabaseError] = useState<string | null>(null)

  const toggleCompletion = api.completions.toggle.useMutation({
    onError: (error) => {
      console.error("Failed to toggle completion:", error)
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      })
      // Revert optimistic update
      setIsCompleted(!isCompleted)
    },
  })

  const utils = api.useContext()

  // Get child tasks
  const childTasks = tasks.filter((t) => t.parent_id === task.id).sort((a, b) => a.position - b.position)

  // Check if task is completed by current user
  useEffect(() => {
    if (!userId) return

    const isTaskCompleted = completions.some(
      (c) => c.task_id === task.id && c.user_id === userId && c.completed_date === selectedDate,
    )

    setIsCompleted(isTaskCompleted)

    // Get all users who completed this task
    const usersWhoCompleted = completions
      .filter((c) => c.task_id === task.id && c.completed_date === selectedDate)
      .map((c) => c.user_id)

    setCompletedBy(usersWhoCompleted)
  }, [completions, task.id, userId, selectedDate])

  // Subscribe to real-time updates
  useEffect(() => {
    let channel: any = null

    try {
      const supabase = getClientSupabaseClient()

      channel = supabase
        .channel("completions-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "completions",
            filter: `task_id=eq.${task.id}`,
          },
          () => {
            // Refetch completions when changes occur
            utils.completions.getByDate.invalidate({ date: selectedDate })
          },
        )
        .subscribe((status: any) => {
          if (status === "SUBSCRIPTION_ERROR") {
            setSupabaseError("Failed to subscribe to real-time updates")
          }
        })
    } catch (error) {
      console.error("Error setting up real-time subscription:", error)
      setSupabaseError("Failed to set up real-time updates")
    }

    return () => {
      if (channel) {
        try {
          const supabase = getClientSupabaseClient()
          supabase.removeChannel(channel)
        } catch (error) {
          console.error("Error removing channel:", error)
        }
      }
    }
  }, [task.id, selectedDate, utils.completions.getByDate])

  const handleCheckboxChange = async (checked: boolean | "indeterminate") => {
    if (!userId || typeof checked !== "boolean") return

    try {
      // Optimistically update UI
      setIsCompleted(checked)

      await toggleCompletion.mutateAsync({
        taskId: task.id,
        userId,
        date: selectedDate,
        completed: checked,
      })

      // Refetch to ensure data consistency
      utils.completions.getByDate.invalidate({ date: selectedDate })
    } catch (error) {
      console.error("Failed to toggle completion:", error)
      // UI will be reverted by the onError handler in the mutation
    }
  }

  return (
    <div className={className}>
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors",
          isCompleted && "bg-muted/30",
        )}
        style={{ paddingLeft: `${(level + 1) * 12}px` }}
      >
        {childTasks.length > 0 ? (
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        ) : (
          <div className="w-5" />
        )}

        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleCheckboxChange}
          id={`task-${task.id}`}
          className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
        />

        <label
          htmlFor={`task-${task.id}`}
          className={cn("flex-grow text-sm cursor-pointer", isCompleted && "line-through text-muted-foreground")}
        >
          {task.title}
        </label>

        {completedBy.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {completedBy.length} {completedBy.length === 1 ? "person" : "people"} completed
          </div>
        )}

        {supabaseError && (
          <div className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>Sync error</span>
          </div>
        )}

        <div className="flex items-center gap-1">
          {onAddSubtask && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddSubtask(task.id)}>
              <Plus className="h-4 w-4" />
            </Button>
          )}

          {onEditTask && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditTask(task)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}

          {onDeleteTask && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDeleteTask(task.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {expanded && childTasks.length > 0 && (
        <div className="ml-4">
          {childTasks.map((childTask) => (
            <TaskItem
              key={childTask.id}
              task={childTask}
              tasks={tasks}
              completions={completions}
              selectedDate={selectedDate}
              level={level + 1}
              onAddSubtask={onAddSubtask}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
            />
          ))}
        </div>
      )}
    </div>
  )
}

