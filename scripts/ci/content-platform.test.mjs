#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  contentOperationTables,
  contentOperationTemplates,
} from "../../packages/content/dist/admin/operations.js";

const EXPECTED_OPERATION_IDS = [
  "content-draft-homepage-summary-2026-06-28",
  "content-draft-making-index-copy-2026-06-29",
  "content-draft-newsletter-archive-copy-2026-06-29",
  "content-draft-newsletter-copy-2026-06-28",
  "content-draft-orchestrating-hero-copy-2026-06-29",
  "content-draft-project-card-fields-2026-06-28",
  "content-draft-projects-index-copy-2026-06-29",
  "content-draft-writing-index-copy-2026-06-29",
  "content-draft-writing-newsletter-backfill-2026-06-28",
];

const UNSAFE_ALLOWED_ACTIONS = new Set([
  "save",
  "publish",
  "send",
  "schedule",
  "deploy",
  "rewrite_source",
  "rewrite_markdown",
  "sync_provider",
  "sync_external",
]);

assert.deepEqual(
  contentOperationTemplates.map((operation) => operation.operation_id).sort(),
  EXPECTED_OPERATION_IDS.toSorted(),
  "static content operation fallback must match seeded D1 inert operations",
);

for (const operation of contentOperationTemplates) {
  assert.equal(operation.kind, "content_draft", operation.operation_id);
  assert.equal(operation.status, "previewed", operation.operation_id);
  assert.equal(operation.redaction, "public_copy_only", operation.operation_id);
  assert.ok(
    operation.preview_targets.includes("/content/preview"),
    `${operation.operation_id} must render through the inert preview lane`,
  );
  assert.ok(
    operation.forbidden_actions.includes("save"),
    `${operation.operation_id} must block save`,
  );
  assert.ok(
    operation.forbidden_actions.includes("publish"),
    `${operation.operation_id} must block publish`,
  );

  const unsafeAllowed = operation.allowed_actions.filter((action) =>
    UNSAFE_ALLOWED_ACTIONS.has(action),
  );
  assert.deepEqual(
    unsafeAllowed,
    [],
    `${operation.operation_id} must not allow write, send, deploy, or sync actions`,
  );
}

assert.deepEqual(
  contentOperationTables.map((table) => [table.table, table.write_state]),
  [
    ["content_records", "schema_only"],
    ["content_draft_operations", "inert_preview"],
    ["content_publish_events", "future_publish"],
  ],
  "content operation tables must preserve read-only write posture",
);
