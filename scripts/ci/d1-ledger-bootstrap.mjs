#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { loadManifest, verifyManifest } from "./migration-policy.mjs";
import {
  parseD1SchemaResult,
  schemaFingerprint,
} from "./d1-schema-fingerprint.mjs";

export const DATA_HISTORY_MIGRATIONS = [
  "0008_seed_content_draft_operations.sql",
  "0009_seed_newsletter_page_content.sql",
  "0010_seed_home_page_content.sql",
  "0011_seed_source_content_review_operations.sql",
  "0012_admin_proof_events.sql",
  "0013_seed_homepage_proof_cards.sql",
  "0014_seed_homepage_making_slugs.sql",
  "0015_seed_homepage_writing_slugs.sql",
  "0016_seed_homepage_rich_summary.sql",
  "0017_seed_homepage_mentions.sql",
  "0018_update_homepage_operation_source_refs.sql",
  "0019_seed_homepage_intro_subheading.sql",
  "0020_refresh_admin_proof_events.sql",
  "0021_seed_homepage_about_section.sql",
  "0022_seed_writing_index_page_content.sql",
  "0023_seed_making_index_page_content.sql",
  "0024_seed_projects_index_page_content.sql",
  "0025_seed_newsletter_archive_page_content.sql",
  "0026_seed_newsletter_archive_cta_content.sql",
  "0027_seed_orchestrating_page_content.sql",
  "0028_seed_listing_content_review_operations.sql",
  "0029_update_public_content_contract_source_refs.sql",
  "0030_expand_orchestrating_page_content.sql",
  "0031_seed_detail_page_content.sql",
  "0032_seed_remaining_detail_page_content.sql",
  "0033_refresh_draft_operation_save_metadata.sql",
  "0034_seed_content_draft_save_proof.sql",
  "0035_seed_making_bucket_copy.sql",
  "0040_reorder_homepage_rich_summary.sql",
];

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

export function buildEvidenceQuery(files = DATA_HISTORY_MIGRATIONS) {
  const values = files.map((file) => `(${sqlString(file)})`).join(",\n    ");
  return `WITH expected(file) AS (
  VALUES
    ${values}
), corpus(body) AS (
  SELECT COALESCE(content, '') || ' ' || COALESCE(version_history, '') FROM page_content
  UNION ALL
  SELECT COALESCE(source_ref, '') || ' ' || COALESCE(metadata, '') FROM content_draft_operations
  UNION ALL
  SELECT COALESCE(source_ref, '') || ' ' || COALESCE(metadata, '') FROM admin_proof_events
), semantic(file, preserved) AS (
  SELECT '0018_update_homepage_operation_source_refs.sql',
    CASE WHEN EXISTS (
      SELECT 1 FROM content_draft_operations
      WHERE operation_id = 'content-draft-homepage-summary-2026-06-28'
        AND source_ref LIKE '%@anipotts/content/public%'
        AND json_extract(metadata, '$.source_ref_refreshed_by') = 'drizzle/migrations/0029_update_public_content_contract_source_refs.sql'
    ) THEN 1 ELSE 0 END
  UNION ALL
  SELECT '0033_refresh_draft_operation_save_metadata.sql',
    CASE WHEN EXISTS (
      SELECT 1 FROM content_draft_operations
      WHERE kind = 'content_draft'
        AND authority_state LIKE 'passkey_draft_save_no_publish'
        AND json_extract(metadata, '$.draft_save_path') = '/api/admin/content/draft-operation'
        AND json_extract(metadata, '$.write_scope') = 'draft_operation_only'
    ) THEN 1 ELSE 0 END
)
SELECT file,
  CASE
    WHEN EXISTS (SELECT 1 FROM corpus WHERE instr(body, file) > 0) THEN 1
    ELSE COALESCE((SELECT preserved FROM semantic WHERE semantic.file = expected.file), 0)
  END AS preserved
FROM expected
ORDER BY file`;
}

export function parseReadOnlyResult(payload) {
  const batches = Array.isArray(payload) ? payload : [payload];
  for (const batch of batches) {
    if (batch.success !== true) throw new Error("D1 read did not succeed");
    if (
      batch.meta?.changed_db === true ||
      (batch.meta?.changes ?? batch.meta?.rows_written ?? 0) !== 0
    ) {
      throw new Error("D1 bootstrap preflight unexpectedly wrote rows");
    }
  }
  return batches.flatMap((batch) => batch.results || []);
}

export function verifyBootstrapInputs({
  schemaPayload,
  evidencePayload,
  manifest = verifyManifest(),
}) {
  assert.notEqual(manifest.bootstrap.status, "verified");
  const schemaRows = parseD1SchemaResult(schemaPayload);
  const observedFingerprint = schemaFingerprint(schemaRows);
  assert.equal(
    observedFingerprint,
    manifest.bootstrap.schema_fingerprint,
    "production schema fingerprint drifted",
  );
  assert.equal(
    schemaRows.some(
      (row) => row.type === "table" && row.name === "d1_migrations",
    ),
    false,
    "production already has a Wrangler migration ledger",
  );

  const evidenceRows = parseReadOnlyResult(evidencePayload);
  const preserved = new Map(
    evidenceRows.map((row) => [row.file, Number(row.preserved)]),
  );
  for (const file of DATA_HISTORY_MIGRATIONS) {
    assert.equal(preserved.get(file), 1, `${file} lacks durable data proof`);
  }

  return {
    observedFingerprint,
    historicalCount: manifest.historical.length,
    dataEvidenceCount: DATA_HISTORY_MIGRATIONS.length,
  };
}

export function buildBootstrapSql(manifest = loadManifest()) {
  const inserts = manifest.historical
    .map(
      ([name]) =>
        `INSERT INTO d1_migrations (name) VALUES (${sqlString(name)});`,
    )
    .join("\n");
  return `-- D1 remote file ingestion is transactional. Do not add SQL BEGIN or COMMIT.
CREATE TABLE d1_migrations(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
${inserts}
`;
}

export function bootstrapSqlHash(sql) {
  return `sha256:${createHash("sha256").update(sql).digest("hex")}`;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [command, ...args] = process.argv.slice(2);
  if (command === "evidence-query") {
    console.log(buildEvidenceQuery());
  } else if (command === "prepare") {
    const [schemaPath, evidencePath, outputPath] = args;
    if (!schemaPath || !evidencePath || !outputPath) {
      throw new Error(
        "usage: d1-ledger-bootstrap.mjs prepare <schema-json> <evidence-json> <output-sql>",
      );
    }
    const proof = verifyBootstrapInputs({
      schemaPayload: readJson(schemaPath),
      evidencePayload: readJson(evidencePath),
    });
    const sql = buildBootstrapSql();
    writeFileSync(outputPath, sql, { encoding: "utf8", mode: 0o600 });
    console.log(`schema_fingerprint=${proof.observedFingerprint}`);
    console.log(`historical_migrations=${proof.historicalCount}`);
    console.log(`data_evidence=${proof.dataEvidenceCount}`);
    console.log(`bootstrap_sql=${bootstrapSqlHash(sql)}`);
    console.log(`output=${outputPath}`);
    console.log("rows_written=0");
  } else {
    throw new Error(
      "usage: d1-ledger-bootstrap.mjs <evidence-query|prepare> ...",
    );
  }
}
