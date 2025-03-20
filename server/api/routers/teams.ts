import { z } from "zod";
import { router, publicProcedure } from "@/lib/trpc/server";
import { protectedProcedure } from "../middleware";
import { slugify } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { Context } from "@/lib/trpc/server";
import { TRPCError } from "@trpc/server";

type TeamInput = {
  name: string;
  password: string;
};

type JoinInput = {
  teamId: string;
  password: string;
};

type TeamIdInput = {
  teamId: string;
};

export const teamsRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const teams = await ctx.prisma.team.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
          members: {
            select: {
              userId: true,
              role: true,
            },
          },
          checkIns: {
            where: {
              checkInDate: today,
            },
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        where: {
          isDeleted: false,
        },
      });
      return teams || [];
    } catch (error) {
      console.error("Error fetching teams:", error);
      return [];
    }
  }),

  getJoinedTeams: protectedProcedure.query(async ({ ctx }) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const teams = await ctx.prisma.team.findMany({
        where: {
          isDeleted: false,
          members: {
            some: {
              userId: ctx.userId,
            },
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
          members: {
            select: {
              userId: true,
              role: true,
            },
          },
          checkIns: {
            where: {
              checkInDate: today,
            },
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });
      return teams || [];
    } catch (error) {
      console.error("Error fetching joined teams:", error);
      return [];
    }
  }),

  getBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const team = await ctx.prisma.team.findFirst({
          where: {
            slug: input.slug,
            isDeleted: false,
          },
        });
        if (!team) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Team not found",
          });
        }
        return team;
      } catch (error) {
        console.error("Error fetching team:", error);
        throw error;
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        password: z.string().min(4),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: Context; input: TeamInput }) => {
      try {
        if (!ctx.userId) throw new Error("User ID is required");
        const userId = ctx.userId; // Create a non-nullable reference

        // Generate slug from name
        let slug = slugify(input.name);

        // Check if slug already exists
        const existingTeam = await ctx.prisma.team.findUnique({
          where: { slug },
        });

        // If slug exists, append a random number
        if (existingTeam) {
          slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        }

        // Create team and add creator as admin in a transaction
        const team = await ctx.prisma.$transaction(async (tx: typeof ctx.prisma) => {
          const newTeam = await tx.team.create({
            data: {
              name: input.name,
              slug,
              password: input.password, // In a real app, you'd hash this
            },
          });

          await tx.teamMember.create({
            data: {
              teamId: newTeam.id,
              userId,
              role: "admin",
            },
          });

          return newTeam;
        });

        return team;
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
        if (!ctx.userId) throw new Error("User ID is required");

        // Check if user is banned from the team
        const ban = await ctx.prisma.teamBan.findUnique({
          where: {
            teamId_userId: {
              teamId: input.teamId,
              userId: ctx.userId,
            },
          },
        });

        if (ban) {
          throw new Error("You have been banned from this team");
        }

        // Check if user is already a member
        const existingMembership = await ctx.prisma.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: input.teamId,
              userId: ctx.userId,
            },
          },
        });

        // If already a member, return success
        if (existingMembership) {
          return { success: true };
        }

        // If not a member, verify password
        const team = await ctx.prisma.team.findUnique({
          where: { id: input.teamId },
          select: { password: true },
        });

        if (!team || team.password !== input.password) {
          throw new Error("Incorrect password");
        }

        // Add them as a member
        await ctx.prisma.teamMember.create({
          data: {
            teamId: input.teamId,
            userId: ctx.userId,
            role: "member",
          },
        });

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
    .query(async ({ ctx, input }: { ctx: Context; input: TeamIdInput }) => {
      try {
        if (!ctx.userId) throw new Error("User ID is required");
        const userId = ctx.userId; // Create a non-nullable reference

        // Check if user is banned from the team
        const ban = await ctx.prisma.teamBan.findUnique({
          where: {
            teamId_userId: {
              teamId: input.teamId,
              userId,
            },
          },
        });

        if (ban) {
          return { hasAccess: false, reason: "banned" };
        }

        const membership = await ctx.prisma.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: input.teamId,
              userId,
            },
          },
        });
        return { hasAccess: !!membership };
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
        if (!ctx.userId) throw new Error("User ID is required");
        const userId = ctx.userId;

        // First verify the current user is an admin
        const currentUserRole = await ctx.prisma.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: input.teamId,
              userId,
            },
          },
          select: { role: true },
        });

        if (
          !currentUserRole ||
          !["admin", "owner"].includes(currentUserRole.role)
        ) {
          throw new Error("You don't have permission to delete this team");
        }

        // Soft delete the team and its tasks in a transaction
        await ctx.prisma.$transaction([
          ctx.prisma.team.update({
            where: { id: input.teamId },
            data: { isDeleted: true },
          }),
          ctx.prisma.task.updateMany({
            where: { teamId: input.teamId },
            data: { isDeleted: true },
          }),
        ]);

        return { success: true };
      } catch (error) {
        console.error("Error deleting team:", error);
        throw error;
      }
    }),

  updateMemberRole: protectedProcedure
    .input(
      z.object({
        teamId: z.string().uuid(),
        userId: z.string().uuid(),
        role: z.enum(["admin", "member"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the current user is an admin
      const currentMember = await ctx.prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: input.teamId,
            userId: ctx.userId,
          },
        },
      });

      if (!currentMember || currentMember.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update member roles",
        });
      }

      // Update the member's role
      return ctx.prisma.teamMember.update({
        where: {
          teamId_userId: {
            teamId: input.teamId,
            userId: input.userId,
          },
        },
        data: {
          role: input.role,
        },
      });
    }),

  getMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string().uuid(),
        userId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const member = await ctx.prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: input.teamId,
            userId: input.userId,
          },
        },
      });
      return member;
    }),
});

export type TeamsRouter = typeof teamsRouter;
export type TeamsInput = inferRouterInputs<TeamsRouter>;
export type TeamsOutput = inferRouterOutputs<TeamsRouter>;
