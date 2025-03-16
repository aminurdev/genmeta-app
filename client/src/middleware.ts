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
  ],
};
