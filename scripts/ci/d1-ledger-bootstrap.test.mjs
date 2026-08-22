#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  DATA_HISTORY_MIGRATIONS,
  bootstrapSqlHash,
  buildBootstrapSql,
  buildEvidenceQuery,
  parseReadOnlyResult,
} from "./d1-ledger-bootstrap.mjs";

const query = buildEvidenceQuery();
for (const file of DATA_HISTORY_MIGRATIONS)
  assert.match(query, new RegExp(file));
assert.match(query, /FROM page_content/);
assert.match(query, /FROM content_draft_operations/);
assert.match(query, /FROM admin_proof_events/);
assert.match(query, /0018_update_homepage_operation_source_refs\.sql/);
assert.match(query, /0033_refresh_draft_operation_save_metadata\.sql/);

const manifest = {
  historical: [
    ["0001_one.sql", "unused"],
    ["0002_two's.sql", "unused"],
  ],
};
const sql = buildBootstrapSql(manifest);
assert.match(sql, /^BEGIN IMMEDIATE;/);
assert.match(sql, /CREATE TABLE d1_migrations/);
assert.match(sql, /VALUES \('0001_one\.sql'\)/);
assert.match(sql, /VALUES \('0002_two''s\.sql'\)/);
assert.match(sql, /COMMIT;\n$/);
assert.match(bootstrapSqlHash(sql), /^sha256:[0-9a-f]{64}$/);

assert.deepEqual(
  parseReadOnlyResult([
    {
      success: true,
      results: [{ file: "0001_one.sql", preserved: 1 }],
      meta: { changed_db: false, changes: 0, rows_written: 0 },
    },
  ]),
  [{ file: "0001_one.sql", preserved: 1 }],
);
assert.throws(
  () =>
    parseReadOnlyResult([
      {
        success: true,
        results: [],
        meta: { changed_db: true, changes: 1, rows_written: 1 },
      },
    ]),
  /unexpectedly wrote rows/,
);

console.log("D1 ledger bootstrap tests passed");
