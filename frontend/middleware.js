/**
 * Next.js 16 middleware for route protection and redirect logic.
 *
 * Features:
 * - Redirects authenticated users away from /login and /register
 * - Redirects unauthenticated users away from protected routes
 * - Uses cookie presence for auth detection (not API calls)
 *
 * Security rationale:
 * - Cookie-based detection avoids excessive /me API calls
 * - Middleware runs on every request (server-side)
 * - Can check cookies without API latency
 * - Still needs frontend hydration for client-side protection
 *
 * Note: This is a security enhancement, not a replacement for backend auth.
 * Backend always validates access_token cookie.
 */

import { NextResponse } from "next/server";

/**
 * Protected routes that require authentication.
 */
const PROTECTED_ROUTES = ["/dashboard"];

/**
 * Auth routes that should redirect authenticated users away.
 */
const AUTH_ROUTES = ["/login", "/register"];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Check for access_token cookie
  const hasAccessToken = request.cookies.has("access_token");

  // Redirect authenticated users away from auth pages
  if (hasAccessToken && AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users away from protected pages
  if (!hasAccessToken && PROTECTED_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

/**
 * Configure which routes should run through middleware.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
