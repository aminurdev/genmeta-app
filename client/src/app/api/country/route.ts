import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // 1. Check edge/CDN geolocation headers (Vercel, Cloudflare, etc.)
    const headerCountry =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      request.headers.get("x-country-code") ||
      request.headers.get("x-country");

    if (headerCountry && headerCountry !== "XX") {
      return NextResponse.json({
        country: headerCountry.toUpperCase(),
        source: "header",
      });
    }

    // 2. Fallback to public IP geolocation API
    const res = await fetch("https://api.country.is", {
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.country) {
        return NextResponse.json({
          country: String(data.country).toUpperCase(),
          source: "ip",
        });
      }
    }
  } catch (error) {
    console.error("Country detection error:", error);
  }

  return NextResponse.json({ country: "UNKNOWN", source: "default" });
}
