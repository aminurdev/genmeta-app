import { NextRequest } from "next/server";
import { ENV } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get("scope") || "user";
  const cookieHeader = request.headers.get("cookie") || "";

  const upstreamUrl = `${ENV.backendApiUrl}/notifications/stream?scope=${encodeURIComponent(
    scope
  )}`;

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        cookie: cookieHeader,
        accept: "text/event-stream",
      },
      cache: "no-store",
      signal: request.signal,
    });

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      return new Response(
        JSON.stringify({
          success: false,
          statusCode: upstreamResponse.status || 502,
          message: "Unable to connect to notification stream",
        }),
        {
          status: upstreamResponse.status || 502,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    return new Response(upstreamResponse.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    if (request.signal.aborted) {
      return new Response(null, { status: 499 });
    }
    const message =
      error instanceof Error ? error.message : "Notification stream error";
    return new Response(
      JSON.stringify({ success: false, statusCode: 502, message }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
