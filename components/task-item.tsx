"use client";

import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Trash2,
  Plus,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { api } from "@/lib/trpc/client";
import { useUser } from "./user-provider";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { TaskCompletionModal } from "./task-completion-modal";

interface TaskItemProps {
  task: {
    id: string;
    title: string;
    parentId: string | null;
    position: number;
  };
  tasks: any[];
  completions: any[];
  teamMembers: any[];
  selectedDate: string;
  level?: number;
  onAddSubtask?: (parentId: string) => void;
  onEditTask?: (task: any) => void;
  onDeleteTask?: (taskId: string) => void;
  onMoveTask?: (taskId: string, direction: "up" | "down") => void;
  className?: string;
  refetchCompletions?: () => void;
  dragHandleProps?: Record<string, any>;
}

export function TaskItem({
  task,
  tasks,
  completions,
  teamMembers,
  selectedDate,
  level = 0,
  onAddSubtask,
  onEditTask,
  onDeleteTask,
  onMoveTask,
  className,
  refetchCompletions,
}: TaskItemProps) {
  const { userId } = useUser();
  const [expanded, setExpanded] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedBy, setCompletedBy] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [pendingCompletion, setPendingCompletion] = useState<boolean | null>(
    null
  );

  // Check if current user is admin
  const isAdmin = teamMembers?.find(
    (member) =>
      member.id === userId &&
      (member.role === "admin" || member.role === "owner")
  );

  const toggleCompletion = api.completions.toggle.useMutation({
    onError: (error: Error) => {
      console.error("Failed to toggle completion:", error);
      toast({
        title: "Error",
        description:
          error.message === "You must check in before completing tasks"
            ? "Please check in for today before completing tasks"
            : "Failed to update task status. Please try again.",
        variant: "destructive",
      });
      // Revert optimistic update
      setIsCompleted(!isCompleted);
    },
  });

  // Get child tasks
  const childTasks = tasks
    .filter((t) => t.parentId === task.id)
    .sort((a, b) => a.position - b.position);

  // Get sibling tasks (tasks at the same level)
  const siblingTasks = tasks
    .filter((t) => t.parentId === task.parentId)
    .sort((a, b) => a.position - b.position);

  const currentIndex = siblingTasks.findIndex((t) => t.id === task.id);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === siblingTasks.length - 1;

  // Check if task is completed and who completed it
  useEffect(() => {
    if (!userId) return;

    const completion = completions.find(
      (c) => c.taskId === task.id && c.completedDate === selectedDate
    );

    setIsCompleted(!!completion);
    setCompletedBy(completion?.completedById || null);
  }, [completions, task.id, userId, selectedDate]);

  const handleCheckboxChange = async (checked: boolean | "indeterminate") => {
    if (!userId || typeof checked !== "boolean") return;

    // Store the pending completion state
    setPendingCompletion(checked);
    setShowCompletionModal(true);
  };

  const completeTask = async (checked: boolean) => {
    try {
      // Optimistically update UI
      setIsCompleted(checked);

      // Call the API to update the task status
      await toggleCompletion.mutateAsync({
        taskId: task.id,
        userId: userId || "", // Ensure userId is a string
        date: selectedDate,
        completed: checked,
      });

      // Refetch to ensure data consistency
      refetchCompletions?.();
    } catch (error) {
      console.error("Failed to toggle completion:", error);
      // UI will be reverted by the onError handler in the mutation

      // Display the error message from the server if available
      if (error instanceof Error) {
        toast({
          title: "Error",
          description:
            error.message || "Failed to update task status. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleConfirmCompletion = () => {
    if (pendingCompletion !== null) {
      completeTask(!!pendingCompletion);
    }
    setShowCompletionModal(false);
    setPendingCompletion(null);
  };

  const handleCancelCompletion = () => {
    setShowCompletionModal(false);
    setPendingCompletion(null);
    // Reset UI state if needed
    if (pendingCompletion) {
      setIsCompleted(false);
    }
  };

  return (
    <>
      <div className={className}>
        <div
          className={cn(
            "flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors",
            isCompleted && "bg-muted/30"
          )}
          style={{ paddingLeft: `${(level + 1) * 12}px` }}
        >
          <div className="flex items-center gap-2 flex-1">
            {childTasks.length > 0 ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="w-5" />
            )}
            <Checkbox
              checked={isCompleted}
              onCheckedChange={handleCheckboxChange}
              className="data-[state=checked]:bg-green-600"
            />
            <span className="flex-1">{task.title}</span>
            {completedBy && (
              <span className="text-sm text-muted-foreground">
                Completed by{" "}
                {teamMembers.find((m) => m.id === completedBy)?.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {!isFirst && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onMoveTask?.(task.id, "up")}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
            {!isLast && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onMoveTask?.(task.id, "down")}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onAddSubtask?.(task.id)}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onEditTask?.(task)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onDeleteTask?.(task.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {expanded && childTasks.length > 0 && (
          <div>
            {childTasks.map((childTask) => (
              <TaskItem
                key={childTask.id}
                task={childTask}
                tasks={tasks}
                completions={completions}
                teamMembers={teamMembers}
                selectedDate={selectedDate}
                level={level + 1}
                onAddSubtask={onAddSubtask}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
                onMoveTask={onMoveTask}
                refetchCompletions={refetchCompletions}
              />
            ))}
          </div>
        )}
      </div>

      <TaskCompletionModal
        taskTitle={task.title}
        isOpen={showCompletionModal}
        isChecking={pendingCompletion}
        onConfirm={handleConfirmCompletion}
        onCancel={handleCancelCompletion}
      />
    </>
  );
}
