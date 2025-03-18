import { z } from "zod";
import { router, publicProcedure } from "@/lib/trpc/server";
import { protectedProcedure, withSupabase } from "../middleware";

export const checkInsRouter = router({
  getByTeamAndDate: protectedProcedure
    .input(
      z.object({
        teamId: z.string().uuid(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
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

        // Get check-ins with user details
        const { data, error } = await ctx.supabase
          .from("check_ins")
          .select(`
            id,
            user_id,
            check_in_date,
            checked_in_at,
            notes,
            users:user_id (
              id,
              name,
              email,
              avatar_url
            )
          `)
          .eq("team_id", input.teamId)
          .eq("check_in_date", input.date)
          .order("checked_in_at");

        if (error) throw error;
        
        // Transform the data to a more usable format
        const checkIns = data.map((checkIn: any) => ({
          id: checkIn.id,
          userId: checkIn.user_id,
          checkInDate: checkIn.check_in_date,
          checkedInAt: checkIn.checked_in_at,
          notes: checkIn.notes,
          user: checkIn.users,
        }));

        return checkIns || [];
      } catch (error) {
        console.error("Error fetching check-ins:", error);
        return [];
      }
    }),

  getHistory: protectedProcedure
    .input(
      z.object({
        teamId: z.string().uuid(),
        limit: z.number().min(1).max(100).optional().default(30),
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

        // Get daily check-in counts for the past X days
        const { data, error } = await ctx.supabase.rpc(
          'get_daily_check_in_counts',
          { 
            team_id_param: input.teamId,
            days_limit: input.limit
          }
        );

        if (error) {
          // If the RPC function doesn't exist, fall back to a regular query
          // This is for development purposes and can be removed later
          const { data: fallbackData, error: fallbackError } = await ctx.supabase
            .from("check_ins")
            .select("check_in_date, count(*)")
            .eq("team_id", input.teamId)
            .group("check_in_date")
            .order("check_in_date", { ascending: false })
            .limit(input.limit);

          if (fallbackError) throw fallbackError;
          return fallbackData || [];
        }

        return data || [];
      } catch (error) {
        console.error("Error fetching check-in history:", error);
        return [];
      }
    }),

  getUserCheckInStatus: protectedProcedure
    .input(
      z.object({
        teamId: z.string().uuid(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { data, error } = await ctx.supabase
          .from("check_ins")
          .select("*")
          .eq("team_id", input.teamId)
          .eq("user_id", ctx.userId)
          .eq("check_in_date", input.date)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw error;
        }

        return {
          checkedIn: !!data,
          checkInDetails: data || null
        };
      } catch (error) {
        console.error("Error fetching user check-in status:", error);
        return { checkedIn: false, checkInDetails: null };
      }
    }),

  checkIn: protectedProcedure
    .input(
      z.object({
        teamId: z.string().uuid(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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

        // Check if the user already checked in today
        const { data: existingCheckIn, error: checkInError } = await ctx.supabase
          .from("check_ins")
          .select("id")
          .eq("team_id", input.teamId)
          .eq("user_id", ctx.userId)
          .eq("check_in_date", input.date)
          .single();

        if (existingCheckIn) {
          return { success: true, message: "Already checked in", alreadyCheckedIn: true };
        }

        // Create the check-in record
        const { data, error } = await ctx.supabase
          .from("check_ins")
          .insert({
            team_id: input.teamId,
            user_id: ctx.userId,
            check_in_date: input.date,
            notes: input.notes || null,
          })
          .select()
          .single();

        if (error) throw error;
        
        return { 
          success: true,
          message: "Successfully checked in",
          alreadyCheckedIn: false,
          checkIn: data
        };
      } catch (error) {
        console.error("Error checking in:", error);
        throw error;
      }
    }),
}); 