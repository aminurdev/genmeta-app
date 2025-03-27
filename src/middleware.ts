import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "./services/auth-services";
export { auth as authMiddleware } from "@/auth";

const authRoutes = ["/login", "/signup"];
const protectedRoutes = [
  /^\/generate(\/.*)?$/,
  /^\/dashboard(\/.*)?$/,
  /^\/payment-status(\/.*)?$/,
  /^\/results(\/.*)?$/,
  /^\/settings(\/.*)?$/,
];
const adminRoutes = [/^\/admin(\/.*)?$/]; // New admin routes pattern

export const middleware = async function handleRequest(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userInfo = await getCurrentUser(); // Always fetch user info per request

  // If the user is not authenticated
  if (!userInfo) {
    if (authRoutes.includes(pathname)) {
      return NextResponse.next(); // Allow access to auth pages
    } else {
      return NextResponse.redirect(
        new URL(`/login?redirectPath=${pathname}`, request.url)
      );
    }
  }

  // If authenticated and accessing an auth page, redirect to home
  if (authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Check for admin routes - only allow if user has admin role
  if (adminRoutes.some((route) => pathname.match(route))) {
    // Check if user has admin role
    if (userInfo.role !== "admin") {
      // Redirect non-admin users to home or unauthorized page
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    return NextResponse.next(); // Allow access for admin users
  }

  // Restrict access to protected routes for unauthenticated users
  if (protectedRoutes.some((route) => pathname.match(route))) {
    return NextResponse.next(); // Allow access
  }

  return NextResponse.next(); // Default: Allow access to all other pages
};

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/generate/:path*",
    "/dashboard/:path*",
    "/results/:path*",
    "/payment-status/:path*",
    "/settings/:path*",
    "/admin/:path*", // Added admin routes to matcher
  ],
};
