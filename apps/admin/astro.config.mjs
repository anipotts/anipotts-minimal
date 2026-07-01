// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://admin.anipotts.com",
  output: "server",
  trailingSlash: "never",
  server: {
    host: "127.0.0.1",
    port: 3001,
  },
  adapter: cloudflare({
    platformProxy: { enabled: true },
    imageService: "passthrough",
  }),
});
