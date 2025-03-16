import { TRPCError } from "@trpc/server"
import { middleware } from "@trpc/server"
import { publicProcedure } from "@/lib/trpc/server"

export const withSupabase = publicProcedure.use(
  middleware(async ({ ctx, next }) => {
    if (!ctx.supabase) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Supabase client not available",
      })
    }
    return next({
      ctx: {
        ...ctx,
        supabase: ctx.supabase,
      },
    })
  }),
)

