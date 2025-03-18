"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Plus, Users, AlertTriangle, Loader2 } from "lucide-react";
import { api } from "@/lib/trpc/client";
import { DatePicker } from "./date-picker";
import { TaskItem } from "./task-item";
import { TaskDialog } from "./task-dialog";
import { useUser } from "./user-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { UserList } from "./user-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Task } from "@/types/task";

export function TaskList({
  teamId,
  teamName,
}: {
  teamId: string;
  teamName: string;
}) {
  const { userId, userName } = useUser();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const formattedDate = format(selectedDate, "yyyy-MM-dd");

  // Fetch tasks and completions for the specific team
  const {
    data: tasks,
    isLoading: isLoadingTasks,
    error: tasksError,
  } = api.tasks.getByTeam.useQuery(
    { teamId },
    {
      onError: (err) => {
        console.error("Error fetching tasks:", err);
        setError("Failed to load tasks. Please try refreshing the page.");
      },
    }
  );

  const {
    data: completions,
    isLoading: isLoadingCompletions,
    error: completionsError,
    refetch: refetchCompletions,
  } = api.completions.getByDate.useQuery(
    { date: formattedDate },
    {
      refetchInterval: 10000,
      onError: (err) => {
        console.error("Error fetching completions:", err);
        setError(
          "Failed to load task completions. Please try refreshing the page."
        );
      },
    }
  );

  // Fetch team members instead of all users
  const {
    data: teamMembers,
    isLoading: isLoadingMembers,
    error: membersError,
  } = api.users.getTeamMembers.useQuery(
    { teamId },
    {
      onError: (err) => {
        console.error("Error fetching team members:", err);
        setError(
          "Failed to load team members. Please try refreshing the page."
        );
      },
    }
  );

  // Mutations
  const createTask = api.tasks.create.useMutation({
    onError: (err) => {
      console.error("Error creating task:", err);
      setError("Failed to create task. Please try again.");
    },
  });

  const updateTask = api.tasks.update.useMutation({
    onError: (err) => {
      console.error("Error updating task:", err);
      setError("Failed to update task. Please try again.");
    },
  });

  const deleteTask = api.tasks.delete.useMutation({
    onError: (err) => {
      console.error("Error deleting task:", err);
      setError("Failed to delete task. Please try again.");
    },
  });

  const utils = api.useContext();

  // Get top-level tasks
  const topLevelTasks =
    tasks
      ?.filter((task: Task) => task.parent_id === null)
      .sort((a: Task, b: Task) => a.position - b.position) || [];

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddTask = async (data: {
    title: string;
    parentId: string | null;
  }) => {
    try {
      setError(null);
      await createTask.mutateAsync({
        title: data.title,
        parentId: data.parentId,
        teamId,
      });

      utils.tasks.getByTeam.invalidate({ teamId });
      setShowTaskDialog(false);
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleEditTask = async (data: {
    title: string;
    parentId: string | null;
  }) => {
    if (!editingTask) return;

    try {
      setError(null);
      await updateTask.mutateAsync({
        id: editingTask.id,
        title: data.title,
        parentId: data.parentId,
      });

      utils.tasks.getByTeam.invalidate({ teamId });
      setEditingTask(null);
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this task and all its subtasks?"
      )
    )
      return;

    try {
      setError(null);
      await deleteTask.mutateAsync({ id: taskId });
      utils.tasks.getByTeam.invalidate({ teamId });
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleAddSubtask = (parentId: string) => {
    // Find the parent task
    const parentTask = tasks?.find((t: Task) => t.id === parentId);
    if (parentTask) {
      // Set the initial data with parent_id
      setEditingTask({ parent_id: parentId });
      setShowTaskDialog(true);
    }
  };

  const handleDismissError = () => {
    setError(null);
  };

  const handleMoveTask = async (taskId: string, direction: "up" | "down") => {
    try {
      // Find the task and its siblings
      const task = tasks?.find((t: Task) => t.id === taskId);
      if (!task) return;

      const siblingTasks = tasks
        ?.filter((t: Task) => t.parent_id === task.parent_id)
        .sort((a: Task, b: Task) => a.position - b.position);

      const currentIndex = siblingTasks.findIndex((t: Task) => t.id === taskId);
      if (currentIndex === -1) return;

      // Calculate new index
      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= siblingTasks.length) return;

      // Create a new array with the updated order
      const newTasks = [...siblingTasks];
      const [movedTask] = newTasks.splice(currentIndex, 1);
      newTasks.splice(newIndex, 0, movedTask);

      // Calculate new positions for all affected tasks
      const updates = newTasks.map((task: Task, index: number) => ({
        id: task.id,
        position: calculateNewPosition(index, index, newTasks),
      }));

      // Update task positions in batch
      await updateTask.mutateAsync({
        updates,
        teamId,
      });

      // Invalidate tasks query to refresh the list
      utils.tasks.getByTeam.invalidate({ teamId });
    } catch (error) {
      console.error("Error moving task:", error);
      setError("Failed to move task. Please try again.");
    }
  };

  const calculateNewPosition = (
    oldIndex: number,
    newIndex: number,
    tasks: Task[]
  ) => {
    if (tasks.length === 0) return 0;
    if (tasks.length === 1) return tasks[0].position;

    // If moving to start
    if (newIndex === 0) {
      return Math.max(0, tasks[0].position - 1000);
    }

    // If moving to end
    if (newIndex === tasks.length - 1) {
      return tasks[tasks.length - 1].position + 1000;
    }

    // Moving between two tasks - ensure integer result
    const beforePosition = tasks[newIndex - 1].position;
    const afterPosition = tasks[newIndex].position;
    return Math.floor(beforePosition + (afterPosition - beforePosition) / 2);
  };

  if (!userId) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading user...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{teamName}</h1>
          <div className="text-sm text-muted-foreground">
            Logged in as: {userName}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={handleDismissError}>
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <DatePicker date={selectedDate} onDateChange={handleDateChange} />

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUserList(!showUserList)}
              disabled={isLoadingMembers}
            >
              {isLoadingMembers ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Team Members ({teamMembers?.length || 0})
                </>
              )}
            </Button>

            <Button
              onClick={() => {
                setEditingTask(null);
                setShowTaskDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              {/* Add Task */}
            </Button>
          </div>
        </div>

        {showUserList && teamMembers && (
          <UserList
            teamMembers={teamMembers}
            onClose={() => setShowUserList(false)}
          />
        )}

        <div className="border rounded-md">
          <div className="p-4 border-b bg-muted/50">
            <h2 className="font-semibold">
              Tasks for {format(selectedDate, "MMMM d, yyyy")}
            </h2>
          </div>
          <div className="p-4 border-b bg-muted/50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchCompletions?.();
              }}
            >
              Refresh
            </Button>
          </div>

          <div className="p-2">
            {isLoadingTasks || isLoadingCompletions ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-2 p-2">
                    <Skeleton className="h-4 w-4 rounded-sm" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            ) : tasksError || completionsError ? (
              <div className="text-center py-8 text-destructive">
                <p>Failed to load tasks. Please try refreshing the page.</p>
              </div>
            ) : tasks?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No tasks found. Add your first task to get started.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4">
                {error && (
                  <div className="mb-4 text-sm text-red-500">{error}</div>
                )}

                {isLoadingTasks || isLoadingCompletions ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div>
                    {topLevelTasks.map((task: Task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        tasks={tasks}
                        completions={completions || []}
                        teamMembers={teamMembers || []}
                        selectedDate={selectedDate.toISOString().split("T")[0]}
                        onAddSubtask={handleAddSubtask}
                        onEditTask={handleEditTask}
                        onDeleteTask={handleDeleteTask}
                        onMoveTask={handleMoveTask}
                        refetchCompletions={refetchCompletions}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Dialog for adding/editing tasks */}
      {showTaskDialog && (
        <TaskDialog
          open={showTaskDialog}
          onClose={() => {
            setShowTaskDialog(false);
            setEditingTask(null);
          }}
          onSubmit={editingTask?.id ? handleEditTask : handleAddTask}
          title={editingTask?.id ? "Edit Task" : "Add Task"}
          initialData={editingTask}
          tasks={tasks || []}
          teamId={teamId}
        />
      )}
    </div>
  );
}
