import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Protect all routes under /dashboard, /tickets, /admin, /settings.
// Unauthenticated users are redirected to /login.

export default withAuth(
  function middleware(req) {
    // All additional middleware logic goes here (e.g., role-based access).
    // For now, simply allow the request through if authenticated.
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tickets/:path*",
    "/admin/:path*",
    "/analytics/:path*",
    "/settings/:path*",
  ],
};
