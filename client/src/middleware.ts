import { NextRequest, NextResponse } from "next/server";

interface DecodedToken {
  userId?: string;
  name?: string;
  email?: string;
  role?: "user" | "admin" | "superAdmin";
  exp?: number;
}

function parseJwt(token: string): DecodedToken | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

const authRoutes = ["/login", "/signup", "/verify-email", "/reset-password"];
const protectedRoutes = [
  /^\/dashboard(\/.*)?$/,
  /^\/payment-status(\/.*)?$/,
];
const adminRoutes = [/^\/admin(\/.*)?$/];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  const decoded = accessToken ? parseJwt(accessToken) : null;
  const now = Math.floor(Date.now() / 1000);
  const isTokenValid = decoded && (!decoded.exp || decoded.exp > now);
  const isAuthenticated = !!(isTokenValid || refreshToken);

  const isAuthRoute = authRoutes.includes(pathname);
  const isProtectedRoute = protectedRoutes.some((route) => pathname.match(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.match(route));

  // If unauthenticated and accessing protected or admin route -> redirect to login
  if (!isAuthenticated && (isProtectedRoute || isAdminRoute)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectPath", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and trying to access login/signup -> redirect to dashboard
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Admin authorization: must have admin or superAdmin role
  if (isAdminRoute) {
    const userRole = decoded?.role;
    const isAdmin = userRole === "admin" || userRole === "superAdmin";

    if (!isAdmin) {
      // Non-admin users are safely redirected to user dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // SuperAdmin exclusivity for /admin/super-admin
    if (pathname.startsWith("/admin/super-admin") && userRole !== "superAdmin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/verify-email",
    "/reset-password",
    "/dashboard/:path*",
    "/admin/:path*",
    "/generate/:path*",
    "/results/:path*",
    "/payment-status/:path*",
    "/settings/:path*",
  ],
};
