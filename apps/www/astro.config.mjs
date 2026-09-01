// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import icon from "astro-icon";
import { publicContentHotReload } from "../../scripts/dev/public-content-hot-reload.mjs";

export default defineConfig({
  site: "https://anipotts.com",
  output: "static",
  trailingSlash: "never",
  build: { format: "file" },
  vite: {
    plugins: [publicContentHotReload()],
    server: {
      allowedHosts: ["news.anipotts.com", ".anipotts.localhost"],
    },
  },
  adapter: cloudflare({
    platformProxy: { enabled: true },
    imageService: "passthrough",
  }),
  integrations: [
    icon({
      include: {
        ph: [
          "activity",
          "archive",
          "arrow-bend-right-up",
          "arrow-bend-up-left",
          "arrow-left",
          "arrow-up-right",
          "book-open-text",
          "briefcase",
          "calendar-blank",
          "calendar-dots",
          "chart-line-up",
          "check-circle",
          "circle",
          "circle-half",
          "desktop-tower",
          "envelope-open",
          "github-logo",
          "hard-drives",
          "heart",
          "linkedin-logo",
          "lock-key",
          "play",
          "rss-simple",
          "seal-check",
          "spinner-gap",
          "user-circle",
          "user-focus",
          "waveform",
          "x-logo",
        ],
      },
    }),
  ],
  markdown: {
    shikiConfig: { theme: "css-variables" },
  },
});
