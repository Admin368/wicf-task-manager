import { router } from "@/lib/trpc/server"
import { tasksRouter } from "./routers/tasks"
import { usersRouter } from "./routers/users"
import { completionsRouter } from "./routers/completions"

export const appRouter = router({
  tasks: tasksRouter,
  users: usersRouter,
  completions: completionsRouter,
})

export type AppRouter = typeof appRouter

