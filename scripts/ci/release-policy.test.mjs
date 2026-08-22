#!/usr/bin/env node

import assert from "node:assert/strict";
import { protectionPayload, REQUIRED_CHECKS } from "./branch-protection.mjs";
import {
  parseD1SchemaResult,
  schemaFingerprint,
} from "./d1-schema-fingerprint.mjs";
import {
  assertConditionResult,
  selectedConditions,
} from "./d1-migration-conditions.mjs";
import { classifySql, sha256 } from "./migration-policy.mjs";
import { classifyRelease } from "./release-policy.mjs";

const base = { sourceSha: "a".repeat(40), eventName: "pull_request" };

assert.equal(classifyRelease(["docs/release.md"], base).docs_only, true);
assert.equal(
  classifyRelease(["M\tapps/admin/src/pages/inbox.astro"], base).risk,
  "automatic",
);
assert.equal(classifyRelease(["M\t.nvmrc"], base).risk, "automatic");
const adminSolidRelease = classifyRelease(
  ["M\tapps/admin-solid/package.json"],
  base,
);
assert.equal(adminSolidRelease.risk, "approval");
assert.equal(adminSolidRelease.approval_required, true);
assert.equal(adminSolidRelease.deploy_targets.admin_solid, false);
assert.deepEqual(adminSolidRelease.reasons, [
  "protected surface: apps/admin-solid/package.json",
]);
assert.equal(
  classifyRelease(["A\tapps/admin/src/pages/new-route.astro"], base).risk,
  "approval",
);
assert.equal(
  classifyRelease(["M\tapps/admin/src/pages/auth/passkey.astro"], base)
    .approval_required,
  true,
);
assert.equal(
  classifyRelease(["M\tworkers/newsletter/src/index.ts"], base).risk,
  "approval",
);
assert.equal(classifyRelease(["mystery/file.bin"], base).risk, "unknown");
for (const protectedPath of [
  "config/release-train.json",
  "drizzle/migrations/manifest.json",
  "scripts/ci/release-policy.mjs",
]) {
  assert.equal(
    classifyRelease([`M\t${protectedPath}`], base).risk,
    "approval",
    `${protectedPath} must remain a protected release surface`,
  );
}

const safeSql =
  "CREATE TABLE IF NOT EXISTS release_canary (id TEXT PRIMARY KEY);";
const safeFile = "0043_release_canary.sql";
const safeManifest = {
  bootstrap: {
    status: "pending_explicit_approval",
    automatic_remote_apply: false,
    baseline_through: "0042_admin_inbox_attention_contract.sql",
  },
  historical: [],
  migrations: [
    {
      file: safeFile,
      checksum: `sha256:${sha256(safeSql)}`,
      risk: "automatic",
      consumers: ["admin", "www"],
      preconditions: [{ sql: "SELECT 1 AS ok", expected: { ok: 1 } }],
      postconditions: [{ sql: "SELECT 1 AS ok", expected: { ok: 1 } }],
      rollback: "drop only before consumer deployment",
      schema_fingerprint_before: `sha256:${"1".repeat(64)}`,
      schema_fingerprint_after: `sha256:${"2".repeat(64)}`,
    },
  ],
};
const safeMigration = classifyRelease([`A\tdrizzle/migrations/${safeFile}`], {
  ...base,
  manifest: safeManifest,
  files: [safeFile],
  readFile: () => safeSql,
});
assert.equal(safeMigration.migration_risk, "automatic");
assert.equal(safeMigration.remote_migration_allowed, false);
assert.equal(safeMigration.deploy_targets.admin, true);
assert.equal(safeMigration.deploy_targets.www, true);
assert.equal(safeMigration.database_schema_version, "0043");
assert.equal(safeMigration.migration_schema_before, `sha256:${"1".repeat(64)}`);
assert.equal(safeMigration.migration_schema_after, `sha256:${"2".repeat(64)}`);

assert.throws(
  () =>
    classifyRelease([`A\tdrizzle/migrations/${safeFile}`], {
      ...base,
      manifest: {
        ...safeManifest,
        migrations: [
          {
            ...safeManifest.migrations[0],
            checksum: `sha256:${"0".repeat(64)}`,
          },
        ],
      },
      files: [safeFile],
      readFile: () => safeSql,
    }),
  /checksum does not match/,
);

assert.throws(
  () =>
    classifyRelease([`A\tdrizzle/migrations/${safeFile}`], {
      ...base,
      manifest: {
        ...safeManifest,
        migrations: [
          {
            ...safeManifest.migrations[0],
            schema_fingerprint_after: "not-a-fingerprint",
          },
        ],
      },
      files: [safeFile],
      readFile: () => safeSql,
    }),
  /invalid schema_fingerprint_after/,
);

const pendingFingerprintManifest = {
  ...safeManifest,
  migrations: [
    {
      ...safeManifest.migrations[0],
      schema_fingerprint_before: "pending_bootstrap",
      schema_fingerprint_after: "pending_bootstrap",
    },
  ],
};
assert.doesNotThrow(() =>
  classifyRelease([`A\tdrizzle/migrations/${safeFile}`], {
    ...base,
    manifest: pendingFingerprintManifest,
    files: [safeFile],
    readFile: () => safeSql,
  }),
);
assert.throws(
  () =>
    classifyRelease([`A\tdrizzle/migrations/${safeFile}`], {
      ...base,
      manifest: {
        ...pendingFingerprintManifest,
        bootstrap: {
          ...pendingFingerprintManifest.bootstrap,
          status: "verified",
        },
      },
      files: [safeFile],
      readFile: () => safeSql,
    }),
  /must pin schema fingerprints after bootstrap verification/,
);

assert.equal(
  classifySql("CREATE TABLE IF NOT EXISTS canary (id TEXT PRIMARY KEY);"),
  "automatic",
);
assert.equal(
  classifySql("CREATE INDEX IF NOT EXISTS idx_canary ON canary(id);"),
  "automatic",
);
assert.equal(classifySql("DELETE FROM canary;"), "approval");
assert.equal(classifySql("UPDATE canary SET id = 'x';"), "approval");
assert.equal(classifySql("VACUUM;"), "unknown");

const protection = protectionPayload();
assert.equal(protection.required_status_checks.strict, true);
assert.deepEqual(protection.required_status_checks.contexts, REQUIRED_CHECKS);
assert.equal(protection.required_pull_request_reviews, null);
assert.equal(protection.required_conversation_resolution, true);
assert.equal(protection.enforce_admins, true);

assert.equal(
  selectedConditions(
    safeManifest,
    [`A\tdrizzle/migrations/${safeFile}`],
    "postconditions",
  ).length,
  1,
);
assert.doesNotThrow(() =>
  assertConditionResult({ file: safeFile, expected: { ok: 1 } }, [
    { success: true, results: [{ ok: 1 }], meta: { rows_written: 0 } },
  ]),
);

const schemaRows = [
  {
    type: "table",
    name: "canary",
    tbl_name: "canary",
    sql: "CREATE  TABLE canary ( id TEXT )",
  },
];
assert.equal(schemaFingerprint(schemaRows), schemaFingerprint([...schemaRows]));
assert.deepEqual(
  parseD1SchemaResult([
    { success: true, results: schemaRows, meta: { rows_written: 0 } },
  ]),
  schemaRows,
);
assert.throws(
  () =>
    parseD1SchemaResult([
      { success: true, results: schemaRows, meta: { rows_written: 1 } },
    ]),
  /unexpectedly wrote rows/,
);

console.log("release policy tests passed");
