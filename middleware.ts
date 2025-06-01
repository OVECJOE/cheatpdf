// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware() {
    // Additional middleware logic can go here
    // For example, role-based access control
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Public routes that don't require authentication
        const publicRoutes = [
          "/",
          "/auth/sign-in",
          "/auth/sign-up",
          "/auth/verify-request",
          "/auth/error",
          "/api/auth",
          "/terms",
          "/privacy",
          "/support",
        ];

        const { pathname } = req.nextUrl;

        // Allow public routes
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true;
        }

        // Require authentication for all other routes
        return !!token;
      },
    },
    pages: {
      signIn: "/auth/sign-in",
      error: "/auth/error",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};