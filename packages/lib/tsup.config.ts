import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "supabase/index": "src/supabase/index.ts",
    "posthog/index": "src/posthog/index.ts",
    "utils/index": "src/utils/index.ts",
    "feature-flags/index": "src/feature-flags/index.ts",
    "data/index": "src/data/index.ts",
    "admin/index": "src/admin/index.ts",
    "metrics/index": "src/metrics/index.ts",
    "status/index": "src/status/index.ts",
    "typefully/index": "src/typefully/index.ts",
    "cms/index": "src/cms/index.ts",
  },
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["@supabase/supabase-js", "posthog-node"],
});
