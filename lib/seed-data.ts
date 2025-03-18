import { prisma } from "@/lib/prisma";

export async function seedInitialTasks() {
  // Check if tasks already exist
  const count = await prisma.task.count();

  if (count > 0) {
    console.log("Tasks already exist, skipping seed");
    return;
  }

  // Insert top-level tasks first
  const placementTask = await prisma.task.create({
    data: {
      title: "Placement",
      parentId: null,
      position: 0,
    },
  });

  const cablesTask = await prisma.task.create({
    data: {
      title: "Cables",
      parentId: null,
      position: 1,
    },
  });

  // Insert Placement subtasks
  const backupCameraTask = await prisma.task.create({
    data: {
      title: "Backup Camera",
      parentId: placementTask.id,
      position: 0,
    },
  });

  const mainCameraTask = await prisma.task.create({
    data: {
      title: "Main Camera",
      parentId: placementTask.id,
      position: 1,
    },
  });

  const secondProjectorTask = await prisma.task.create({
    data: {
      title: "Second Projector",
      parentId: placementTask.id,
      position: 2,
    },
  });

  const tvTask = await prisma.task.create({
    data: {
      title: "TV",
      parentId: placementTask.id,
      position: 3,
    },
  });

  const confidenceMonitorTask = await prisma.task.create({
    data: {
      title: "Confidence monitor",
      parentId: placementTask.id,
      position: 4,
    },
  });

  // Insert Backup Camera subtasks
  await prisma.task.createMany({
    data: [
      { title: "Put in place", parentId: backupCameraTask.id, position: 0 },
      { title: "Check battery", parentId: backupCameraTask.id, position: 1 },
      {
        title: "Put Spare battery on charger",
        parentId: backupCameraTask.id,
        position: 2,
      },
    ],
  });

  // Insert Main Camera subtasks
  await prisma.task.createMany({
    data: [
      { title: "Put in place", parentId: mainCameraTask.id, position: 0 },
      { title: "Check Battery", parentId: mainCameraTask.id, position: 1 },
    ],
  });

  // Insert Second Projector subtasks
  await prisma.task.create({
    data: {
      title: "Put in place",
      parentId: secondProjectorTask.id,
      position: 0,
    },
  });

  // Insert TV subtasks
  await prisma.task.create({
    data: {
      title: "Put in place",
      parentId: tvTask.id,
      position: 0,
    },
  });

  // Insert Confidence Monitor subtasks
  await prisma.task.createMany({
    data: [
      {
        title: "Put in place",
        parentId: confidenceMonitorTask.id,
        position: 0,
      },
      {
        title: "Connect Power",
        parentId: confidenceMonitorTask.id,
        position: 1,
      },
    ],
  });

  // Insert Cables subtasks
  const connectPowerTask = await prisma.task.create({
    data: {
      title: "Connect Power for",
      parentId: cablesTask.id,
      position: 0,
    },
  });

  const connectCableTask = await prisma.task.create({
    data: {
      title: "Connect Cable for",
      parentId: cablesTask.id,
      position: 1,
    },
  });

  // Insert Connect Power subtasks
  await prisma.task.createMany({
    data: [
      {
        title: "Main Camera - Yellow Powercode",
        parentId: connectPowerTask.id,
        position: 0,
      },
      { title: "Power to TV", parentId: connectPowerTask.id, position: 1 },
      { title: "Power to pulpit", parentId: connectPowerTask.id, position: 2 },
    ],
  });

  // Insert Connect Cable subtasks
  await prisma.task.createMany({
    data: [
      {
        title: "HDMI to Main Camera",
        parentId: connectCableTask.id,
        position: 0,
      },
      {
        title: "HDMI to Backup camera",
        parentId: connectCableTask.id,
        position: 1,
      },
      {
        title: "HDMI to Connect Splitter",
        parentId: connectCableTask.id,
        position: 2,
      },
      {
        title: "HDMI to Splitter to TV",
        parentId: connectCableTask.id,
        position: 3,
      },
      {
        title: "HDMI to Confidence monitor",
        parentId: connectCableTask.id,
        position: 4,
      },
    ],
  });

  console.log("Seed data inserted successfully");
}
