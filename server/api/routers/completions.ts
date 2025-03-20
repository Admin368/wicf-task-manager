import { z } from "zod";
import { router, publicProcedure } from "@/lib/trpc/server";
import { protectedProcedure } from "../middleware";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/lib/prisma";
import type { Context } from "@/lib/trpc/server";
import { serverGetTeamMembers } from "./users";
// Helper function to convert date string to ISO DateTime
export function toISODateTime(dateStr: string) {
  const date = new Date(dateStr);
  // Set to start of day in local timezone
  date.setHours(0, 0, 0, 0);
  return date;
}

// Define input schemas
const getByDateSchema = z.object({
  taskId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
});

const getAllByDateSchema = z.object({
  teamId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
});

const toggleSchema = z.object({
  userId: z.string().uuid(),
  taskId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  completed: z.boolean(),
});

type GetByDateInput = z.infer<typeof getByDateSchema>;
type GetAllByDateInput = z.infer<typeof getAllByDateSchema>;
type ToggleInput = z.infer<typeof toggleSchema>;

export const completionsRouter = router({
  getByDate: protectedProcedure
    .input(getByDateSchema)
    .query(async ({ ctx, input }: { ctx: Context; input: GetByDateInput }) => {
      try {
        // First verify the user has access to this task
        const task = await prisma.task.findFirst({
          where: {
            id: input.taskId,
            isDeleted: false,
          },
          include: {
            team: {
              include: {
                members: {
                  where: {
                    userId: ctx.userId!,
                  },
                },
              },
            },
          },
        });

        if (!task) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Task not found",
          });
        }

        if (!task.team?.members.length) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this task",
          });
        }

        // Get completion status
        const completion = await prisma.taskCompletion.findFirst({
          where: {
            taskId: input.taskId,
            completionDate: toISODateTime(input.date),
            task: {
              team: {
                id: task.team.id,
              },
            },
          },
        });

        return {
          completed: !!completion,
          completionDetails: completion,
        };
      } catch (error) {
        console.error("Error fetching completion status:", error);
        if (error instanceof TRPCError) throw error;
        return { completed: false, completionDetails: null };
      }
    }),

  getAllByDate: protectedProcedure
    .input(getAllByDateSchema)
    .query(
      async ({ ctx, input }: { ctx: Context; input: GetAllByDateInput }) => {
        try {
          const { teamId, date } = input;
          if (!teamId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Team ID is required",
            });
          }
          // const team = await ctx.prisma.team.findFirst({
          //   where: {
          //     id: teamId,
          //   },
          //   select: {
          //     id: true,
          //     name: true,
          //     slug: true,
          //     checkIns: true,
          //     members: {
          //       select: {
          //         teamId: true,
          //         userId: true,
          //         role: true,
          //         user: {
          //           select: {
          //             id: true,
          //             name: true,
          //             email: true,
          //           },
          //         },
          //       },
          //     },
          //     bans: true,
          //   },
          // });
          // if (!team) {
          //   throw new TRPCError({
          //     code: "NOT_FOUND",
          //     message: "Team not found",
          //   });
          // }

          if (!ctx.userId) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "You must be logged in to view completions",
            });
          }

          const teamMembers = await serverGetTeamMembers({
            ctx,
            teamId,
            userId: ctx.userId,
          });

          // Get all completions for the user on the specified date
          const completions = await ctx.prisma.taskCompletion.findMany({
            where: {
              completionDate: toISODateTime(input.date),
              task: {
                team: {
                  members: {
                    some: {
                      userId: ctx.userId,
                    },
                  },
                },
                isDeleted: false,
              },
            },
            include: {
              task: {
                include: {
                  team: {
                    include: {
                      members: {
                        include: {
                          user: true,
                        },
                      },
                    },
                  },
                },
              },
              user: true,
            },
          });

          return { teamMembers, completions };
        } catch (error) {
          console.error("Error fetching completions:", error);
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch completions",
          });
        }
      }
    ),

  toggle: protectedProcedure
    .input(toggleSchema)
    .mutation(async ({ ctx, input }: { ctx: Context; input: ToggleInput }) => {
      try {
        if (!ctx.userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to complete tasks",
          });
        }

        // First verify the user has access to this task
        const task = await prisma.task.findFirst({
          where: {
            id: input.taskId,
            isDeleted: false,
          },
          include: {
            team: {
              include: {
                members: {
                  where: {
                    userId: ctx.userId,
                  },
                },
              },
            },
          },
        });

        if (!task) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Task not found",
          });
        }

        if (!task.team?.members || task.team.members.length === 0) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this task",
          });
        }

        // Check if the user has checked in for the day
        // const checkIn = await prisma.checkIn.findFirst({
        //   where: {
        //     teamId: task.team.id,
        //     userId: ctx.userId,
        //     checkInDate: {
        //       equals: input.date,
        //     },
        //   },
        // });

        // if (!checkIn) {
        //   throw new TRPCError({
        //     code: "BAD_REQUEST",
        //     message: "You must check in before completing tasks",
        //   });
        // }

        // Get existing completion
        const existingCompletion = await prisma.taskCompletion.findFirst({
          where: {
            taskId: input.taskId,
            completionDate: toISODateTime(input.date),
            task: {
              team: {
                id: task.team.id,
              },
            },
          },
        });

        if (existingCompletion) {
          // Delete the completion
          await prisma.taskCompletion.delete({
            where: {
              id: existingCompletion.id,
            },
          });

          return {
            success: true,
            message: "Task marked as incomplete for the team",
            completed: false,
          };
        } else {
          // Create the completion
          const completion = await prisma.taskCompletion.create({
            data: {
              taskId: input.taskId,
              userId: ctx.userId,
              completionDate: toISODateTime(input.date),
            },
          });

          return {
            success: true,
            message: "Task marked as complete for the team",
            completed: true,
            completion,
          };
        }
      } catch (error) {
        console.error("Error toggling completion:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to toggle task completion",
        });
      }
    }),
});
