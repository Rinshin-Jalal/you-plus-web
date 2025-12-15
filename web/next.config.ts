import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip type checking during build (handled separately)
  typescript: {
    ignoreBuildErrors: false,
  },
  // Reduce bundle size
  experimental: {
    // Minimize server bundle
    serverMinification: true,
  },
  // Optimize output
  output: 'standalone',
};

export default nextConfig;

// Initialize OpenNext Cloudflare for local development
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
