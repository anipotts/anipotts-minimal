import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  middleware: "./src/middleware.ts",
  server: {
    preset: "cloudflare-module",
    rollupConfig: {
      external: ["node:async_hooks"],
    },
  },
  ssr: true,
});
