import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "./services/auth-services";

const authRoutes = ["/login", "/signup"];
const protectedRoutes = [
  /^\/generate(\/.*)?$/,
  /^\/user(\/.*)?$/,
  /^\/admin(\/.*)?$/,
];

export const middleware = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const userInfo = await getCurrentUser();

  if (!userInfo) {
    if (authRoutes.includes(pathname)) {
      return NextResponse.next();
    } else {
      return NextResponse.redirect(
        new URL(`/login?redirectPath=${pathname}`, request.url)
      );
    }
  }

  // Allow logged-in users to access all protected routes
  if (protectedRoutes.some((route) => pathname.match(route))) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/", request.url));
};

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/generate",
    "/generate/:page",
    "/user",
    "/user/:page",
    "/admin",
    "/admin/:page",
  ],
};
