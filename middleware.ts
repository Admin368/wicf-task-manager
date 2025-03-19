import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/account/:path*",
    "/team/:path*",
    "/api/account/:path*",
    "/api/teams/:path*",
  ],
};
