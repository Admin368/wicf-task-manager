import { z } from "zod";
import { router, publicProcedure } from "@/lib/trpc/server";
import { protectedProcedure } from "../middleware";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const usersRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    try {
      const users = await ctx.prisma.user.findMany({
        orderBy: { name: "asc" },
      });
      return users;
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  }),

  getTeamMembers: publicProcedure
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
              userId: ctx.userId ?? "",
            },
          },
        });

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this team",
          });
        }

        // Get all team members with user details
        const members = await ctx.prisma.teamMember.findMany({
          where: {
            teamId: input.teamId,
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
        });

        return members.map((member) => ({
          id: member.userId,
          role: member.role,
          name: member.user.name,
          email: member.user.email,
          avatarUrl: member.user.avatarUrl,
        }));
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error fetching team members:", error);
        return [];
      }
    }),

  getOrCreate: publicProcedure
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
          const existingUser = await ctx.prisma.user.findFirst({
            where: { email: input.email },
          });

          if (existingUser) return existingUser;
        }

        // Otherwise create a new user
        const user = await ctx.prisma.user.create({
          data: {
            name: input.name,
            email: input.email,
            avatarUrl: input.avatarUrl,
          },
        });

        return user;
      } catch (error) {
        console.error("Error creating user:", error);
        throw error;
      }
    }),

  updateRole: publicProcedure
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
        const currentUserRole = await ctx.prisma.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: input.teamId,
              userId: ctx.userId ?? "",
            },
          },
          select: { role: true },
        });

        if (
          !currentUserRole ||
          !["admin", "owner"].includes(currentUserRole.role)
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to update roles",
          });
        }

        // Update the target user's role
        await ctx.prisma.teamMember.update({
          where: {
            teamId_userId: {
              teamId: input.teamId,
              userId: input.userId,
            },
          },
          data: { role: input.role },
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error updating user role:", error);
        throw error;
      }
    }),
});
