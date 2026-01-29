import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Skip prerendering API routes
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Ensure API routes are not pre-rendered
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
