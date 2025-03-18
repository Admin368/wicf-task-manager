import { z } from "zod";
import { router } from "@/lib/trpc/server";
import { protectedProcedure } from "../middleware";

export const completionsRouter = router({
  getByDate: protectedProcedure
    .input(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { data: completions, error } = await ctx.supabase
          .from("completions")
          .select("*")
          .eq("completed_date", input.date);

        if (error) throw error;
        return completions || [];
      } catch (error) {
        console.error("Error fetching completions:", error);
        return [];
      }
    }),

  toggle: protectedProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
        userId: z.string().uuid(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
        completed: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { data: task, error: taskError } = await ctx.supabase
          .from("tasks")
          .select("*")
          .eq("id", input.taskId)
          .single();

        if (taskError) throw taskError;

        if (input.completed) {
          // Check if this is a parent task
          const { data: childTasks, error: childTasksError } = await ctx.supabase
            .from("tasks")
            .select("id")
            .eq("parent_id", input.taskId);

          if (childTasksError) throw childTasksError;

          if (childTasks && childTasks.length > 0) {
            // For a parent task, we need to make sure all child tasks are completed
            const childTaskIds = childTasks.map((child: { id: string }) => child.id);
            
            const { data: childCompletions, error: childCompletionsError } = await ctx.supabase
              .from("completions")
              .select("task_id")
              .in("task_id", childTaskIds)
              .eq("completed_date", input.date);

            if (childCompletionsError) throw childCompletionsError;
            
            const completedChildTaskIds = childCompletions?.map((c: { task_id: string }) => c.task_id) || [];
            const allChildrenComplete = childTaskIds.every((id: string) => completedChildTaskIds.includes(id));
            
            if (!allChildrenComplete) {
              throw new Error("Cannot complete parent task - not all subtasks are complete");
            }
          }
          
          // Get all users from the database
          const { data: users, error: usersError } = await ctx.supabase
            .from("users")
            .select("id");

          if (usersError) throw usersError;

          // Add completion for all users, marking the original user as the completer
          const completions = (users || []).map((user: { id: string }) => ({
            task_id: input.taskId,
            user_id: user.id,
            completed_date: input.date,
            completed_by: input.userId, // Track who completed it
          }));

          const { data, error } = await ctx.supabase
            .from("completions")
            .insert(completions)
            .select();

          if (error && error.code !== "23505") throw error; // Ignore unique violation errors
          
          // If this is a subtask, check if all siblings are now complete to possibly complete the parent
          if (task.parent_id) {
            // Get all sibling tasks (tasks with the same parent)
            const { data: siblingTasks, error: siblingTasksError } = await ctx.supabase
              .from("tasks")
              .select("id")
              .eq("parent_id", task.parent_id);
              
            if (siblingTasksError) throw siblingTasksError;
            
            if (siblingTasks && siblingTasks.length > 0) {
              const siblingTaskIds = siblingTasks.map((sibling: { id: string }) => sibling.id);
              
              // Get completions for all siblings
              const { data: siblingCompletions, error: siblingCompletionsError } = await ctx.supabase
                .from("completions")
                .select("task_id")
                .in("task_id", siblingTaskIds)
                .eq("completed_date", input.date);
                
              if (siblingCompletionsError) throw siblingCompletionsError;
              
              const completedSiblingTaskIds = siblingCompletions?.map((c: { task_id: string }) => c.task_id) || [];
              const allSiblingsComplete = siblingTaskIds.every((id: string) => completedSiblingTaskIds.includes(id));
              
              // If all siblings are complete, mark parent as complete too
              if (allSiblingsComplete) {
                // Get all users again for parent task completion
                const userCompletions = (users || []).map((user: { id: string }) => ({
                  task_id: task.parent_id,
                  user_id: user.id,
                  completed_date: input.date,
                  completed_by: input.userId, // Same user completes the parent
                }));
                
                await ctx.supabase
                  .from("completions")
                  .insert(userCompletions);
              }
            }
          }
          
          return data;
        } else {
          // Remove completion for all users
          const { error } = await ctx.supabase
            .from("completions")
            .delete()
            .eq("task_id", input.taskId)
            .eq("completed_date", input.date);

          if (error) throw error;
          
          // If a child task is being unchecked, also uncheck the parent
          if (task.parent_id) {
            await ctx.supabase
              .from("completions")
              .delete()
              .eq("task_id", task.parent_id)
              .eq("completed_date", input.date);
          }
          
          return null;
        }
      } catch (error) {
        console.error("Error toggling completion:", error);
        throw error;
      }
    }),
});
