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
        if (input.completed) {
          // Get all users from the database
          const { data: users, error: usersError } = await ctx.supabase
            .from("users")
            .select("id");

          if (usersError) throw usersError;

          // Add completion for all users, marking the original user as the completer
          const completions = users.map(user => ({
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
          return data;
        } else {
          // Remove completion for all users
          const { error } = await ctx.supabase
            .from("completions")
            .delete()
            .eq("task_id", input.taskId)
            .eq("completed_date", input.date);

          if (error) throw error;
          return null;
        }
      } catch (error) {
        console.error("Error toggling completion:", error);
        throw error;
      }
    }),
});
