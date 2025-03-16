import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { initDatabase } from "./lib/init-db"

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Only run this once on app startup
  if (process.env.NODE_ENV === "production" && !global.dbInitialized) {
    try {
      await initDatabase()
      ;(global as any).dbInitialized = true
    } catch (error) {
      console.error("Failed to initialize database:", error)
    }
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: "/",
}

