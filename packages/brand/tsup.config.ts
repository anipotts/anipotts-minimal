import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { header: "src/header.ts" },
    format: ["iife"],
    globalName: "AniPottsBrand",
    minify: true,
    clean: true,
  },
  {
    entry: { footer: "src/footer.ts" },
    format: ["iife"],
    globalName: "AniPottsFooter",
    minify: true,
  },
  {
    entry: { watermark: "src/watermark.ts" },
    format: ["iife"],
    globalName: "AniPottsWatermark",
    minify: true,
  },
  {
    entry: { card: "src/card.ts" },
    format: ["iife"],
    globalName: "AniPottsCard",
    minify: true,
  },
  {
    entry: { colophon: "src/colophon.ts" },
    format: ["iife"],
    globalName: "AniPottsColophon",
    minify: true,
  },
  {
    entry: { toast: "src/toast.ts" },
    format: ["iife"],
    globalName: "AniPottsToast",
    minify: true,
  },
]);
