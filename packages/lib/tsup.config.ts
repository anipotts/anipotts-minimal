import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "db/index": "src/db/index.ts",
    "utils/index": "src/utils/index.ts",
    "feature-flags/index": "src/feature-flags/index.ts",
    "data/index": "src/data/index.ts",
    "admin/index": "src/admin/index.ts",
    "metrics/index": "src/metrics/index.ts",
    "status/index": "src/status/index.ts",
    "typefully/index": "src/typefully/index.ts",
    "cms/index": "src/cms/index.ts",
    "validation/index": "src/validation/index.ts",
  },
  format: ["esm"],
  dts: true,
  splitting: true,
  sourcemap: false,
  external: ["posthog-node"],
});
