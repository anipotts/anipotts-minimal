#!/usr/bin/env node

import assert from "node:assert/strict";
import { computeDeployTargets } from "./compute-deploy-targets.mjs";

const empty = {
  www: false,
  admin: false,
  admin_solid: false,
  ingest: false,
  newsletter: false,
  state: false,
  weekly_email: false,
};

function expectTargets(name, files, expected) {
  assert.deepEqual(
    computeDeployTargets(files),
    { ...empty, ...expected },
    name,
  );
}

expectTargets(
  "docs-only changes under workers and docs do not deploy",
  [
    "docs/archive/personal-cloud-architecture-2026-05-13.md",
    "workers/state/README.md",
    "apps/admin/README.md",
    ".github/ISSUE_TEMPLATE/bug.md",
    "LICENSE",
  ],
  {},
);

expectTargets(
  "public site source deploys www",
  ["apps/www/src/pages/index.astro"],
  {
    www: true,
  },
);

expectTargets(
  "admin source and content package deploy admin",
  [
    "apps/admin/src/pages/content/index.astro",
    "packages/content/src/admin/content.ts",
  ],
  { admin: true },
);

expectTargets(
  "admin worker config deploys admin",
  ["apps/admin/wrangler.toml"],
  { admin: true },
);

expectTargets(
  "admin-solid source does not auto-deploy rollback worker",
  ["apps/admin-solid/src/routes/index.tsx"],
  {},
);

expectTargets(
  "worker source deploys exact worker",
  ["workers/state/src/index.ts"],
  {
    state: true,
  },
);

expectTargets(
  "shared runtime packages deploy www only",
  ["packages/lib/src/cms/index.ts", "packages/styles/src/tokens.css"],
  { www: true },
);

expectTargets(
  "root dependency files do not fan out",
  ["package.json", "pnpm-lock.yaml"],
  {},
);

expectTargets(
  "mixed app and worker changes preserve exact targets",
  ["apps/admin/src/pages/proof.astro", "workers/newsletter/src/index.ts"],
  { admin: true, newsletter: true },
);
