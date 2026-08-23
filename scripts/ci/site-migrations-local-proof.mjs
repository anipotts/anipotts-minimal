#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = mkdtempSync(join(tmpdir(), "anipotts-site-migrations-"));
const migrations = join(root, "migrations");
const state = join(root, "state");
const wrangler = join(process.cwd(), "node_modules/.bin/wrangler");

try {
  mkdirSync(migrations);
  writeFileSync(join(root, "worker.mjs"), "export default { fetch() {} };\n");
  writeFileSync(
    join(root, "wrangler.toml"),
    [
      'name = "anipotts-site-migration-proof"',
      'main = "worker.mjs"',
      'compatibility_date = "2026-08-15"',
      "[[d1_databases]]",
      'binding = "DB"',
      'database_name = "site-migration-proof"',
      'database_id = "00000000-0000-0000-0000-000000000000"',
      'migrations_dir = "migrations"',
      "",
    ].join("\n"),
  );
  writeFileSync(join(migrations, "0042_fixture_baseline.sql"), baselineSql());
  copyFileSync(
    "drizzle/migrations/0043_admin_auth_v2.sql",
    join(migrations, "0043_admin_auth_v2.sql"),
  );

  const args = [
    "d1",
    "migrations",
    "apply",
    "site-migration-proof",
    "--local",
    "--config",
    join(root, "wrangler.toml"),
    "--persist-to",
    state,
  ];
  const first = execFileSync(wrangler, args, { encoding: "utf8" });
  const second = execFileSync(wrangler, args, { encoding: "utf8" });
  assert.match(first, /0043_admin_auth_v2\.sql/);
  assert.match(second, /No migrations to apply/);

  const rows = query(
    "SELECT " +
      "(SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name IN ('admin_users','admin_sessions','admin_invites','admin_device_authorizations','admin_external_identities','admin_recovery_requests','admin_machine_tokens','admin_security_notifications')) AS auth_tables, " +
      "(SELECT COUNT(*) FROM pragma_table_info('admin_device_authorizations') WHERE name = 'approved_by_credential_id') AS approval_credential_columns",
  );
  assert.deepEqual(rows, {
    auth_tables: 8,
    approval_credential_columns: 1,
  });
  console.log("site migration proof passed; replay was a no-op");
} finally {
  rmSync(root, { recursive: true, force: true });
}

function query(sql) {
  const output = execFileSync(
    wrangler,
    [
      "d1",
      "execute",
      "site-migration-proof",
      "--local",
      "--config",
      join(root, "wrangler.toml"),
      "--persist-to",
      state,
      "--json",
      "--command",
      sql,
    ],
    { encoding: "utf8" },
  );
  const payload = JSON.parse(output);
  assert.equal(payload[0].success, true);
  assert.notEqual(payload[0].meta.changed_db, true);
  return payload[0].results[0];
}

function baselineSql() {
  return `
CREATE TABLE admin_passkey_credentials (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL, counter INTEGER NOT NULL DEFAULT 0,
  transports TEXT NOT NULL DEFAULT '[]', device_type TEXT,
  backed_up INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL, last_used_at TEXT, revoked_at TEXT
);
CREATE TABLE admin_passkey_challenges (
  id TEXT PRIMARY KEY, purpose TEXT NOT NULL, challenge TEXT NOT NULL UNIQUE,
  credential_id TEXT, created_at TEXT NOT NULL, expires_at TEXT NOT NULL, used_at TEXT
);
CREATE TABLE admin_passkey_audit (
  id TEXT PRIMARY KEY, event_type TEXT NOT NULL, credential_id TEXT,
  summary TEXT NOT NULL, created_at TEXT NOT NULL
);
`;
}
