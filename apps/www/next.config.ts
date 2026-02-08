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
};

export default nextConfig;
