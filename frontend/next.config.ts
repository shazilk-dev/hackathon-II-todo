import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // Phase 4: Standalone output for optimized Docker containerization
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Proxy backend API calls through Next.js server
  // Browser calls /backend/api/... → Next.js proxies to internal backend service
  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return [
      {
        source: "/backend/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default config;
