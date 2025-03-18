import { z } from "zod";
import { router, publicProcedure } from "@/lib/trpc/server";
import { protectedProcedure } from "../middleware";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/lib/prisma";
import type { Context } from "@/lib/trpc/server";

// Define input schemas
const getByDateSchema = z.object({
  taskId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
});

const toggleSchema = z.object({
  taskId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
});

type GetByDateInput = z.infer<typeof getByDateSchema>;
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
            deletedAt: null,
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
        const completion = await prisma.taskCompletion.findUnique({
          where: {
            taskId_userId_completionDate: {
              taskId: input.taskId,
              userId: ctx.userId!,
              completionDate: input.date,
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

  toggle: protectedProcedure
    .input(toggleSchema)
    .mutation(async ({ ctx, input }: { ctx: Context; input: ToggleInput }) => {
      try {
        // First verify the user has access to this task
        const task = await prisma.task.findFirst({
          where: {
            id: input.taskId,
            deletedAt: null,
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

        // Check if the user has checked in for the day
        const checkIn = await prisma.checkIn.findUnique({
          where: {
            teamId_userId_checkInDate: {
              teamId: task.team.id,
              userId: ctx.userId!,
              checkInDate: input.date,
            },
          },
        });

        if (!checkIn) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You must check in before completing tasks",
          });
        }

        // Get existing completion
        const existingCompletion = await prisma.taskCompletion.findUnique({
          where: {
            taskId_userId_completionDate: {
              taskId: input.taskId,
              userId: ctx.userId!,
              completionDate: input.date,
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
            message: "Task marked as incomplete",
            completed: false,
          };
        } else {
          // Create the completion
          const completion = await prisma.taskCompletion.create({
            data: {
              taskId: input.taskId,
              userId: ctx.userId!,
              completionDate: input.date,
            },
          });

          return {
            success: true,
            message: "Task marked as complete",
            completed: true,
            completion,
          };
        }
      } catch (error) {
        console.error("Error toggling completion:", error);
        throw error;
      }
    }),
});
