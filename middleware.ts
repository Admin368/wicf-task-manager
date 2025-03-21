import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req });

  // If trying to access login/register pages while logged in, redirect to home
  if (
    token &&
    (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/register")
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // For protected routes, check authentication
  if (!token) {
    // Only redirect to login if accessing a protected route
    if (
      req.nextUrl.pathname.startsWith("/account") ||
      req.nextUrl.pathname.startsWith("/team") ||
      req.nextUrl.pathname.startsWith("/api/account") ||
      req.nextUrl.pathname.startsWith("/api/teams")
    ) {
      // Create login URL with callback to the original URL path
      const loginUrl = new URL("/login", req.url);

      // Use the original pathname + search params instead of the full URL
      const callbackUrl = req.nextUrl.pathname + req.nextUrl.search;
      loginUrl.searchParams.set("callbackUrl", callbackUrl);

      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // Extract team slug from the URL if it's a team route
  const teamSlug = req.nextUrl.pathname.startsWith("/team/")
    ? req.nextUrl.pathname.split("/")[2]
    : null;

  // Check if user is banned using the API route
  const response = await fetch(new URL("/api/auth/check-banned", req.url), {
    headers: {
      "x-user-email": token.email as string,
      ...(teamSlug && { "x-team-slug": teamSlug }),
    },
  });

  if (!response.ok) {
    return NextResponse.next();
  }

  const { isBanned } = await response.json();

  if (isBanned) {
    return NextResponse.redirect(new URL("/banned", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/account/:path*",
    "/team/:path*",
    "/api/account/:path*",
    "/api/teams/:path*",
  ],
};
