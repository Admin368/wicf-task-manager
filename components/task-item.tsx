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
  ArrowUp,
  ArrowDown,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/trpc/client";
import { useUser } from "./user-provider";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { TaskCompletionModal } from "./task-completion-modal";
import { format } from "date-fns";
import { toast as sonnerToast } from "sonner";
import { TaskAssignmentDialog } from "./task-assignment-dialog";
// import { TaskCompletion } from "@prisma/client";
import { serverGetTeamMembersReturnType } from "@/server/api/routers/users";
import {
  serverGetCompletionsReturnType,
  serverGetTasksReturnType,
} from "@/server/api/routers/tasks";
// import { Task } from "@prisma/client";

interface TaskItemProps {
  task: serverGetTasksReturnType;
  tasks: serverGetTasksReturnType[];
  completions: serverGetCompletionsReturnType[];
  teamMembers: serverGetTeamMembersReturnType[];
  selectedDate: string | Date;
  level?: number;
  onAddSubtask?: (parentId: string) => void;
  onEditTask?: (task: serverGetTasksReturnType) => void;
  onDeleteTask?: (taskId: string) => void;
  onMoveTask?: (taskId: string, direction: "up" | "down") => void;
  className?: string;
  refetch?: () => void;
  dragHandleProps?: Record<string, any>;
  isAdmin?: boolean;
  hideTools?: boolean;
  hideNotAssignedToMe?: boolean;
  isCheckedIn: boolean;
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
  refetch,
  dragHandleProps,
  isAdmin,
  hideTools,
  hideNotAssignedToMe,
  isCheckedIn,
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
  const teamId = task.teamId;

  // Check if current user is admin
  // let isAdmin = teamMembers?.find(
  //   (member) =>
  //     member.id === userId &&
  //     member.role &&
  //     (member.role === "admin" || member.role === "owner")
  // );
  // let isAdmin = true;

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
      if (!isCheckedIn) {
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
        date: format(selectedDate, "yyyy-MM-dd"),
        completed: checked,
      });

      // Refetch to ensure data consistency
      refetch?.();
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

  // Get assigned users
  const assignedUsers =
    task.assignments
      ?.map((assignment) => {
        const user = teamMembers.find(
          (member) => member.id === assignment.userId
        );
        return user;
      })
      .filter(Boolean) || [];

  const isThisTaskAssignedToMe = assignedUsers.some(
    (user) => user?.id === userId
  );
  if (!isThisTaskAssignedToMe && hideNotAssignedToMe && !childTasks.length) {
    return null;
  }

  return (
    <>
      <div className={className}>
        <div
          className={cn(
            "flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors",
            isCompleted && "bg-muted/30"
          )}
          style={{ paddingLeft: `${(level + 1) * 12}px` }}
        >
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-start gap-2">
              {childTasks.length > 0 ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 mt-0.5"
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
                className="data-[state=checked]:bg-green-600 mt-0.5"
              />
              <span className="flex-1 leading-tight">{task.title}</span>

              {isAdmin && (
                <div className="flex items-center gap-2">
                  {hideTools ? (
                    <>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onAddSubtask?.(task.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Subtask
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            {task.teamId && (
                              <TaskAssignmentDialog
                                taskId={task.id}
                                teamId={task.teamId}
                                currentAssigneeId={assignedUsers[0]?.id}
                                teamMembers={teamMembers}
                                taskAssignments={task.assignments}
                                refetchMembers={refetch}
                                hideButtonBorder={true}
                              />
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditTask?.(task)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeleteTask?.(task.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onMoveTask?.(task.id, "up")}
                        disabled={isFirst}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onMoveTask?.(task.id, "down")}
                        disabled={isLast}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      {task.teamId && (
                        <TaskAssignmentDialog
                          taskId={task.id}
                          teamId={task.teamId}
                          currentAssigneeId={assignedUsers[0]?.id}
                          teamMembers={teamMembers}
                          taskAssignments={task.assignments}
                          refetchMembers={refetch}
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEditTask?.(task)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onDeleteTask?.(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onAddSubtask?.(task.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onMoveTask?.(task.id, "up")}
                        disabled={isFirst}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onMoveTask?.(task.id, "down")}
                        disabled={isLast}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
            {assignedUsers.length > 0 && (
              <div className="flex gap-1 text-xs text-muted-foreground pl-7">
                Assigned to:{" "}
                {assignedUsers.map((user, index) => (
                  <div
                    key={user?.id}
                    className="flex gap-1 text-xs text-muted-foreground"
                  >
                    <span className="font-medium">
                      {user?.id === userId ? "Me" : user?.name}
                      {index < assignedUsers.length - 1 && ","}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {completedBy && (
              <div className="flex gap-1 text-xs text-muted-foreground pl-7">
                Completed by:{" "}
                <span className="font-medium">
                  {
                    teamMembers.find((member) => member.id === completedBy)
                      ?.name
                  }{" "}
                  {`at ${format(
                    new Date(
                      completions.find((c) => c.taskId === task.id)
                        ?.completedAt ?? new Date()
                    ),
                    "HH:mm"
                  )}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      {expanded && childTasks.length > 0 && (
        <div className="space-y-1">
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
              refetch={refetch}
              isAdmin={isAdmin}
              hideTools={hideTools}
              isCheckedIn={isCheckedIn}
            />
          ))}
        </div>
      )}
      <TaskCompletionModal
        taskTitle={task.title}
        isOpen={showCompletionModal}
        isChecking={pendingCompletion}
        onConfirm={handleConfirmCompletion}
        onCancel={handleCancelCompletion}
        // isCompleted={isCompleted}
      />
    </>
  );
}
