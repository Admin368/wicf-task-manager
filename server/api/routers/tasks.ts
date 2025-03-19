import { z } from "zod";
import { router } from "@/lib/trpc/server";
import { protectedProcedure } from "../middleware";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

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
        const membership = await ctx.prisma.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: input.teamId,
              userId: ctx.userId,
            },
          },
        });

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this team",
          });
        }

        const tasks = await ctx.prisma.task.findMany({
          where: {
            teamId: input.teamId,
            isDeleted: false,
          },
          orderBy: {
            position: "asc",
          },
        });

        return tasks;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error fetching team tasks:", error);
        return [];
      }
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Get user's teams
      const memberships = await ctx.prisma.teamMember.findMany({
        where: { userId: ctx.userId },
        select: { teamId: true },
      });

      if (memberships.length === 0) {
        return [];
      }

      const teamIds = memberships.map((m) => m.teamId);

      const tasks = await ctx.prisma.task.findMany({
        where: {
          teamId: {
            in: teamIds,
          },
          isDeleted: false,
        },
        orderBy: {
          position: "asc",
        },
      });

      return tasks;
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
        const membership = await ctx.prisma.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: input.teamId,
              userId: ctx.userId,
            },
          },
        });

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this team",
          });
        }

        // If position is not provided, get the max position for the parent and add 1
        let position = input.position;
        if (position === undefined) {
          const lastTask = await ctx.prisma.task.findFirst({
            where: {
              parentId: input.parentId,
              teamId: input.teamId,
              isDeleted: false,
            },
            orderBy: {
              position: "desc",
            },
          });

          position = lastTask ? lastTask.position + 1 : 0;
        }

        const task = await ctx.prisma.task.create({
          data: {
            title: input.title,
            parentId: input.parentId,
            teamId: input.teamId,
            position,
          },
        });

        return task;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error creating task:", error);
        throw error;
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid().optional(),
        title: z.string().min(1).optional(),
        parentId: z.string().uuid().nullable().optional(),
        teamId: z.string().uuid().optional(),
        position: z.number().optional(),
        updates: z
          .array(
            z.object({
              id: z.string().uuid(),
              position: z.number(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // If this is a batch update
        if (input.updates) {
          // Get the first task to check team access
          const firstTask = await ctx.prisma.task.findUnique({
            where: { id: input.updates[0].id },
            select: { teamId: true },
          });

          if (!firstTask || !firstTask.teamId) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Task not found",
            });
          }

          // Verify user has access to the team
          const membership = await ctx.prisma.teamMember.findUnique({
            where: {
              teamId_userId: {
                teamId: firstTask.teamId,
                userId: ctx.userId,
              },
            },
          });

          if (!membership) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You don't have access to this team",
            });
          }

          // Update positions in a transaction
          await ctx.prisma.$transaction(
            input.updates.map((update) =>
              ctx.prisma.task.update({
                where: { id: update.id },
                data: { position: update.position },
              })
            )
          );

          return { success: true };
        }

        // Regular single task update
        if (!input.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Task ID is required for single task update",
          });
        }

        // Get current task to check team
        const task = await ctx.prisma.task.findUnique({
          where: { id: input.id },
          select: { teamId: true },
        });

        if (!task || !task.teamId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Task not found",
          });
        }

        // Verify user has access to the team
        const membership = await ctx.prisma.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: task.teamId,
              userId: ctx.userId,
            },
          },
        });

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this team",
          });
        }

        const updatedTask = await ctx.prisma.task.update({
          where: { id: input.id },
          data: {
            ...(input.title && { title: input.title }),
            ...(input.parentId !== undefined && { parentId: input.parentId }),
            ...(input.teamId && { teamId: input.teamId }),
            ...(input.position !== undefined && { position: input.position }),
          },
        });

        return updatedTask;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
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
        const task = await ctx.prisma.task.findUnique({
          where: { id: input.id },
          select: { teamId: true },
        });

        if (!task || !task.teamId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Task not found",
          });
        }

        // Verify user has access to the team and is an admin
        const membership = await ctx.prisma.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: task.teamId,
              userId: ctx.userId,
            },
          },
          select: {
            role: true,
          },
        });

        if (
          !membership ||
          !membership.role ||
          !["admin", "owner"].includes(membership.role)
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to delete tasks",
          });
        }

        const softDeleteTaskAndChildren = async (taskId: string) => {
          // Get all descendant tasks
          const children = await ctx.prisma.task.findMany({
            where: { parentId: taskId },
          });

          // Soft delete the current task
          await ctx.prisma.task.update({
            where: { id: taskId },
            data: { isDeleted: true },
          });

          // Recursively soft delete all children
          for (const child of children) {
            await softDeleteTaskAndChildren(child.id);
          }
        };

        await softDeleteTaskAndChildren(input.id);

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error deleting task:", error);
        throw error;
      }
    }),
});
