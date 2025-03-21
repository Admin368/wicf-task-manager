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
  Copy,
  UserCircle,
  CalendarClock,
  Users,
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
import { TaskCompletionModal } from "./task-completion-modal";
import { format } from "date-fns";
import { toast } from "sonner";
import { TaskAssignmentDialog } from "./task-assignment-dialog";
// import { TaskCompletion } from "@prisma/client";
import { serverGetTeamMembersReturnType } from "@/server/api/routers/users";
import {
  serverGetCompletionsReturnType,
  serverGetTasksReturnType,
} from "@/server/api/routers/tasks";
// import { Task } from "@prisma/client";
import { TaskCompletionTime } from "./task-completion-time";

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
  showReorderButtons?: boolean;
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
  showReorderButtons = false,
}: TaskItemProps) {
  const { userId } = useUser();
  const [expanded, setExpanded] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedBy, setCompletedBy] = useState<string | null>(null);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [pendingCompletion, setPendingCompletion] = useState<boolean | null>(
    null
  );
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");
  const teamId = task.teamId || "";

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
      toast.error("Error", {
        description:
          error.message === "You must check in before completing tasks"
            ? "Please check in for today before completing tasks"
            : "Failed to update task status. Please try again.",
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
      setCompletedAt(
        completion.completedAt
          ? new Date(completion.completedAt)
          : completion.completionDate
          ? new Date(completion.completionDate)
          : null
      );
    } else {
      setIsCompleted(false);
      setCompletedBy(null);
      setCompletedAt(null);
    }
  }, [completions, task.id, teamMembers, selectedDate]);

  // Get completer's name
  const completerName = completedBy
    ? teamMembers?.find((m) => m.id === completedBy)?.name || "Unknown User"
    : null;

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
        toast.error("Error", {
          description: "You must check in before completing tasks",
        });
        toast.info("You must check in before completing tasks");
        return;
      }
      // Optimistically update UI
      setIsCompleted(checked);
      if (checked) {
        setCompletedBy(userId);
        setCompletedAt(new Date());
      } else {
        setCompletedBy(null);
        setCompletedAt(null);
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
      setCompletedAt(null);

      // Display the error message
      if (error instanceof Error) {
        toast.error("Error", {
          description:
            error.message || "Failed to update task status. Please try again.",
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

  // Function to copy task title to clipboard
  const copyTaskToClipboard = () => {
    if (navigator?.clipboard && window !== undefined) {
      navigator.clipboard
        .writeText(task.title)
        .then(() => {
          toast.success("Copied to clipboard", {
            description: "Task text copied to clipboard",
          });
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err);
          toast.error("Failed to copy", {
            description: "Could not copy text to clipboard",
          });
        });
    }
  };

  return (
    <>
      <div
        className={cn(
          "group flex flex-col md:flex-row md:items-center justify-between py-2 px-1 md:pr-2 border-b",
          className
        )}
      >
        <div className="flex items-start md:items-center gap-2 min-w-0 flex-1">
          <div
            className={cn("pl-[10px] md:pl-[20px]", {
              "pl-[20px] md:pl-[40px]": level === 1,
              "pl-[30px] md:pl-[60px]": level === 2,
              "pl-[40px] md:pl-[80px]": level === 3,
              "pl-[50px] md:pl-[100px]": level >= 4,
            })}
          >
            {childTasks.length > 0 ? (
              <Button
                variant="ghost"
                size="icon"
                className="w-5 h-5 md:w-6 md:h-6"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
                ) : (
                  <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                )}
              </Button>
            ) : (
              <div className="w-4 md:w-5" />
            )}
          </div>

          {/* Main task content */}
          <div className="flex items-start md:items-center min-w-0 flex-1">
            <Checkbox
              id={task.id}
              checked={isCompleted}
              onCheckedChange={handleCheckboxChange}
              disabled={!isCheckedIn}
              className={cn(
                "transition-opacity mr-2 mt-1 md:mt-0",
                !isCheckedIn && "opacity-50",
                isCompleted && "opacity-50"
              )}
            />
            <div className="flex flex-col min-w-0 flex-1 gap-1">
              <div
                className={cn(
                  "flex items-center flex-wrap min-w-0 break-words",
                  isCompleted && "line-through text-muted-foreground"
                )}
              >
                <div className="break-words flex-1 min-w-0 text-sm md:text-base">
                  {task.title}
                </div>
              </div>

              {/* Assigned users */}
              {assignedUsers.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <UserCircle className="h-3 w-3" />
                  <span>
                    Assigned to:{" "}
                    {assignedUsers.map((user) => user?.name).join(", ")}
                  </span>
                </div>
              )}

              {/* Completed by information */}
              {isCompleted && completerName && (
                <div className="flex flex-col md:flex-row md:items-center gap-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <UserCircle className="h-3 w-3" />
                    <span>Completed by: {completerName}</span>
                  </div>
                  {completedAt && (
                    <TaskCompletionTime
                      completedAt={completedAt}
                      className="md:ml-2"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Task actions - visible on mobile, not just on hover */}
        <div
          className={cn(
            "flex items-center gap-1 mt-2 md:mt-0 self-end md:self-auto",
            !hideTools || showReorderButtons
              ? "md:invisible md:group-hover:visible"
              : ""
          )}
        >
          {/* Move buttons - only show when reordering is enabled */}
          {showReorderButtons && currentIndex !== -1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMoveTask?.(task.id, "up")}
                className="h-7 w-7 md:h-8 md:w-8"
              >
                <ArrowUp className="h-3 w-3 md:h-4 md:w-4" />
                <span className="sr-only">Move Up</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMoveTask?.(task.id, "down")}
                className="h-7 w-7 md:h-8 md:w-8"
              >
                <ArrowDown className="h-3 w-3 md:h-4 md:w-4" />
                <span className="sr-only">Move Down</span>
              </Button>
            </>
          )}

          {!hideTools && (
            <>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onAddSubtask?.(task.id)}
                  className="h-7 w-7 md:h-8 md:w-8"
                >
                  <Plus className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="sr-only">Add Subtask</span>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 md:h-8 md:w-8"
                  >
                    <MoreVertical className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="sr-only">More</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={copyTaskToClipboard}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy text
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem
                      onClick={() => setShowAssignmentDialog(true)}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Manage Assignments
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => onEditTask?.(task)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => onDeleteTask?.(task.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Render children if expanded */}
      {expanded && childTasks.length > 0 && (
        <div className="flex flex-col">
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
              hideNotAssignedToMe={hideNotAssignedToMe}
              isCheckedIn={isCheckedIn}
              showReorderButtons={showReorderButtons}
            />
          ))}
        </div>
      )}

      {/* Task Assignment Dialog */}
      {showAssignmentDialog && (
        <TaskAssignmentDialog
          taskId={task.id}
          teamId={teamId}
          teamMembers={teamMembers}
          taskAssignments={task.assignments || []}
          refetchMembers={refetch}
          hideButtonBorder={true}
          open={showAssignmentDialog}
          onClose={() => setShowAssignmentDialog(false)}
        />
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
