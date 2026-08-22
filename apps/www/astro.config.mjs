// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import icon from "astro-icon";

export default defineConfig({
  site: "https://anipotts.com",
  output: "static",
  trailingSlash: "never",
  build: { format: "file" },
  vite: {
    server: {
      allowedHosts: ["news.anipotts.com", ".anipotts.localhost"],
    },
  },
  adapter: cloudflare({
    platformProxy: { enabled: true },
    imageService: "passthrough",
  }),
  integrations: [icon()],
  markdown: {
    shikiConfig: { theme: "css-variables" },
  },
});
