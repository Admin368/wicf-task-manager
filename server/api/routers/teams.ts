import { z } from "zod";
import { router, publicProcedure } from "@/lib/trpc/server";
import { protectedProcedure, withSupabase } from "../middleware";
import { slugify } from "@/lib/utils";

export const teamsRouter = router({
  getAll: publicProcedure.use(withSupabase).query(async ({ ctx }) => {
    try {
      const { data: teams, error } = await ctx.supabase
        .from("teams")
        .select("id, name, slug, created_at");

      if (error) throw error;
      return teams || [];
    } catch (error) {
      console.error("Error fetching teams:", error);
      return [];
    }
  }),

  getBySlug: publicProcedure
    .use(withSupabase)
    .input(
      z.object({
        slug: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { data: team, error } = await ctx.supabase
          .from("teams")
          .select("id, name, slug, created_at, password")
          .eq("slug", input.slug)
          .single();

        if (error) throw error;
        return team;
      } catch (error) {
        console.error("Error fetching team:", error);
        return null;
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        password: z.string().min(4),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Generate slug from name
        let slug = slugify(input.name);

        // Check if slug already exists
        const { data: existingTeam } = await ctx.supabase
          .from("teams")
          .select("id")
          .eq("slug", slug)
          .single();

        // If slug exists, append a random number
        if (existingTeam) {
          slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        }

        const { data, error } = await ctx.supabase
          .from("teams")
          .insert({
            name: input.name,
            slug,
            password: input.password, // In a real app, you'd hash this
          })
          .select()
          .single();

        if (error) throw error;

        // Add the creator as a team member with 'admin' role
        await ctx.supabase.from("team_members").insert({
          team_id: data.id,
          user_id: ctx.userId,
          role: "admin",
        });

        return data;
      } catch (error) {
        console.error("Error creating team:", error);
        throw error;
      }
    }),

  join: protectedProcedure
    .input(
      z.object({
        teamId: z.string().uuid(),
        password: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify password
        const { data: team, error: teamError } = await ctx.supabase
          .from("teams")
          .select("password")
          .eq("id", input.teamId)
          .single();

        if (teamError) throw teamError;
        if (team.password !== input.password) {
          throw new Error("Incorrect password");
        }

        // Check if user is already a member
        const { data: existingMembership } = await ctx.supabase
          .from("team_members")
          .select("*")
          .eq("team_id", input.teamId)
          .eq("user_id", ctx.userId)
          .single();

        // If not already a member, add them
        if (!existingMembership) {
          const { error: memberError } = await ctx.supabase
            .from("team_members")
            .insert({
              team_id: input.teamId,
              user_id: ctx.userId,
              role: "member",
            });

          if (memberError) throw memberError;
        }

        return { success: true };
      } catch (error) {
        console.error("Error joining team:", error);
        throw error;
      }
    }),

  verifyAccess: protectedProcedure
    .input(
      z.object({
        teamId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { data, error } = await ctx.supabase
          .from("team_members")
          .select("*")
          .eq("team_id", input.teamId)
          .eq("user_id", ctx.userId)
          .single();

        if (error) return { hasAccess: false };
        return { hasAccess: !!data };
      } catch (error) {
        console.error("Error verifying team access:", error);
        return { hasAccess: false };
      }
    }),

  delete: protectedProcedure
    .input(
      z.object({
        teamId: z.string().uuid(),
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
          throw new Error("You don't have permission to delete this team");
        }

        // Delete all team-related data in a transaction
        console.log("Deleting team:", input.teamId);
        const { error } = await ctx.supabase.rpc("delete_team", {
          team_id: input.teamId,
        });

        if (error) throw error;

        return { success: true };
      } catch (error) {
        console.error("Error deleting team:", error);
        throw error;
      }
    }),
});
