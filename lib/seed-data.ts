import { createServerSupabaseClient } from "./supabase"

export async function seedInitialTasks() {
  const supabase = createServerSupabaseClient()

  // Check if tasks already exist
  const { count } = await supabase.from("tasks").select("*", { count: "exact", head: true })

  if (count && count > 0) {
    console.log("Tasks already exist, skipping seed")
    return
  }

  // Define the initial tasks structure
  const tasks = [
    // Placement
    { title: "Placement", parent_id: null, position: 0 },
    { title: "Backup Camera", parent_id: null, position: 1 }, // Will be updated with parent_id
    { title: "Put in place", parent_id: null, position: 0 }, // Will be updated with parent_id
    { title: "Check battery", parent_id: null, position: 1 }, // Will be updated with parent_id
    { title: "Put Spare battery on charger", parent_id: null, position: 2 }, // Will be updated with parent_id
    { title: "Main Camera", parent_id: null, position: 2 }, // Will be updated with parent_id
    { title: "Put in place", parent_id: null, position: 0 }, // Will be updated with parent_id
    { title: "Check Battery", parent_id: null, position: 1 }, // Will be updated with parent_id
    { title: "Second Projector", parent_id: null, position: 3 }, // Will be updated with parent_id
    { title: "Put in place", parent_id: null, position: 0 }, // Will be updated with parent_id
    { title: "TV", parent_id: null, position: 4 }, // Will be updated with parent_id
    { title: "Put in place", parent_id: null, position: 0 }, // Will be updated with parent_id
    { title: "Confidence monitor", parent_id: null, position: 5 }, // Will be updated with parent_id
    { title: "Put in place", parent_id: null, position: 0 }, // Will be updated with parent_id
    { title: "Connect Power", parent_id: null, position: 1 }, // Will be updated with parent_id

    // Cables
    { title: "Cables", parent_id: null, position: 1 },
    { title: "Connect Power for", parent_id: null, position: 0 }, // Will be updated with parent_id
    { title: "Main Camera - Yellow Powercode", parent_id: null, position: 0 }, // Will be updated with parent_id
    { title: "Power to TV", parent_id: null, position: 1 }, // Will be updated with parent_id
    { title: "Power to pulpit", parent_id: null, position: 2 }, // Will be updated with parent_id
    { title: "Connect Cable for", parent_id: null, position: 1 }, // Will be updated with parent_id
    { title: "HDMI to Main Camera", parent_id: null, position: 0 }, // Will be updated with parent_id
    { title: "HDMI to Backup camera", parent_id: null, position: 1 }, // Will be updated with parent_id
    { title: "HDMI to Connect Splitter", parent_id: null, position: 2 }, // Will be updated with parent_id
    { title: "HDMI to Splitter to TV", parent_id: null, position: 3 }, // Will be updated with parent_id
    { title: "HDMI to Confidence monitor", parent_id: null, position: 4 }, // Will be updated with parent_id
  ]

  // Insert top-level tasks first
  const { data: placementTask } = await supabase
    .from("tasks")
    .insert({ title: "Placement", parent_id: null, position: 0 })
    .select()
    .single()

  const { data: cablesTask } = await supabase
    .from("tasks")
    .insert({ title: "Cables", parent_id: null, position: 1 })
    .select()
    .single()

  if (!placementTask || !cablesTask) {
    console.error("Failed to insert top-level tasks")
    return
  }

  // Insert Placement subtasks
  const { data: backupCameraTask } = await supabase
    .from("tasks")
    .insert({ title: "Backup Camera", parent_id: placementTask.id, position: 0 })
    .select()
    .single()

  const { data: mainCameraTask } = await supabase
    .from("tasks")
    .insert({ title: "Main Camera", parent_id: placementTask.id, position: 1 })
    .select()
    .single()

  const { data: secondProjectorTask } = await supabase
    .from("tasks")
    .insert({ title: "Second Projector", parent_id: placementTask.id, position: 2 })
    .select()
    .single()

  const { data: tvTask } = await supabase
    .from("tasks")
    .insert({ title: "TV", parent_id: placementTask.id, position: 3 })
    .select()
    .single()

  const { data: confidenceMonitorTask } = await supabase
    .from("tasks")
    .insert({ title: "Confidence monitor", parent_id: placementTask.id, position: 4 })
    .select()
    .single()

  // Insert Backup Camera subtasks
  if (backupCameraTask) {
    await supabase.from("tasks").insert([
      { title: "Put in place", parent_id: backupCameraTask.id, position: 0 },
      { title: "Check battery", parent_id: backupCameraTask.id, position: 1 },
      { title: "Put Spare battery on charger", parent_id: backupCameraTask.id, position: 2 },
    ])
  }

  // Insert Main Camera subtasks
  if (mainCameraTask) {
    await supabase.from("tasks").insert([
      { title: "Put in place", parent_id: mainCameraTask.id, position: 0 },
      { title: "Check Battery", parent_id: mainCameraTask.id, position: 1 },
    ])
  }

  // Insert Second Projector subtasks
  if (secondProjectorTask) {
    await supabase.from("tasks").insert([{ title: "Put in place", parent_id: secondProjectorTask.id, position: 0 }])
  }

  // Insert TV subtasks
  if (tvTask) {
    await supabase.from("tasks").insert([{ title: "Put in place", parent_id: tvTask.id, position: 0 }])
  }

  // Insert Confidence Monitor subtasks
  if (confidenceMonitorTask) {
    await supabase.from("tasks").insert([
      { title: "Put in place", parent_id: confidenceMonitorTask.id, position: 0 },
      { title: "Connect Power", parent_id: confidenceMonitorTask.id, position: 1 },
    ])
  }

  // Insert Cables subtasks
  const { data: connectPowerTask } = await supabase
    .from("tasks")
    .insert({ title: "Connect Power for", parent_id: cablesTask.id, position: 0 })
    .select()
    .single()

  const { data: connectCableTask } = await supabase
    .from("tasks")
    .insert({ title: "Connect Cable for", parent_id: cablesTask.id, position: 1 })
    .select()
    .single()

  // Insert Connect Power subtasks
  if (connectPowerTask) {
    await supabase.from("tasks").insert([
      { title: "Main Camera - Yellow Powercode", parent_id: connectPowerTask.id, position: 0 },
      { title: "Power to TV", parent_id: connectPowerTask.id, position: 1 },
      { title: "Power to pulpit", parent_id: connectPowerTask.id, position: 2 },
    ])
  }

  // Insert Connect Cable subtasks
  if (connectCableTask) {
    await supabase.from("tasks").insert([
      { title: "HDMI to Main Camera", parent_id: connectCableTask.id, position: 0 },
      { title: "HDMI to Backup camera", parent_id: connectCableTask.id, position: 1 },
      { title: "HDMI to Connect Splitter", parent_id: connectCableTask.id, position: 2 },
      { title: "HDMI to Splitter to TV", parent_id: connectCableTask.id, position: 3 },
      { title: "HDMI to Confidence monitor", parent_id: connectCableTask.id, position: 4 },
    ])
  }

  console.log("Seed data inserted successfully")
}

