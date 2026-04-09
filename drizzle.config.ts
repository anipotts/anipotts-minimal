import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./packages/lib/src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
});
