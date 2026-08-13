#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PUBLIC_SMOKE_ROUTES } from "./public-route-inventory.mjs";

const deployWorkflow = readFileSync(".github/workflows/deploy.yml", "utf8");
const smokeWorkflow = readFileSync(".github/workflows/smoke.yml", "utf8");
const contentProof = readFileSync("scripts/admin/content-proof.mjs", "utf8");
const deploySmokeStep = extractSection(
  deployWorkflow,
  "      - name: Smoke www routes",
  "\n  deploy-admin:",
);
const manualSmokeStep = extractSection(
  smokeWorkflow,
  "      - name: Smoke public site",
  "\n      - name: Smoke admin unauthenticated block",
);

assert.equal(PUBLIC_SMOKE_ROUTES.length, 22);

for (const [sourceName, source] of [
  ["deploy.yml", deployWorkflow],
  ["smoke.yml", smokeWorkflow],
]) {
  assert.ok(
    source.includes("node scripts/ci/public-route-inventory.mjs"),
    `${sourceName} must load the shared public route inventory`,
  );
  assert.ok(
    source.includes("while IFS= read -r path; do"),
    `${sourceName} must read one inventory route per line`,
  );
  assert.ok(
    source.includes('"https://anipotts.com${path}"'),
    `${sourceName} must quote the public route path`,
  );
}

assert.ok(
  contentProof.includes(
    'import { PUBLIC_SMOKE_ROUTES } from "../ci/public-route-inventory.mjs";',
  ),
  "content-proof must import shared public smoke routes",
);
assert.ok(
  contentProof.includes("const PUBLIC_ROUTES = PUBLIC_SMOKE_ROUTES;"),
  "content-proof must probe the shared public smoke route set",
);

assert.ok(deploySmokeStep.includes("curl -sS"));
assert.equal(deploySmokeStep.match(/curl -sS/g)?.length, 1);
assert.equal(deploySmokeStep.includes("curl -I"), false);
assert.ok(deploySmokeStep.includes("for _ in $(seq 1 6); do"));
assert.ok(deploySmokeStep.includes("sleep 10"));
assert.ok(manualSmokeStep.includes("curl -sS"));
assert.equal(manualSmokeStep.match(/curl -sS/g)?.length, 1);
assert.equal(manualSmokeStep.includes("curl -I"), false);
assert.equal(manualSmokeStep.includes("seq 1 6"), false);
assert.equal(manualSmokeStep.includes("sleep 10"), false);

for (const marker of [
  'method: "HEAD"',
  "runD1(`",
  "publishedEventRoutes",
  "UNPUBLISHED_PUBLIC_ROUTES",
  "publishedEventRouteChecks",
  "unpublishedPublicRouteChecks",
]) {
  assert.ok(
    contentProof.includes(marker),
    `content-proof must retain ${marker}`,
  );
}

function extractSection(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `missing ${startMarker.trim()}`);
  const end = source.indexOf(endMarker, start);
  assert.notEqual(end, -1, `missing ${endMarker.trim()}`);
  return source.slice(start, end);
}
