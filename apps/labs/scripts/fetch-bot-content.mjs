#!/usr/bin/env node
/**
 * Pull github.com/anipotts/labs into content/_labs-bot at build time.
 *
 * Bot-authored markdown lives in a separate repo on purpose. See
 * apps/labs/README.md "Why two repos". This script keeps the bot/human
 * separation intact while letting Next render both at once.
 *
 * Behavior:
 *  - SKIP_LABS_FETCH=1 reuses the existing cache instead of re-cloning.
 *  - Otherwise removes the cache dir and re-clones at depth 1.
 *  - The clone is the build's last hermetic step before Next compiles.
 *  - Fails closed: any clone error aborts the build rather than shipping an empty index.
 */

import { spawnSync } from "node:child_process";
import { rmSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TARGET = join(ROOT, "content", "_labs-bot");
const REPO = "https://github.com/anipotts/labs.git";

if (process.env.SKIP_LABS_FETCH === "1" && existsSync(join(TARGET, "weekly"))) {
  console.log("[fetch-bot-content] SKIP_LABS_FETCH=1, using cached clone");
  process.exit(0);
}

if (existsSync(TARGET)) {
  rmSync(TARGET, { recursive: true, force: true });
}
mkdirSync(dirname(TARGET), { recursive: true });

console.log(`[fetch-bot-content] cloning ${REPO} -> ${TARGET}`);
const result = spawnSync(
  "git",
  ["clone", "--depth=1", "--quiet", REPO, TARGET],
  { stdio: ["ignore", "inherit", "inherit"] },
);

if (result.status !== 0) {
  console.error(
    `[fetch-bot-content] clone failed (exit ${result.status})`,
    result.error?.message ?? "",
  );
  process.exit(1);
}

const weeklyDir = join(TARGET, "weekly");
if (!existsSync(weeklyDir)) {
  console.error("[fetch-bot-content] expected content/_labs-bot/weekly to exist");
  process.exit(1);
}

const count = readdirSync(weeklyDir).filter((f) => f.endsWith(".md")).length;
console.log(`[fetch-bot-content] ok, ${count} weekly digest(s) available`);
