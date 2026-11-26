import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  LEGACY_COOKIE_NAMES,
  REFRESH_COOKIE_NAME,
  SESSION_HINT_COOKIE_NAME,
} from "@/lib/auth-constants";

interface VerifiedUser {
  _id?: string;
  userId?: string;
  name?: string;
  email?: string;
  role?: "user" | "admin" | "superAdmin";
}

const authRoutes = ["/login", "/signup", "/reset-password"];
const protectedRoutes = [
  /^\/dashboard(\/.*)?$/,
  /^\/payment-status(\/.*)?$/,
  /^\/settings(\/.*)?$/,
];
const adminRoutes = [/^\/admin(\/.*)?$/];

function getBackendApiUrl(): string {
  return (
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:5000/api/v1"
  ).replace(/\/+$/, "");
}

function clearAuthCookiesOnResponse(response: NextResponse): void {
  response.cookies.delete(ACCESS_COOKIE_NAME);
  response.cookies.delete(REFRESH_COOKIE_NAME);
  response.cookies.delete(SESSION_HINT_COOKIE_NAME);
  for (const name of LEGACY_COOKIE_NAMES) {
    response.cookies.delete(name);
  }
}

function mergeCookiesForRequest(
  request: NextRequest,
  setCookies: string[]
): Headers {
  const cookieMap = new Map<string, string>();
  for (const c of request.cookies.getAll()) {
    cookieMap.set(c.name, c.value);
  }

  for (const sc of setCookies) {
    const firstSemi = sc.indexOf(";");
    const pair = firstSemi >= 0 ? sc.slice(0, firstSemi) : sc;
    const eqIdx = pair.indexOf("=");
    if (eqIdx > 0) {
      const name = pair.slice(0, eqIdx).trim();
      const val = pair.slice(eqIdx + 1).trim();
      if (val) {
        cookieMap.set(name, val);
      } else {
        cookieMap.delete(name);
      }
    }
  }

  const headers = new Headers(request.headers);
  const serialized = Array.from(cookieMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
  headers.set("cookie", serialized);
  return headers;
}

function applySetCookies(response: NextResponse, setCookies: string[]): NextResponse {
  for (const sc of setCookies) {
    response.headers.append("Set-Cookie", sc);
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const accessCookie = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const refreshCookie = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  const hasAnyAuthCookie = Boolean(accessCookie || refreshCookie);

  const isAuthRoute = authRoutes.includes(pathname);
  const isProtectedRoute = protectedRoutes.some((route) => pathname.match(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.match(route));

  // 0ms fast-path when there are no session cookies at all
  if (!hasAnyAuthCookie) {
    if (isProtectedRoute || isAdminRoute) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectPath", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  const backendApiUrl = getBackendApiUrl();
  const cookieHeader = request.headers.get("cookie") || "";

  let verifiedUser: VerifiedUser | null = null;
  let rotatedSetCookies: string[] = [];
  let backendRejected = false;

  // 1. Validate existing access token if present
  if (accessCookie) {
    try {
      const meRes = await fetch(`${backendApiUrl}/users/me`, {
        method: "GET",
        headers: { cookie: cookieHeader },
        cache: "no-store",
      });

      if (meRes.ok) {
        const json = await meRes.json();
        verifiedUser = json?.data?.user || null;
      } else if (meRes.status === 401 || meRes.status === 403) {
        backendRejected = true;
      }
    } catch {
      // Transient backend error; allow fallback to refresh or safe handling
    }
  }

  // 2. Silently rotate expired/missing access token if refresh token cookie exists
  if (!verifiedUser && refreshCookie) {
    try {
      const refreshRes = await fetch(`${backendApiUrl}/users/refresh-token`, {
        method: "POST",
        headers: {
          cookie: cookieHeader,
          origin: request.nextUrl.origin,
          "content-type": "application/json",
        },
        body: "{}",
        cache: "no-store",
      });

      if (refreshRes.ok) {
        const json = await refreshRes.json();
        verifiedUser = json?.data?.user || null;
        if (typeof refreshRes.headers.getSetCookie === "function") {
          rotatedSetCookies = refreshRes.headers.getSetCookie();
        }
        backendRejected = false;
      } else if (refreshRes.status === 401 || refreshRes.status === 403) {
        backendRejected = true;
      }
    } catch {
      // Ignore transient network errors
    }
  }

  // 3. Dead/revoked session cleanup to prevent redirect loops
  if (!verifiedUser) {
    if (isProtectedRoute || isAdminRoute) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectPath", `${pathname}${search}`);
      const res = NextResponse.redirect(loginUrl);
      if (backendRejected) {
        clearAuthCookiesOnResponse(res);
      }
      return res;
    }

    const res = NextResponse.next();
    if (backendRejected) {
      clearAuthCookiesOnResponse(res);
    }
    return res;
  }

  const forwardedHeaders =
    rotatedSetCookies.length > 0
      ? mergeCookiesForRequest(request, rotatedSetCookies)
      : request.headers;

  // 4. Authenticated user trying to visit /login, /signup, or /reset-password
  if (isAuthRoute) {
    return applySetCookies(
      NextResponse.redirect(new URL("/dashboard", request.url)),
      rotatedSetCookies
    );
  }

  // 5. Verified RBAC check for admin routes
  if (isAdminRoute) {
    const userRole = verifiedUser.role;
    const isAdmin = userRole === "admin" || userRole === "superAdmin";

    if (!isAdmin) {
      return applySetCookies(
        NextResponse.redirect(new URL("/dashboard", request.url)),
        rotatedSetCookies
      );
    }

    const isSuperAdminOnlyRoute =
      pathname.startsWith("/admin/super-admin") ||
      pathname.startsWith("/admin/scheduler") ||
      pathname.startsWith("/admin/backup") ||
      pathname.startsWith("/admin/ai-api");

    if (isSuperAdminOnlyRoute && userRole !== "superAdmin") {
      return applySetCookies(
        NextResponse.redirect(new URL("/admin", request.url)),
        rotatedSetCookies
      );
    }
  }

  const response = NextResponse.next({
    request: { headers: forwardedHeaders },
  });
  return applySetCookies(response, rotatedSetCookies);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|map|txt|xml)$).*)",
  ],
};
