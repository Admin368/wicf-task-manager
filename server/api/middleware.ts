import { TRPCError } from "@trpc/server";
import { t } from "@/lib/trpc/server";
import { publicProcedure } from "@/lib/trpc/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export const withSupabase = t.middleware(async ({ ctx, next }) => {
  if (!ctx.supabase) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Supabase client not available",
    });
  }
  return next({
    ctx: {
      ...ctx,
      supabase: ctx.supabase,
    },
  });
});

// Simplified authentication that doesn't require login
// In a production application, you would want to use proper auth
export const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  // Get the user ID from headers (set by the client)
  const userId = ctx.headers.get("x-user-id");
  
  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User ID not found in request, refresh the page and try again.",
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      userId,
    },
  });
});

export const protectedProcedure = publicProcedure.use(withSupabase).use(isAuthenticated);
