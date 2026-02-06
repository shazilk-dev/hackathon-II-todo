import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // Phase 4: Standalone output for optimized Docker containerization
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    }
  }
};

export default config;
