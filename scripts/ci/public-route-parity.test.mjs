#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const PUBLIC_ROUTES = [
  { route: "/", file: "apps/www/src/pages/index.astro" },
  { route: "/newsletter", file: "apps/www/src/pages/newsletter.astro" },
  {
    route: "/newsletter/archive",
    file: "apps/www/src/pages/newsletter/archive.astro",
  },
  { route: "/making", file: "apps/www/src/pages/making.astro" },
  { route: "/orchestrating", file: "apps/www/src/pages/orchestrating.astro" },
  { route: "/projects", file: "apps/www/src/pages/projects/index.astro" },
  { route: "/writing", file: "apps/www/src/pages/writing/index.astro" },
];

const deployWorkflow = readFileSync(".github/workflows/deploy.yml", "utf8");
const smokeWorkflow = readFileSync(".github/workflows/smoke.yml", "utf8");
const contentProof = readFileSync("scripts/admin/content-proof.mjs", "utf8");

const expected = PUBLIC_ROUTES.map((item) => item.route).sort();
const deploySmokeRoutes = extractRoutesFromStep(
  deployWorkflow,
  "Smoke www routes",
);
const manualSmokeRoutes = extractRoutesFromStep(
  smokeWorkflow,
  "Smoke public site",
);
const contentProofRoutes = extractConstList(contentProof, "PUBLIC_ROUTES");

for (const { route, file } of PUBLIC_ROUTES) {
  assert.ok(existsSync(file), `${route} missing route file ${file}`);
}

assert.deepEqual(
  deploySmokeRoutes,
  expected,
  "deploy.yml public smoke routes must match the stable public route proof set",
);

assert.deepEqual(
  manualSmokeRoutes,
  expected,
  "smoke.yml public smoke routes must match the stable public route proof set",
);

assert.deepEqual(
  contentProofRoutes,
  expected,
  "content-proof public route probes must match the stable public route proof set",
);

function extractRoutesFromStep(source, stepName) {
  const stepStart = source.indexOf(`name: ${stepName}`);
  assert.notEqual(stepStart, -1, `missing workflow step ${stepName}`);
  const fromStep = source.slice(stepStart);
  const match = fromStep.match(/for path in ([^;]+); do/);
  assert.ok(match, `${stepName} must use an explicit public route loop`);
  return match[1]
    .trim()
    .split(/\s+/)
    .filter((route) => route.startsWith("/"))
    .sort();
}

function extractConstList(source, name) {
  const match = source.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\];`));
  assert.ok(match, `missing const list ${name}`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]).sort();
}
