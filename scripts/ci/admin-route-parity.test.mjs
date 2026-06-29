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
    route: "/content/drafts",
    file: "apps/admin/src/pages/content/drafts.astro",
    nav: true,
  },
  {
    route: "/content/edit/home",
    file: "apps/admin/src/pages/content/edit/[pageKey].astro",
    nav: false,
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
const middlewareSource = readFileSync("apps/admin/src/middleware.ts", "utf8");
const passkeySource = readFileSync(
  "apps/admin/src/pages/auth/passkey.astro",
  "utf8",
);
const contentEditorSource = readFileSync(
  "apps/admin/src/pages/content/edit/[pageKey].astro",
  "utf8",
);
const deployWorkflow = readFileSync(".github/workflows/deploy.yml", "utf8");
const smokeWorkflow = readFileSync(".github/workflows/smoke.yml", "utf8");
const deploySmokeRoutes = extractShellForRoutes(deployWorkflow);
const manualSmokeRoutes = extractShellForRoutes(smokeWorkflow);
const publicPaths = extractStringList(middlewareSource, "PUBLIC_PATHS");
const publicPasskeyApiPaths = extractStringList(
  middlewareSource,
  "PUBLIC_PASSKEY_API_PATHS",
);
const publicPrefixes = extractStringList(middlewareSource, "PUBLIC_PREFIXES");

assert.deepEqual(publicPaths, [
  "/api/health",
  "/apple-touch-icon.png",
  "/auth/passkey",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
]);
assert.deepEqual(publicPasskeyApiPaths, [
  "/api/admin/passkey/login-options",
  "/api/admin/passkey/login-verify",
  "/api/admin/passkey/logout",
  "/api/admin/passkey/register-options",
  "/api/admin/passkey/register-verify",
  "/api/admin/passkey/revoke-current",
  "/api/admin/passkey/status",
]);
assert.deepEqual(publicPrefixes, ["/_astro/", "/assets/"]);

for (const route of ROUTES) {
  assert.ok(existsSync(route.file), `${route.route} missing ${route.file}`);

  if (route.route !== "/auth/passkey") {
    assert.equal(
      publicPaths.includes(route.route),
      false,
      `${route.route} must stay behind passkey middleware`,
    );
    assert.equal(
      publicPasskeyApiPaths.includes(route.route),
      false,
      `${route.route} must not be exposed as a public passkey API`,
    );
    assert.equal(
      publicPrefixes.some((prefix) => route.route.startsWith(prefix)),
      false,
      `${route.route} must not match a public static prefix`,
    );
  }

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

for (const marker of [
  "Access removal runbook",
  "passkey-runbook",
  "passkey-return-path",
  "sanitizeAdminReturnPath",
  "buildRunbookSteps",
  "ready_for_access_removal",
]) {
  assert.ok(
    passkeySource.includes(marker),
    `/auth/passkey missing proof runbook marker ${marker}`,
  );
}

for (const marker of [
  "readPageContentInventoryStore",
  "save disabled",
  "publish disabled",
  "no save route, no publish route, no content mutation",
]) {
  assert.ok(
    contentEditorSource.includes(marker),
    `/content/edit/:pageKey missing inert editor marker ${marker}`,
  );
}

function extractShellForRoutes(source) {
  return new Set(
    [...source.matchAll(/for path in ([^;]+); do/g)]
      .flatMap((match) => match[1].trim().split(/\s+/))
      .filter((route) => route.startsWith("/")),
  );
}

function extractStringList(source, name) {
  const match =
    source.match(
      new RegExp(`const ${name} = new Set\\(\\[([\\s\\S]*?)\\]\\);`),
    ) ?? source.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\];`));
  assert.ok(match, `missing middleware list ${name}`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]).sort();
}
