import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
