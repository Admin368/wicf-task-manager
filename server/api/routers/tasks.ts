import { z } from "zod";
import { router, publicProcedure } from "@/lib/trpc/server";
import { protectedProcedure } from "../middleware";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const tasksRouter = router({
  getByTeam: publicProcedure
    .input(
      z.object({
        teamId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        if (!ctx.userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in",
          });
        }

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

        const tasks = await ctx.prisma.$queryRaw`
          SELECT * FROM tasks 
          WHERE team_id = ${input.teamId}
          AND is_deleted = false 
          ORDER BY position ASC
        `;

        return tasks;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error fetching team tasks:", error);
        return [];
      }
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.userId) {
        return [];
      }

      // Get user's teams
      const memberships = await ctx.prisma.teamMember.findMany({
        where: { userId: ctx.userId },
        select: { teamId: true },
      });

      if (memberships.length === 0) {
        return [];
      }

      const teamIds = memberships.map((m) => m.teamId);

      const tasks = await ctx.prisma.$queryRaw`
        SELECT * FROM tasks 
        WHERE team_id = ANY(${teamIds}::uuid[])
        AND is_deleted = false 
        ORDER BY position ASC
      `;

      return tasks;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return [];
    }
  }),

  create: publicProcedure
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
        if (!ctx.userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in",
          });
        }

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
          const lastTask = await ctx.prisma.$queryRaw<{ position: number }[]>`
            SELECT position FROM tasks 
            WHERE parent_id = ${input.parentId}
            AND team_id = ${input.teamId}
            AND is_deleted = false 
            ORDER BY position DESC 
            LIMIT 1
          `;

          position = lastTask.length > 0 ? lastTask[0].position + 1 : 0;
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

  update: publicProcedure
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
        if (!ctx.userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in",
          });
        }

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

  delete: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in",
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

        // Verify user has access to the team and is an admin
        const membership = await ctx.prisma.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: task.teamId,
              userId: ctx.userId,
            },
          },
        });

        if (!membership || !["admin", "owner"].includes(membership.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to delete tasks",
          });
        }

        const softDeleteTaskAndChildren = async (taskId: string) => {
          const children = await ctx.prisma.task.findMany({
            where: { parentId: taskId },
          });

          await ctx.prisma.$executeRaw`
            UPDATE tasks 
            SET is_deleted = true 
            WHERE id = ${taskId}::uuid
          `;

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
