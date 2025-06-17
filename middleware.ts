// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { SubscriptionStatus } from "@prisma/client";

// Define route patterns for better organization
const PUBLIC_ROUTES = [
  "/",
  "/auth",
  "/api/auth", 
  "/api/webhooks", // Allow webhook endpoints
  "/terms",
  "/privacy",
  "/support",
  "/donate", // Allow donation page for everyone
];

const PREMIUM_ROUTES = [
  "/dashboard/exams",
];

const ONBOARDING_REQUIRED_ROUTES = [
  "/dashboard",
];

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Skip middleware for public routes (shouldn't reach here due to authorized callback)
    if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // Ensure we have a token (user is authenticated)
    if (!token) {
      return NextResponse.redirect(new URL("/auth/sign-in", req.url));
    }

    // Check onboarding completion for dashboard routes
    if (ONBOARDING_REQUIRED_ROUTES.some(route => pathname.startsWith(route))) {
      if (!token.onboardingCompleted) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }
    }

    // Premium feature protection
    if (PREMIUM_ROUTES.some(route => pathname.startsWith(route))) {
      const subscriptionStatus = token.subscriptionStatus as SubscriptionStatus;
      
      if (subscriptionStatus !== SubscriptionStatus.ACTIVE) {
        // Add query parameter to indicate which feature they tried to access
        const upgradeUrl = new URL("/dashboard/upgrade", req.url);
        upgradeUrl.searchParams.set("feature", "exams");
        upgradeUrl.searchParams.set("redirect", pathname);
        
        return NextResponse.redirect(upgradeUrl);
      }
    }

    // All checks passed, continue to the requested page
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Always allow public routes
        if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
          return true;
        }

        // For all other routes, require authentication
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
     * - public files
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*$).*)",
  ],
};