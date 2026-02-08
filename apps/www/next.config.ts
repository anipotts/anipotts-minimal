import type { NextConfig } from "next";
import { baseNextConfig } from "@anipotts/config/next";

const nextConfig: NextConfig = {
  ...baseNextConfig,
  async redirects() {
    return [
      {
        source: "/thoughts",
        destination: "https://thoughts.anipotts.com",
        permanent: true,
      },
      {
        source: "/thoughts/:slug*",
        destination: "https://thoughts.anipotts.com/:slug*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
