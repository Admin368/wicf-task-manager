import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
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
    "/account/:path*",
    "/team/:path*",
    "/api/account/:path*",
    "/api/teams/:path*",
  ],
};
