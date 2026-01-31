import type { NextConfig } from "next";
import path from "path";

const emptyStub = path.join(__dirname, "../stubs/empty.js");

/**
 * Shared Next.js config for all anipotts.com apps.
 * Includes transpilePackages for workspace deps and PostHog proxy rewrites.
 */
export const baseNextConfig: NextConfig = {
  transpilePackages: ["@anipotts/ui", "@anipotts/lib", "@anipotts/types"],
  turbopack: {
    resolveAlias: {
      // framer-motion's proxy.mjs imports node:fs which Turbopack can't handle in client bundles.
      // Stub it out in browser context.
      "node:fs": { browser: emptyStub },
    },
  },
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
