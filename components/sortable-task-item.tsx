"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskItem } from "./task-item";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/task";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useUser } from "./user-provider";

interface SortableTaskItemProps {
  id: string;
  task: Task;
  tasks: Task[];
  completions: any[];
  teamMembers: any[];
  selectedDate: string;
  level?: number;
  onAddSubtask?: (parentId: string) => void;
  onEditTask?: (task: any) => void;
  onDeleteTask?: (taskId: string) => void;
  className?: string;
  refetchCompletions?: () => void;
  onDragEnd?: (event: DragEndEvent) => void;
}

export function SortableTaskItem({
  id,
  task,
  tasks,
  completions,
  teamMembers,
  selectedDate,
  level = 0,
  onAddSubtask,
  onEditTask,
  onDeleteTask,
  className,
  refetchCompletions,
  onDragEnd,
}: SortableTaskItemProps) {
  const { userId } = useUser();

  // Check if current user is admin
  const isAdmin = teamMembers?.find(
    (member) =>
      member.id === userId &&
      member.role &&
      (member.role === "admin" || member.role === "owner")
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isAdmin });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Get child tasks
  const childTasks = tasks
    .filter((t) => t.parent_id === task.id)
    .sort((a, b) => a.position - b.position);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(isDragging && "opacity-50")}
    >
      <TaskItem
        task={task}
        tasks={tasks}
        completions={completions}
        teamMembers={teamMembers}
        selectedDate={selectedDate}
        level={level}
        onAddSubtask={onAddSubtask}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
        className={className}
        refetchCompletions={refetchCompletions}
        dragHandleProps={isAdmin ? listeners : undefined}
      />

      {childTasks.length > 0 && (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <SortableContext
            items={childTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="ml-4">
              {childTasks.map((childTask) => (
                <SortableTaskItem
                  key={childTask.id}
                  id={childTask.id}
                  task={childTask}
                  tasks={tasks}
                  completions={completions}
                  teamMembers={teamMembers}
                  selectedDate={selectedDate}
                  level={level + 1}
                  onAddSubtask={onAddSubtask}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                  refetchCompletions={refetchCompletions}
                  onDragEnd={onDragEnd}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
