import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  server: {
    preset: "cloudflare-module",
    rollupConfig: {
      external: ["node:async_hooks"],
    },
  },
  ssr: true,
});
