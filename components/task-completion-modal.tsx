"use client"

import { useState } from "react"
import { CheckCircle2, XCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TaskCompletionModalProps {
  taskTitle: string | null | undefined
  isOpen: boolean
  isChecking: boolean | null // Whether the task is being checked or unchecked
  onConfirm: () => void
  onCancel: () => void
}

export function TaskCompletionModal({
  taskTitle,
  isOpen,
  isChecking,
  onConfirm,
  onCancel,
}: TaskCompletionModalProps) {
  if (!isOpen) return null

  const isMarkingComplete = isChecking === true
  const isMarkingIncomplete = isChecking === false

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 p-4 backdrop-blur-sm transition-all duration-300">
      <div className="absolute right-4 top-4">
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="mx-auto flex max-w-md flex-col items-center gap-8 text-center">
        {isMarkingComplete ? (
          <CheckCircle2 className="h-24 w-24 text-primary" />
        ) : (
          <XCircle className="h-24 w-24 text-destructive" />
        )}
        
        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">
            {isMarkingComplete ? "Confirm Task Completion" : "Confirm Task Unchecking"}
          </h2>
          <p className="text-xl text-muted-foreground">
            {isMarkingComplete 
              ? "Are you sure you want to mark this task as complete?" 
              : "Are you sure you want to mark this task as incomplete?"}
          </p>
          <p className="text-lg font-medium border-l-4 border-primary pl-4 py-2 bg-muted/50">
            {taskTitle || "Selected task"}
          </p>
        </div>

        <div className="flex w-full gap-4">
          <Button 
            variant="outline" 
            size="lg" 
            className="flex-1" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            variant={isMarkingComplete ? "default" : "destructive"}
            size="lg" 
            className="flex-1" 
            onClick={onConfirm}
          >
            {isMarkingComplete ? "Confirm Completion" : "Mark as Incomplete"}
          </Button>
        </div>
      </div>
    </div>
  )
} 