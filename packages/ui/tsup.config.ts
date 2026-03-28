import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "components/window/index": "src/components/window/index.ts",
    "components/animation/index": "src/components/animation/index.ts",
    "components/layout/index": "src/components/layout/index.ts",
    "components/feedback/index": "src/components/feedback/index.ts",
    "context/index": "src/context/index.ts",
    "hooks/index": "src/hooks/index.ts",
    "providers/index": "src/providers/index.ts",
  },
  format: ["esm"],
  // dts: false - types resolve via TS project references and tsconfig paths, not .d.ts files
  dts: false,
  splitting: true,
  sourcemap: false,
  external: ["react", "react-dom", "next"],
});
