import { z } from "zod"
import { router } from "@/lib/trpc/server"
import { withSupabase } from "../middleware"

export const tasksRouter = router({
  getAll: withSupabase.query(async ({ ctx }) => {
    try {
      const { data: tasks, error } = await ctx.supabase.from("tasks").select("*").order("position")

      if (error) throw error
      return tasks || []
    } catch (error) {
      console.error("Error fetching tasks:", error)
      return []
    }
  }),

  create: withSupabase
    .input(
      z.object({
        title: z.string().min(1),
        parentId: z.string().uuid().nullable(),
        position: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // If position is not provided, get the max position for the parent and add 1
        let position = input.position
        if (position === undefined) {
          const { data } = await ctx.supabase
            .from("tasks")
            .select("position")
            .eq("parent_id", input.parentId)
            .order("position", { ascending: false })
            .limit(1)

          position = data && data.length > 0 ? data[0].position + 1 : 0
        }

        const { data, error } = await ctx.supabase
          .from("tasks")
          .insert({
            title: input.title,
            parent_id: input.parentId,
            position,
          })
          .select()
          .single()

        if (error) throw error
        return data
      } catch (error) {
        console.error("Error creating task:", error)
        throw error
      }
    }),

  update: withSupabase
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        parentId: z.string().uuid().nullable().optional(),
        position: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { data, error } = await ctx.supabase
          .from("tasks")
          .update({
            ...(input.title && { title: input.title }),
            ...(input.parentId !== undefined && { parent_id: input.parentId }),
            ...(input.position !== undefined && { position: input.position }),
          })
          .eq("id", input.id)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (error) {
        console.error("Error updating task:", error)
        throw error
      }
    }),

  delete: withSupabase
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // First, recursively delete all child tasks
        const deleteTaskAndChildren = async (taskId: string) => {
          // Get all children
          const { data: children } = await ctx.supabase.from("tasks").select("id").eq("parent_id", taskId)

          // Recursively delete children
          if (children && children.length > 0) {
            for (const child of children) {
              await deleteTaskAndChildren(child.id)
            }
          }

          // Delete the task
          await ctx.supabase.from("tasks").delete().eq("id", taskId)
        }

        await deleteTaskAndChildren(input.id)

        return { success: true }
      } catch (error) {
        console.error("Error deleting task:", error)
        throw error
      }
    }),
})

