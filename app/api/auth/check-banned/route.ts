import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { TeamBan } from "@prisma/client";

export async function GET(request: Request) {
  const email = request.headers.get("x-user-email");
  const teamSlug = request.headers.get("x-team-slug");

  if (!email) {
    return NextResponse.json({ isBanned: false });
  }

  // If no team slug is provided, check for any team bans
  if (!teamSlug) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        teamBans: {
          include: {
            team: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      isBanned: user?.teamBans.length > 0 || false,
      bannedTeams: user?.teamBans.map((ban: TeamBan & { team: { slug: string } }) => ({
        id: ban.teamId,
        slug: ban.team.slug,
      })) || []
    });
  }

  // Get team ID from slug
  const team = await prisma.team.findUnique({
    where: { slug: teamSlug },
    select: { id: true },
  });

  if (!team) {
    return NextResponse.json({ isBanned: false });
  }

  // Check for specific team ban
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      teamBans: {
        where: {
          teamId: team.id,
        },
      },
    },
  });

  return NextResponse.json({ 
    isBanned: user?.teamBans.length > 0 || false,
    bannedTeams: user?.teamBans.map((ban: TeamBan) => ({
      id: ban.teamId,
      slug: teamSlug,
    })) || []
  });
} 