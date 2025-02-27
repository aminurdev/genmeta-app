import type { NextConfig } from "next";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/v1/:path*",
      },
    ];
  },
} as NextConfig;

export default nextConfig;
