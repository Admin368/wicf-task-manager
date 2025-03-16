import { z } from "zod"
import { router } from "@/lib/trpc/server"
import { withSupabase } from "../middleware"

export const completionsRouter = router({
  getByDate: withSupabase
    .input(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const { data: completions, error } = await ctx.supabase
          .from("completions")
          .select("*")
          .eq("completed_date", input.date)

        if (error) throw error
        return completions || []
      } catch (error) {
        console.error("Error fetching completions:", error)
        return []
      }
    }),

  toggle: withSupabase
    .input(
      z.object({
        taskId: z.string().uuid(),
        userId: z.string().uuid(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
        completed: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (input.completed) {
          // Add completion
          const { data, error } = await ctx.supabase
            .from("completions")
            .insert({
              task_id: input.taskId,
              user_id: input.userId,
              completed_date: input.date,
            })
            .select()
            .single()

          if (error && error.code !== "23505") throw error // Ignore unique violation errors
          return data
        } else {
          // Remove completion
          const { error } = await ctx.supabase
            .from("completions")
            .delete()
            .eq("task_id", input.taskId)
            .eq("user_id", input.userId)
            .eq("completed_date", input.date)

          if (error) throw error
          return null
        }
      } catch (error) {
        console.error("Error toggling completion:", error)
        throw error
      }
    }),
})

