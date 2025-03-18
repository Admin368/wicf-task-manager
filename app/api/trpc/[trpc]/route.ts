import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/lib/trpc/server";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => createTRPCContext({ headers: req.headers }),
    onError: ({ error, type, path, input, ctx, req }) => {
      console.error(`[tRPC ${type} Error on ${path}]:`, error);
      if (error.code === "INTERNAL_SERVER_ERROR") {
        // Send to error reporting service
        console.error("Input:", input);
        console.error("Context:", ctx);
      }
    },
  });

export { handler as GET, handler as POST };
