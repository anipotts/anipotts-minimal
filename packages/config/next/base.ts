import type { NextConfig } from "next";

/**
 * Shared Next.js config for all anipotts.com apps.
 * Includes transpilePackages for workspace deps and PostHog proxy rewrites.
 */
export const baseNextConfig: NextConfig = {
  transpilePackages: ["@anipotts/ui", "@anipotts/types"],
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};
