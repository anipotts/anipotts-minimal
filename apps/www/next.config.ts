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
      { source: "/admin", destination: "/connect?intent=collab", permanent: false },
      { source: "/admin/:path*", destination: "/connect?intent=collab", permanent: false },
      { source: "/dev", destination: "/claude", permanent: true },
      { source: "/dev/:path*", destination: "/claude", permanent: true },
      { source: "/updates", destination: "/claude#proof", permanent: true },
      { source: "/updates/:path*", destination: "/claude#proof", permanent: true },
      { source: "/metrics", destination: "/claude#playbooks", permanent: true },
      { source: "/metrics/:path*", destination: "/claude#playbooks", permanent: true },
      { source: "/status", destination: "/claude#work-together", permanent: true },
      { source: "/status/:path*", destination: "/claude#work-together", permanent: true },
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
              "connect-src 'self' https://us.i.posthog.com https://us-assets.i.posthog.com",
              "frame-src https://challenges.cloudflare.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
