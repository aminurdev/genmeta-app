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
const adminRoutes = [/^\/admin(\/.*)?$/]; // Admin routes pattern

export const middleware = async function handleRequest(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userInfo = await getCurrentUser();

  // If the user is not authenticated
  if (!userInfo) {
    if (authRoutes.includes(pathname)) {
      return NextResponse.next();
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
    if (userInfo.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Restrict access to protected routes for unauthenticated users
  if (protectedRoutes.some((route) => pathname.match(route))) {
    return NextResponse.next();
  }

  return NextResponse.next();
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
    "/admin/:path*",
  ],
};
