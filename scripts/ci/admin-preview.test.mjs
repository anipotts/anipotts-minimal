#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const previewSource = readFileSync("scripts/admin/admin-preview.mjs", "utf8");
const passkeySource = readFileSync(
  "apps/admin/src/lib/passkey-auth.ts",
  "utf8",
);
const agentGuide = readFileSync("AGENTS.md", "utf8");
const previewGuide = readFileSync(
  "docs/local-admin-preview-thread-prompt.md",
  "utf8",
);

assert.equal(
  packageJson.scripts["admin:preview:ensure"],
  "node scripts/admin/admin-preview.mjs ensure",
);
assert.equal(
  packageJson.scripts["admin:preview:status"],
  "node scripts/admin/admin-preview.mjs status",
);
assert.equal(
  packageJson.scripts["admin:preview:stop"],
  "node scripts/admin/admin-preview.mjs stop",
);

for (const marker of [
  'const DEFAULT_HOST = "localhost"',
  "const DEFAULT_PORT = 4311",
  'const HEALTH_PATH = "/api/health"',
  'payload?.app === "admin-astro"',
  'payload?.target === "admin.anipotts.com"',
  "processMatches(metadata)",
  "no process was stopped",
  'process.kill(-metadata.pid, "SIGTERM")',
  "no stronger signal was sent",
]) {
  assert.ok(
    previewSource.includes(marker),
    `preview manager missing ${marker}`,
  );
}

assert.equal(
  previewSource.includes("ADMIN_PREVIEW_HOST"),
  false,
  "preview manager must stay bound to canonical loopback",
);

assert.ok(
  passkeySource.includes("isLoopbackDevOrigin"),
  "passkey auth must recognize the canonical loopback preview",
);
assert.equal(
  passkeySource.includes('const LOCAL_ORIGIN = "http://localhost:3001"'),
  false,
  "passkey auth must not pin local development to one port",
);

for (const source of [agentGuide, previewGuide]) {
  assert.ok(
    source.includes("pnpm admin:preview:ensure"),
    "local preview guidance must use the durable ensure command",
  );
  assert.ok(
    source.includes("http://localhost:4311/"),
    "local preview guidance must name the canonical review URL",
  );
}

console.log("admin preview invariants: ok");
