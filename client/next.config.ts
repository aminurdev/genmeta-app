import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentUpgrade: "latest",
  },
  async rewrites() {
    const backendApiUrl = (
      process.env.BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://localhost:5000/api/v1"
    ).replace(/\/+$/, "");

    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendApiUrl}/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/ai-metadata-generator-for-adobe-stock",
        destination: "/for-adobe-stock",
        permanent: true,
      },
      {
        source: "/genmeta-for-adobe-stock",
        destination: "/for-adobe-stock",
        permanent: true,
      },
      {
        source: "/ai-metadata-generator-for-shutterstock",
        destination: "/for-shutterstock",
        permanent: true,
      },
      {
        source: "/genmeta-for-shutterstock",
        destination: "/for-shutterstock",
        permanent: true,
      },
      {
        source: "/genmeta-for-freepik",
        destination: "/for-freepik",
        permanent: true,
      },
      {
        source: "/ai-metadata-generator-for-vectors",
        destination: "/for-vectors",
        permanent: true,
      },
      {
        source: "/ai-metadata-generator-for-stock-video",
        destination: "/for-stock-video",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
