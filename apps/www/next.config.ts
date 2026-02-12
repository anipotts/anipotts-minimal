import type { NextConfig } from "next";
import { baseNextConfig } from "@anipotts/config/next";

const nextConfig: NextConfig = {
  ...baseNextConfig,
  async redirects() {
    return [
      { source: "/lab", destination: "/work", permanent: true },
      { source: "/lab/:path*", destination: "/work", permanent: true },
      { source: "/links", destination: "/connect", permanent: true },
      { source: "/links/:path*", destination: "/connect", permanent: true },
      { source: "/updates", destination: "/dev?section=activity", permanent: true },
      { source: "/updates/:path*", destination: "/dev?section=activity", permanent: true },
      { source: "/metrics", destination: "/dev?section=metrics", permanent: true },
      { source: "/metrics/:path*", destination: "/dev?section=metrics", permanent: true },
      { source: "/status", destination: "/dev?section=status", permanent: true },
      { source: "/status/:path*", destination: "/dev?section=status", permanent: true },
      { source: "/docs", destination: "/", permanent: true },
      { source: "/docs/:path*", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://us.i.posthog.com https://us-assets.i.posthog.com",
              "frame-src https://challenges.cloudflare.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
