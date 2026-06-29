#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const ROUTES = [
  { route: "/", file: "apps/admin/src/pages/index.astro", nav: true },
  {
    route: "/auth/passkey",
    file: "apps/admin/src/pages/auth/passkey.astro",
    nav: false,
  },
  {
    route: "/content",
    file: "apps/admin/src/pages/content/index.astro",
    nav: true,
  },
  {
    route: "/content/review",
    file: "apps/admin/src/pages/content/review.astro",
    nav: true,
  },
  {
    route: "/content/preview",
    file: "apps/admin/src/pages/content/preview.astro",
    nav: true,
  },
  {
    route: "/content/operations",
    file: "apps/admin/src/pages/content/operations.astro",
    nav: true,
  },
  {
    route: "/newsletter",
    file: "apps/admin/src/pages/newsletter.astro",
    nav: true,
  },
  {
    route: "/newsletter/first-thing-agents-need-control-plane",
    file: "apps/admin/src/pages/newsletter/[slug].astro",
    nav: false,
  },
  {
    route: "/needs-ani",
    file: "apps/admin/src/pages/needs-ani.astro",
    nav: true,
  },
  { route: "/proof", file: "apps/admin/src/pages/proof.astro", nav: true },
  { route: "/repos", file: "apps/admin/src/pages/repos.astro", nav: true },
  {
    route: "/handoffs",
    file: "apps/admin/src/pages/handoffs.astro",
    nav: true,
  },
  { route: "/fleet", file: "apps/admin/src/pages/fleet.astro", nav: true },
  {
    route: "/mutations",
    file: "apps/admin/src/pages/mutations.astro",
    nav: true,
  },
  {
    route: "/ops/destructive",
    file: "apps/admin/src/pages/ops/destructive.astro",
    nav: true,
  },
  {
    route: "/api/admin/runtime-feed",
    file: "apps/admin/src/pages/api/admin/runtime-feed.ts",
    nav: false,
    smoke: false,
  },
];

const navSource = readFileSync("apps/admin/src/data/admin.ts", "utf8");
const deployWorkflow = readFileSync(".github/workflows/deploy.yml", "utf8");
const smokeWorkflow = readFileSync(".github/workflows/smoke.yml", "utf8");
const deploySmokeRoutes = extractShellForRoutes(deployWorkflow);
const manualSmokeRoutes = extractShellForRoutes(smokeWorkflow);

for (const route of ROUTES) {
  assert.ok(existsSync(route.file), `${route.route} missing ${route.file}`);

  if (route.nav) {
    assert.ok(
      navSource.includes(`href: "${route.route}"`),
      `${route.route} missing from admin nav`,
    );
  }

  if (route.smoke !== false) {
    assert.ok(
      deploySmokeRoutes.has(route.route),
      `${route.route} missing from deploy admin smoke`,
    );
    assert.ok(
      manualSmokeRoutes.has(route.route),
      `${route.route} missing from smoke.yml admin route proof`,
    );
  }
}

function extractShellForRoutes(source) {
  return new Set(
    [...source.matchAll(/for path in ([^;]+); do/g)]
      .flatMap((match) => match[1].trim().split(/\s+/))
      .filter((route) => route.startsWith("/")),
  );
}
