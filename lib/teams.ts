import { prisma } from "./prisma";

export async function getTeamBySlug(slug: string) {
  return prisma.team.findUnique({
    where: { slug },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });
}

export async function createTeam(data: {
  name: string;
  slug: string;
  password: string;
}) {
  return prisma.team.create({
    data,
  });
}

export async function addTeamMember(data: {
  teamId: string;
  userId: string;
  role?: string;
}) {
  return prisma.teamMember.create({
    data: {
      teamId: data.teamId,
      userId: data.userId,
      role: data.role || "member",
    },
    include: {
      user: true,
      team: true,
    },
  });
}

export async function getTeamTasks(teamId: string) {
  return prisma.task.findMany({
    where: {
      teamId,
      isDeleted: false,
      parentId: null, // Get only root tasks
    },
    include: {
      children: {
        where: {
          isDeleted: false,
        },
        include: {
          completions: true,
        },
      },
      completions: true,
    },
    orderBy: {
      position: "asc",
    },
  });
}

export async function updateTaskPosition(taskId: string, newPosition: number) {
  return prisma.task.update({
    where: { id: taskId },
    data: { position: newPosition },
  });
}

export async function getTeamCheckIns(teamId: string, date: Date) {
  return prisma.checkIn.findMany({
    where: {
      teamId,
      checkInDate: date,
    },
    include: {
      user: true,
    },
  });
}
