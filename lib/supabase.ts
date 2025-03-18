import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// Create a single supabase client for server-side
export const createServerSupabaseClient = () => {
  const supabaseUrl = "https://gupxrxkeiwqtipzyrqnp.supabase.co";
  const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1cHhyeGtlaXdxdGlwenlycW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMDM3NzAsImV4cCI6MjA1NzY3OTc3MH0.oBRgtUdRV2eYgeP38XmyJwEVU0IyR9uX89VL5uFQF2c";

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient<Database>(supabaseUrl, supabaseKey);
};

// Create a singleton client for client-side
let clientSupabaseClient: ReturnType<typeof createClientSupabaseClient> | null =
  null;

export const createClientSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey);
  return supabase;
};

export const getClientSupabaseClient = () => {
  if (typeof window === "undefined") {
    throw new Error(
      "getClientSupabaseClient should only be called in client components"
    );
  }

  if (!clientSupabaseClient) {
    clientSupabaseClient = createClientSupabaseClient();
  }
  return clientSupabaseClient;
};
