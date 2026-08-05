#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { loadManifest } from "./migration-policy.mjs";

export function canonicalSchema(rows) {
  return rows
    .map((row) => ({
      type: row.type,
      name: row.name,
      tbl_name: row.tbl_name,
      sql: String(row.sql || "")
        .replace(/\s+/g, " ")
        .trim(),
    }))
    .sort((a, b) =>
      `${a.type}\0${a.name}`.localeCompare(`${b.type}\0${b.name}`),
    );
}

export function schemaFingerprint(rows) {
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(canonicalSchema(rows)))
    .digest("hex")}`;
}

export function parseD1SchemaResult(payload) {
  const batches = Array.isArray(payload) ? payload : [payload];
  const rows = batches.flatMap((batch) => batch.results || []);
  for (const batch of batches) {
    if (batch.success !== true)
      throw new Error("D1 schema query did not succeed");
    if (
      batch.meta?.changed_db === true ||
      (batch.meta?.changes ?? batch.meta?.rows_written ?? 0) !== 0
    ) {
      throw new Error("D1 schema fingerprint query unexpectedly wrote rows");
    }
  }
  return rows;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const resultPath = process.argv[2];
  if (!resultPath) {
    console.error("usage: d1-schema-fingerprint.mjs <wrangler-json-result>");
    process.exit(2);
  }
  const rows = parseD1SchemaResult(
    JSON.parse(readFileSync(resultPath, "utf8")),
  );
  const observed = schemaFingerprint(rows);
  const expected =
    process.argv[3] || loadManifest().bootstrap.schema_fingerprint;
  if (observed !== expected) {
    console.error(
      `production schema drift: expected ${expected}, observed ${observed}`,
    );
    process.exit(1);
  }
  console.log(`schema_fingerprint=${observed}`);
  console.log("rows_written=0");
}
