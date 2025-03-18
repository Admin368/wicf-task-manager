import { z } from "zod";
import { router, publicProcedure } from "@/lib/trpc/server";
import { protectedProcedure } from "../middleware";

export const tasksRouter = router({
  getByTeam: protectedProcedure
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

        const { data: tasks, error } = await ctx.supabase
          .from("tasks")
          .select("*")
          .eq("team_id", input.teamId)
          .order("position");

        if (error) throw error;
        return tasks || [];
      } catch (error) {
        console.error("Error fetching team tasks:", error);
        return [];
      }
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Get user's teams
      const { data: memberships, error: membershipError } = await ctx.supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", ctx.userId);
      
      if (membershipError) throw membershipError;
      
      // If user is not in any teams, return empty array
      if (!memberships || memberships.length === 0) {
        return [];
      }
      
      const teamIds = memberships.map(m => m.team_id);
      
      const { data: tasks, error } = await ctx.supabase
        .from("tasks")
        .select("*")
        .in("team_id", teamIds)
        .order("position");

      if (error) throw error;
      return tasks || [];
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return [];
    }
  }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        parentId: z.string().uuid().nullable(),
        teamId: z.string().uuid(),
        position: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify user has access to the team
        const { data: membership, error: membershipError } = await ctx.supabase
          .from("team_members")
          .select("*")
          .eq("team_id", input.teamId)
          .eq("user_id", ctx.userId)
          .single();

        if (membershipError || !membership) {
          throw new Error("You don't have access to this team");
        }

        // If position is not provided, get the max position for the parent and add 1
        let position = input.position;
        if (position === undefined) {
          const { data } = await ctx.supabase
            .from("tasks")
            .select("position")
            .eq("parent_id", input.parentId)
            .eq("team_id", input.teamId)
            .order("position", { ascending: false })
            .limit(1);

          position = data && data.length > 0 ? data[0].position + 1 : 0;
        }

        const { data, error } = await ctx.supabase
          .from("tasks")
          .insert({
            title: input.title,
            parent_id: input.parentId,
            team_id: input.teamId,
            position,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error creating task:", error);
        throw error;
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        parentId: z.string().uuid().nullable().optional(),
        teamId: z.string().uuid().optional(),
        position: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get current task to check team
        const { data: task, error: taskError } = await ctx.supabase
          .from("tasks")
          .select("team_id")
          .eq("id", input.id)
          .single();
        
        if (taskError) throw taskError;
        
        // Verify user has access to the team
        const { data: membership, error: membershipError } = await ctx.supabase
          .from("team_members")
          .select("*")
          .eq("team_id", task.team_id)
          .eq("user_id", ctx.userId)
          .single();

        if (membershipError || !membership) {
          throw new Error("You don't have access to this team");
        }

        const { data, error } = await ctx.supabase
          .from("tasks")
          .update({
            ...(input.title && { title: input.title }),
            ...(input.parentId !== undefined && { parent_id: input.parentId }),
            ...(input.teamId && { team_id: input.teamId }),
            ...(input.position !== undefined && { position: input.position }),
          })
          .eq("id", input.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error updating task:", error);
        throw error;
      }
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get current task to check team
        const { data: task, error: taskError } = await ctx.supabase
          .from("tasks")
          .select("team_id")
          .eq("id", input.id)
          .single();
        
        if (taskError) throw taskError;
        
        // Verify user has access to the team
        const { data: membership, error: membershipError } = await ctx.supabase
          .from("team_members")
          .select("*")
          .eq("team_id", task.team_id)
          .eq("user_id", ctx.userId)
          .single();

        if (membershipError || !membership) {
          throw new Error("You don't have access to this team");
        }

        // First, recursively delete all child tasks
        const deleteTaskAndChildren = async (taskId: string) => {
          // Get all children
          const { data: children } = await ctx.supabase
            .from("tasks")
            .select("id")
            .eq("parent_id", taskId);

          // Recursively delete children
          if (children && children.length > 0) {
            for (const child of children) {
              await deleteTaskAndChildren(child.id);
            }
          }

          // Delete the task
          await ctx.supabase.from("tasks").delete().eq("id", taskId);
        };

        await deleteTaskAndChildren(input.id);

        return { success: true };
      } catch (error) {
        console.error("Error deleting task:", error);
        throw error;
      }
    }),
});
