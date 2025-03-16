import { initTRPC } from "@trpc/server"
import superjson from "superjson"
import { ZodError } from "zod"
import { createServerSupabaseClient } from "@/lib/supabase"

export const createTRPCContext = async (opts: { headers: Headers }) => {
  try {
    const supabase = createServerSupabaseClient()

    return {
      supabase,
      headers: opts.headers,
    }
  } catch (error) {
    console.error("Error creating TRPC context:", error)
    // Return a minimal context that won't break the app
    return {
      headers: opts.headers,
      supabase: null as any, // This will be caught by procedures that need supabase
    }
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const createCallerFactory = t.createCallerFactory
export const router = t.router
export const publicProcedure = t.procedure

