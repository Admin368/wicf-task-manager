import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { TeamList } from "@/components/teams/team-list";

export const metadata: Metadata = {
  title: "My Teams",
  description: "Manage your teams",
};

export default async function TeamsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const teams = await db.team.findMany({
    where: {
      members: {
        some: {
          userId: session.user.id,
        },
      },
      isDeleted: false,
    },
    include: {
      _count: {
        select: {
          members: true,
          tasks: {
            where: {
              isDeleted: false,
            },
          },
        },
      },
    },
  });

  return (
    <div className="container max-w-5xl py-8">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold">My Teams</h1>
          <p className="text-muted-foreground">
            View and manage your team memberships
          </p>
        </div>
        <TeamList teams={teams} />
      </div>
    </div>
  );
}
