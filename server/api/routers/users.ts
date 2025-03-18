import { z } from "zod";
import { router, publicProcedure } from "@/lib/trpc/server";
import { protectedProcedure, withSupabase } from "../middleware";

export const usersRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    try {
      const { data: users, error } = await ctx.supabase
        .from("users")
        .select("*")
        .order("name");

      if (error) throw error;
      return users || [];
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  }),

  getTeamMembers: protectedProcedure
    .input(
      z.object({
        teamId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // First verify the user has access to this team
        const { data: membership, error: membershipError } = await ctx.supabase
          .from("team_members")
          .select("*")
          .eq("team_id", input.teamId)
          .eq("user_id", ctx.userId)
          .single();

        if (membershipError || !membership) {
          throw new Error("You don't have access to this team");
        }

        // Get all team members with user details
        const { data, error } = await ctx.supabase
          .from("team_members")
          .select(
            `
            user_id,
            role,
            users:user_id (
              id,
              name,
              email,
              avatar_url
            )
          `
          )
          .eq("team_id", input.teamId);

        if (error) throw error;

        // Transform the data to a more usable format
        const members = data.map((member) => ({
          id: member.user_id,
          role: member.role,
          ...member.users,
        }));

        return members || [];
      } catch (error) {
        console.error("Error fetching team members:", error);
        return [];
      }
    }),

  getOrCreate: publicProcedure
    .use(withSupabase)
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        avatarUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // First try to find by email if provided
        if (input.email) {
          const { data: existingUser } = await ctx.supabase
            .from("users")
            .select("*")
            .eq("email", input.email)
            .maybeSingle();

          if (existingUser) return existingUser;
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
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error creating user:", error);
        throw error;
      }
    }),

  updateRole: protectedProcedure
    .input(
      z.object({
        teamId: z.string().uuid(),
        userId: z.string().uuid(),
        role: z.enum(["member", "admin"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // First verify the current user is an admin
        const { data: currentUserRole, error: roleError } = await ctx.supabase
          .from("team_members")
          .select("role")
          .eq("team_id", input.teamId)
          .eq("user_id", ctx.userId)
          .single();

        if (roleError) throw new Error("Failed to verify user role");
        if (
          !currentUserRole ||
          !["admin", "owner"].includes(currentUserRole.role)
        ) {
          throw new Error("You don't have permission to update roles");
        }

        // Update the target user's role
        const { error: updateError } = await ctx.supabase
          .from("team_members")
          .update({ role: input.role })
          .eq("team_id", input.teamId)
          .eq("user_id", input.userId)
          .not("role", "eq", "owner"); // Prevent updating owner's role

        if (updateError) throw updateError;

        return { success: true };
      } catch (error) {
        console.error("Error updating user role:", error);
        throw error;
      }
    }),
});
