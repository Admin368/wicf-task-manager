import { z } from "zod"
import { router } from "@/lib/trpc/server"
import { withSupabase } from "../middleware"

export const usersRouter = router({
  getAll: withSupabase.query(async ({ ctx }) => {
    try {
      const { data: users, error } = await ctx.supabase.from("users").select("*").order("name")

      if (error) throw error
      return users || []
    } catch (error) {
      console.error("Error fetching users:", error)
      return []
    }
  }),

  getOrCreate: withSupabase
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        avatarUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // First try to find by email if provided
        if (input.email) {
          const { data: existingUser } = await ctx.supabase
            .from("users")
            .select("*")
            .eq("email", input.email)
            .maybeSingle()

          if (existingUser) return existingUser
        }

        // Otherwise create a new user
        const { data, error } = await ctx.supabase
          .from("users")
          .insert({
            name: input.name,
            email: input.email || null,
            avatar_url: input.avatarUrl || null,
          })
          .select()
          .single()

        if (error) throw error
        return data
      } catch (error) {
        console.error("Error creating user:", error)
        throw error
      }
    }),
})

