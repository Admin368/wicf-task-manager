import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Create a single supabase client for server-side
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient<Database>(supabaseUrl, supabaseKey)
}

// Create a singleton client for client-side
let clientSupabaseClient: ReturnType<typeof createClientSupabaseClient> | null = null

export const createClientSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey)
  return supabase
}

export const getClientSupabaseClient = () => {
  if (typeof window === "undefined") {
    throw new Error("getClientSupabaseClient should only be called in client components")
  }

  if (!clientSupabaseClient) {
    clientSupabaseClient = createClientSupabaseClient()
  }
  return clientSupabaseClient
}

