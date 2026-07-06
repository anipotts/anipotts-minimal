#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ADMIN_PROTECTED_SMOKE_ROUTES,
  ADMIN_ROUTES,
  PUBLIC_UNSMOKED_ROUTE_FILES,
} from "./admin-route-inventory.mjs";

const navSource = readFileSync("apps/admin/src/data/admin.ts", "utf8");
const middlewareSource = readFileSync("apps/admin/src/middleware.ts", "utf8");
const passkeyProofSource = readFileSync(
  "scripts/admin/passkey-proof.mjs",
  "utf8",
);
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
  "/api/mcp",
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

const classifiedFiles = new Set([
  ...ADMIN_ROUTES.map((route) => route.file),
  ...PUBLIC_UNSMOKED_ROUTE_FILES,
]);

for (const file of listAdminPageFiles()) {
  assert.ok(
    classifiedFiles.has(file),
    `${file} must be classified in admin-route-parity before it can ship`,
  );
}

for (const file of PUBLIC_UNSMOKED_ROUTE_FILES) {
  assert.ok(existsSync(file), `public admin exception missing ${file}`);
}

assert.ok(
  passkeyProofSource.includes("ADMIN_PROTECTED_SMOKE_ROUTES"),
  "passkey proof must import shared protected smoke routes",
);
assert.ok(
  passkeyProofSource.includes("const ROUTES = ADMIN_PROTECTED_SMOKE_ROUTES;"),
  "passkey proof must use the shared protected smoke route list",
);

for (const route of ADMIN_ROUTES) {
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
    assert.ok(
      ADMIN_PROTECTED_SMOKE_ROUTES.includes(route.route),
      `${route.route} missing from shared passkey proof route set`,
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
  "/api/admin/content/editor",
  "publish selected draft",
  "content_draft_operations",
  "new content starts as a private draft",
]) {
  assert.ok(
    contentEditorSource.includes(marker),
    `/content/edit/:pageKey missing draft editor marker ${marker}`,
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

function listAdminPageFiles(dir = "apps/admin/src/pages") {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listAdminPageFiles(path);
    if (!entry.isFile()) return [];
    if (!/\.(astro|ts)$/.test(entry.name)) return [];
    return [path];
  });
}
