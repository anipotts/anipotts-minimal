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
const inboxDataSource = readFileSync("apps/admin/src/data/inbox.ts", "utf8");
const inboxSource = readFileSync("apps/admin/src/pages/inbox.astro", "utf8");
const rootSource = readFileSync("apps/admin/src/pages/index.astro", "utf8");
const homeSource = readFileSync(
  "apps/admin/src/components/AdminHome.astro",
  "utf8",
);
const knowledgeSource = readFileSync(
  "apps/admin/src/pages/knowledge.astro",
  "utf8",
);
const workSource = readFileSync("apps/admin/src/pages/work.astro", "utf8");
const lifeSource = readFileSync(
  "apps/admin/src/pages/life/index.astro",
  "utf8",
);
const healthSource = readFileSync(
  "apps/admin/src/pages/life/health.astro",
  "utf8",
);
const aestheticsSource = readFileSync(
  "apps/admin/src/pages/life/aesthetics.astro",
  "utf8",
);
const lifecycleSource = readFileSync(
  "packages/lib/src/admin-control/work-lifecycle.ts",
  "utf8",
);
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
const retiredActionQueueFiles = [
  "apps/admin/src/pages/needs-ani.astro",
  "apps/admin/src/data/needs.ts",
  "apps/admin/src/data/static/needs-ani.syscalls.json",
  "packages/content/src/admin/needs.ts",
];

assert.deepEqual(publicPaths, [
  "/api/health",
  "/api/mcp",
  "/apple-touch-icon.png",
  "/auth/passkey",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/favicon-dark-32.png",
  "/favicon-dark.svg",
  "/favicon-light-32.png",
  "/favicon-light.svg",
  "/favicon.svg",
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

assert.equal(
  [...navSource.matchAll(/label: "inbox"/g)].length,
  1,
  "admin nav must expose one primary inbox entry",
);
assert.ok(
  rootSource.includes('import AdminHome from "../components/AdminHome.astro"'),
  "admin root must render the canonical home projection",
);
assert.ok(
  inboxSource.includes('import AdminHome from "../components/AdminHome.astro"'),
  "/inbox must render the same canonical home projection",
);
assert.equal(
  inboxSource,
  rootSource,
  "/ and /inbox must resolve the identical attention component",
);
assert.ok(
  navSource.includes('href: "/",\n    label: "inbox"'),
  "admin inbox navigation must use the canonical root URL",
);
for (const file of retiredActionQueueFiles) {
  assert.equal(existsSync(file), false, `${file} must stay retired`);
}
assert.equal(
  ADMIN_ROUTES.some((route) => route.route === "/needs-ani"),
  false,
  "retired action queue route must not be classified",
);
assert.equal(
  deploySmokeRoutes.has("/needs-ani"),
  false,
  "retired action queue route must not stay in deploy smoke",
);
assert.equal(
  manualSmokeRoutes.has("/needs-ani"),
  false,
  "retired action queue route must not stay in manual smoke",
);

for (const marker of [
  'id: "work"',
  'id: "content"',
  'id: "life"',
  'id: "fleet"',
  'id: "system"',
  "data-copy-text",
  "data-attention-id",
  "data-entity-id",
  "data-astro-rerun",
  "adminHomeBound",
  'target.closest("[data-copy-text]")',
  "what needs attention",
  "inbox-category-filter",
  "refresh on open",
  "waiting / gated",
]) {
  assert.ok(homeSource.includes(marker), `admin home missing marker ${marker}`);
}

for (const marker of [
  "card → bounded proof → canonical source",
  "before asking Ani",
  "knowledge never becomes Inbox",
  "data-knowledge-search",
  "data-knowledge-domain",
]) {
  assert.ok(
    knowledgeSource.includes(marker),
    `admin knowledge missing marker ${marker}`,
  );
}

for (const marker of [
  "Native runtime state stays separate",
  "current work",
  "source lineage",
  "loose chats",
  "preserved and collapsed",
]) {
  assert.ok(workSource.includes(marker), `admin work missing marker ${marker}`);
}

for (const marker of [
  "no separate inbox",
  "/life/health",
  "/life/aesthetics",
]) {
  assert.ok(lifeSource.includes(marker), `admin life missing marker ${marker}`);
}
assert.ok(
  healthSource.includes("does not infer tasks"),
  "health must remain status only",
);
assert.ok(
  aestheticsSource.includes("No wardrobe automation or image ingestion"),
  "aesthetics must remain a clean data boundary",
);

for (const marker of [
  "source → entity → outcome → attention → history",
  "data-lifecycle-search",
  "data-archive-candidate",
  "data-propose-archive",
  "data-confirm-archive",
  "data-restore-archive",
  "admin projection only",
  "ChatGPT conversation",
  "Codex task",
]) {
  assert.ok(homeSource.includes(marker), `admin lifecycle missing ${marker}`);
}

for (const marker of [
  "sourceIdentityKey",
  "upsertSourceImport",
  "evaluateArchiveCandidate",
  "createArchiveProposalBatches",
  "confirmArchiveProposal",
  "restoreArchiveReceipt",
  "MAX_ARCHIVE_BATCH_SIZE = 20",
]) {
  assert.ok(
    lifecycleSource.includes(marker),
    `lifecycle seam missing ${marker}`,
  );
}

for (const marker of [
  "loadAdminControlSnapshot",
  "control.projections.inbox_items",
  "dedupeInboxItems",
  "copy_text",
]) {
  assert.ok(
    inboxDataSource.includes(marker),
    `admin inbox adapter missing marker ${marker}`,
  );
}
assert.equal(
  inboxDataSource.includes('from "./needs"'),
  false,
  "admin inbox must not import the retired static action queue",
);
assert.equal(
  homeSource.includes("needs ani"),
  false,
  "canonical inbox must not expose the retired queue label",
);

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
