#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = mkdtempSync(join(tmpdir(), "anipotts-d1-proof-"));
const migrations = join(root, "migrations");
const state = join(root, "state");

try {
  mkdirSync(migrations);
  writeFileSync(join(root, "worker.mjs"), "export default { fetch() {} };\n");
  writeFileSync(
    join(root, "wrangler.toml"),
    [
      'name = "anipotts-release-policy-proof"',
      'main = "worker.mjs"',
      'compatibility_date = "2026-08-05"',
      "[[d1_databases]]",
      'binding = "DB"',
      'database_name = "release-policy-proof"',
      'database_id = "00000000-0000-0000-0000-000000000000"',
      'migrations_dir = "migrations"',
      "",
    ].join("\n"),
  );
  writeFileSync(
    join(migrations, "0001_release_canary.sql"),
    [
      "CREATE TABLE IF NOT EXISTS release_canary (",
      "  id TEXT PRIMARY KEY,",
      "  created_at TEXT NOT NULL",
      ");",
      "CREATE INDEX IF NOT EXISTS idx_release_canary_created_at",
      "  ON release_canary(created_at);",
      "",
    ].join("\n"),
  );

  const wrangler = join(process.cwd(), "node_modules/.bin/wrangler");
  const args = [
    "d1",
    "migrations",
    "apply",
    "release-policy-proof",
    "--local",
    "--config",
    join(root, "wrangler.toml"),
    "--persist-to",
    state,
  ];
  const first = execFileSync(wrangler, args, { encoding: "utf8" });
  const second = execFileSync(wrangler, args, { encoding: "utf8" });
  assert.match(first, /0001_release_canary\.sql/);
  assert.match(second, /No migrations to apply/);

  const query = execFileSync(
    wrangler,
    [
      "d1",
      "execute",
      "release-policy-proof",
      "--local",
      "--config",
      join(root, "wrangler.toml"),
      "--persist-to",
      state,
      "--json",
      "--command",
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'release_canary'",
    ],
    { encoding: "utf8" },
  );
  const result = JSON.parse(query);
  assert.equal(result[0].results[0].name, "release_canary");
  assert.notEqual(result[0].meta.changed_db, true);
  console.log("local D1 migration proof passed");
} finally {
  rmSync(root, { recursive: true, force: true });
}
