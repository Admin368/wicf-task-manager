import { z } from "zod";
import { router, publicProcedure } from "@/lib/trpc/server";
import { protectedProcedure } from "../middleware";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/lib/prisma";

// Helper function to convert date string to ISO DateTime
function toISODateTime(dateStr: string) {
  const date = new Date(dateStr);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

// Define input schemas
const getByTeamAndDateSchema = z.object({
  teamId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
});

const getHistorySchema = z.object({
  teamId: z.string().uuid(),
  limit: z.number().min(1).max(100).optional().default(30),
});

const getUserCheckInStatusSchema = z.object({
  teamId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
});

const checkInSchema = z.object({
  teamId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  notes: z.string().optional(),
});

export const checkInsRouter = router({
  getByTeamAndDate: protectedProcedure
    .input(getByTeamAndDateSchema)
    .query(async ({ ctx, input }) => {
      try {
        // First verify the user has access to this team
        const membership = await prisma.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: input.teamId,
              userId: ctx.userId!,
            },
          },
        });

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this team",
          });
        }

        // Get check-ins with user details
        const checkIns = await prisma.checkIn.findMany({
          where: {
            teamId: input.teamId,
            checkInDate: toISODateTime(input.date),
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            checkedInAt: "asc",
          },
        });

        return checkIns.map((checkIn) => ({
          id: checkIn.id,
          userId: checkIn.userId,
          checkInDate: checkIn.checkInDate,
          checkedInAt: checkIn.checkedInAt,
          notes: checkIn.notes,
          user: checkIn.user,
        }));
      } catch (error) {
        console.error("Error fetching check-ins:", error);
        if (error instanceof TRPCError) throw error;
        return [];
      }
    }),

  getHistory: protectedProcedure
    .input(getHistorySchema)
    .query(async ({ ctx, input }) => {
      try {
        // First verify the user has access to this team
        const membership = await prisma.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: input.teamId,
              userId: ctx.userId!,
            },
          },
        });

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this team",
          });
        }

        // Get daily check-in counts for the past X days
        const checkInCounts = await prisma.$queryRaw`
          SELECT 
            DATE(check_in_date) as check_in_date,
            COUNT(*) as check_in_count
          FROM check_ins
          WHERE team_id = ${input.teamId}
          GROUP BY DATE(check_in_date)
          ORDER BY DATE(check_in_date) DESC
          LIMIT ${input.limit}
        `;

        return checkInCounts;
      } catch (error) {
        console.error("Error fetching check-in history:", error);
        if (error instanceof TRPCError) throw error;
        return [];
      }
    }),

  getUserCheckInStatus: protectedProcedure
    .input(getUserCheckInStatusSchema)
    .query(async ({ ctx, input }) => {
      try {
        // First verify the user has access to this team
        const membership = await prisma.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: input.teamId,
              userId: ctx.userId!,
            },
          },
        });

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this team",
          });
        }

        // Check if the user has checked in for the day
        const checkIn = await prisma.checkIn.findUnique({
          where: {
            teamId_userId_checkInDate: {
              teamId: input.teamId,
              userId: ctx.userId!,
              checkInDate: toISODateTime(input.date),
            },
          },
        });

        return {
          checkedIn: !!checkIn,
          checkInDetails: checkIn,
        };
      } catch (error) {
        console.error("Error fetching check-in status:", error);
        if (error instanceof TRPCError) throw error;
        return { checkedIn: false, checkInDetails: null };
      }
    }),

  checkIn: protectedProcedure
    .input(checkInSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // First verify the user has access to this team
        const membership = await prisma.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: input.teamId,
              userId: ctx.userId!,
            },
          },
        });

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this team",
          });
        }

        // Create the check-in
        const checkIn = await prisma.checkIn.create({
          data: {
            teamId: input.teamId,
            userId: ctx.userId!,
            checkInDate: toISODateTime(input.date),
            notes: input.notes,
          },
        });

        return {
          success: true,
          message: "Successfully checked in",
          checkIn,
        };
      } catch (error) {
        console.error("Error checking in:", error);
        throw error;
      }
    }),
});
