"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { api } from "@/lib/trpc/client";
import { ThemeProvider } from "@/components/theme-provider";
import superjson from "superjson";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient, setTrpcClient] = useState<any>(null);

  useEffect(() => {
    // Get userId from localStorage
    const userId = localStorage.getItem("userId");

    const client = api.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          headers() {
            return {
              "x-user-id": userId || "",
            };
          },
        }),
      ],
      transformer: superjson,
    });

    setTrpcClient(client);
  }, []);

  // Don't render until we have a client
  if (!trpcClient) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </api.Provider>
  );
}
