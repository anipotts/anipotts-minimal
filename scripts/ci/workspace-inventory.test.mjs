#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const EXPECTED_APPS = ["admin", "admin-solid", "www"];
const EXPECTED_PACKAGES = ["config", "content", "lib", "styles", "types"];
const EXPECTED_WORKERS = ["ingest", "newsletter", "state", "weekly-email"];
const EXPECTED_WORKSPACE_GLOBS = ['"apps/*"', '"packages/*"', '"workers/*"'];

assert.deepEqual(
  packageDirs("apps"),
  EXPECTED_APPS,
  "apps inventory drifted from the target platform",
);
assert.deepEqual(
  packageDirs("packages"),
  EXPECTED_PACKAGES,
  "packages inventory drifted from the target platform",
);
assert.deepEqual(
  packageDirs("workers"),
  EXPECTED_WORKERS,
  "workers inventory drifted from retained production workers",
);
assert.equal(existsSync("apps/labs"), false, "apps/labs must stay archived");
assert.equal(
  existsSync("services"),
  false,
  "services workspace must stay removed",
);
assert.equal(
  existsSync("archives"),
  false,
  "root archives directory must stay consolidated under docs/archive",
);

const workspace = readFileSync("pnpm-workspace.yaml", "utf8");
for (const glob of EXPECTED_WORKSPACE_GLOBS) {
  assert.ok(workspace.includes(glob), `missing workspace glob ${glob}`);
}
assert.equal(
  workspace.includes('"services"'),
  false,
  "services workspace glob must stay removed",
);

function packageDirs(root) {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(join(root, name, "package.json")))
    .sort();
}
