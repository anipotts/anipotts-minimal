import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "supabase/index": "src/supabase/index.ts",
    "utils/index": "src/utils/index.ts",
    "feature-flags/index": "src/feature-flags/index.ts",
    "data/index": "src/data/index.ts",
    "admin/index": "src/admin/index.ts",
    "metrics/index": "src/metrics/index.ts",
    "status/index": "src/status/index.ts",
    "typefully/index": "src/typefully/index.ts",
    "cms/index": "src/cms/index.ts",
    "storage/index": "src/storage/index.ts",
    "validation/index": "src/validation/index.ts",
  },
  format: ["esm"],
  // dts: false - types resolve via TS project references and tsconfig paths, not .d.ts files
  dts: false,
  splitting: true,
  sourcemap: false,
  external: ["@supabase/supabase-js", "posthog-node"],
});
