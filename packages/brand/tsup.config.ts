import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/header.ts"],
  format: ["iife"],
  globalName: "AniPottsBrand",
  minify: true,
  clean: true,
});
