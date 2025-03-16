"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TaskDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { title: string; parentId: string | null }) => void
  title: string
  initialData?: {
    id: string
    title: string
    parent_id: string | null
  }
  tasks: any[]
}

export function TaskDialog({ open, onClose, onSubmit, title, initialData, tasks }: TaskDialogProps) {
  const [taskTitle, setTaskTitle] = useState(initialData?.title || "")
  const [parentId, setParentId] = useState<string | null>(initialData?.parent_id || null)
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!taskTitle.trim()) {
      setError("Please enter a task title")
      return
    }

    onSubmit({
      title: taskTitle,
      parentId,
    })

    // Reset form
    setTaskTitle("")
    setParentId(null)
    setError("")
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {initialData ? "Edit the task details below." : "Add a new task to the checklist."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={taskTitle}
                onChange={(e) => {
                  setTaskTitle(e.target.value)
                  setError("")
                }}
                className="col-span-3"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="parent" className="text-right">
                Parent
              </Label>
              <Select value={parentId || ""} onValueChange={(value) => setParentId(value === "" ? null : value)}>
                <SelectTrigger id="parent" className="col-span-3">
                  <SelectValue placeholder="None (Top Level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Top Level)</SelectItem>
                  {tasks
                    .filter((t) => t.id !== initialData?.id) // Prevent selecting self as parent
                    .map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-red-500 text-right">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{initialData ? "Save Changes" : "Add Task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

