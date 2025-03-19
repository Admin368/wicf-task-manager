import { TRPCError } from "@trpc/server";
import { middleware, publicProcedure } from "@/lib/trpc/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const isAuthed = middleware(async (opts) => {
  const session = await getServerSession(authOptions);
  // console.log("session", session);
  if (!session?.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  return opts.next({
    ctx: {
      ...opts.ctx,
      userId: session.user.id,
    },
  });
});

export const protectedProcedure = publicProcedure.use(isAuthed);
