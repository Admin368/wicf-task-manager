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
import { format } from "date-fns";
import { toast as sonnerToast } from "sonner";
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
  isAdmin?: boolean;
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
  isAdmin = false,
}: TaskItemProps) {
  const { userId } = useUser();
  const [expanded, setExpanded] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedBy, setCompletedBy] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [pendingCompletion, setPendingCompletion] = useState<boolean | null>(
    null
  );
  const today = format(new Date(), "yyyy-MM-dd");

  const {
    data: checkInStatus,
    isLoading: checkingStatus,
    refetch: refetchStatus,
  } = api.checkIns.getUserCheckInStatus.useQuery({
    teamId: teamMembers[0].teamId,
    date: today,
  });

  // Check if current user is admin
  const isAdminUser = teamMembers?.find(
    (member) =>
      member.id === userId &&
      member.role &&
      (member.role === "admin" || member.role === "owner")
  );

  const toggleCompletion = api.completions.toggle.useMutation({
    onError: (error) => {
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
    if (!completions || !teamMembers) return;

    const completion = completions.find((c) => c.taskId === task.id);

    if (completion) {
      setIsCompleted(true);
      setCompletedBy(completion.userId);
    } else {
      setIsCompleted(false);
      setCompletedBy(null);
    }
  }, [completions, task.id, teamMembers, selectedDate]);

  const handleCheckboxChange = async (checked: boolean | "indeterminate") => {
    if (!userId || typeof checked !== "boolean") return;

    // Store the pending completion state
    setPendingCompletion(checked);
    setShowCompletionModal(true);
  };

  const completeTask = async (checked: boolean) => {
    try {
      if (!checkInStatus?.checkedIn) {
        console.log("Not checked in");
        toast({
          title: "Error",
          description: "You must check in before completing tasks",
          variant: "destructive",
        });
        sonnerToast.info("You must check in before completing tasks");
        return;
      }
      // Optimistically update UI
      setIsCompleted(checked);
      if (checked) {
        setCompletedBy(userId);
      } else {
        setCompletedBy(null);
      }

      // Call the API to update the task status
      await toggleCompletion.mutateAsync({
        taskId: task.id,
        userId: userId!,
        date: selectedDate,
        completed: checked,
      });

      // Refetch to ensure data consistency
      refetchCompletions?.();
    } catch (error) {
      console.error("Failed to toggle completion:", error);
      // Reset UI state
      setIsCompleted(!checked);
      setCompletedBy(checked ? null : userId);

      // Display the error message
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
                {teamMembers.find((m) => m.userId === completedBy)?.user?.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isAdmin && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
                  onClick={() => onEditTask?.(task)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
                  onClick={() => onDeleteTask?.(task.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
                  onClick={() => onAddSubtask?.(task.id)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                {onMoveTask && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      onClick={() => onMoveTask(task.id, "up")}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      onClick={() => onMoveTask(task.id, "down")}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </>
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
                isAdmin={isAdmin}
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
