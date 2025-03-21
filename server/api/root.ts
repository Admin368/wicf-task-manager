import { router } from "@/lib/trpc/server"
import { tasksRouter } from "./routers/tasks"
import { usersRouter } from "./routers/users"
import { completionsRouter } from "./routers/completions"
import { teamsRouter } from "./routers/teams"
import { checkInsRouter } from "./routers/check-ins"

/**
 * This is the primary router for your server.
 */
export const appRouter = router({
  tasks: tasksRouter,
  users: usersRouter,
  completions: completionsRouter,
  teams: teamsRouter,
  checkIns: checkInsRouter,
})

export type AppRouter = typeof appRouter

