#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  countProofEntries,
  contentInventorySource,
  needsAniBuckets,
  needsAniItemsFromJson,
  proofSource,
  recordsFromSourceModules,
  readProofEntries,
  summarizeSourceContentRecords,
} from "../../packages/content/dist/admin/index.js";
import {
  contentOperationTables,
  contentOperationTemplates,
} from "../../packages/content/dist/admin/operations.js";
import { contentInventorySource as rootContentInventorySource } from "../../packages/content/dist/index.js";

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

const needsFixture = needsAniItemsFromJson([
  {
    agent_next: "continue after approval",
    ani_action: "approve test action",
    bucket: "unblockable_now",
    expires_stale: "2026-07-01",
    id: "need-test-action",
    owner: "chief/site",
    primary_action: "approve test action",
    proof: "",
    requires_ani: true,
    source: "coord/NEEDS-ANI.md",
    status: "open",
    type: "approve",
    why: "valid row should render",
  },
  {
    id: "invalid-row",
    type: "send",
    bucket: "unblockable_now",
  },
]);

assert.deepEqual(
  needsAniBuckets.map((group) => group.bucket),
  ["unblockable_now", "waiting_on_account_or_device", "review_delete_packets"],
  "needs-ani buckets must stay stable for the admin route",
);
assert.equal(needsFixture.length, 1);
assert.equal(needsFixture[0]?.id, "need-test-action");

const sourceRecords = [
  ...recordsFromSourceModules("projects", {
    "/repo/apps/www/src/content/projects/hidden-lab.md": `---
title: Hidden Lab
summary: Internal project page
visible: false
sort_order: 2
---
`,
  }),
  ...recordsFromSourceModules("writing", {
    "/repo/apps/www/src/content/writing/control-plane.md": `---
title: Control Plane
summary: Agents need authority, proof, and state.
status: published
tags: [agents, admin]
---
## opening

The admin app should render source-backed writing as a preview before any publish or send path exists.
`,
  }),
];

assert.deepEqual(
  summarizeSourceContentRecords(sourceRecords),
  {
    projects: 1,
    writing: 1,
    published_writing: 1,
    visible_projects: 0,
  },
  "source content parser must preserve admin summary counts",
);

const hiddenProject = sourceRecords.find(
  (record) => record.id === "projects.hidden-lab",
);
assert.ok(hiddenProject, "hidden project source record must be parsed");
assert.equal(hiddenProject.status, "hidden");
assert.equal(
  hiddenProject.source_ref,
  "apps/www/src/content/projects/hidden-lab.md",
);
assert.equal(hiddenProject.body_state, "frontmatter only");
assert.equal(hiddenProject.body_preview, "no markdown body yet");

const writingRecord = sourceRecords.find(
  (record) => record.id === "writing.control-plane",
);
assert.ok(writingRecord, "writing source record must be parsed");
assert.equal(writingRecord.status, "published");
assert.equal(writingRecord.body_section_count, 1);
assert.ok(
  writingRecord.fields.some(
    (field) => field.path === "tags" && field.value === "agents, admin",
  ),
  "source content parser must preserve list frontmatter fields",
);
assert.ok(
  writingRecord.body_preview.includes("admin app should render source-backed"),
  "source content parser must expose a markdown body preview",
);

assert.equal(
  contentInventorySource.mode,
  "read_only_static_plus_d1_page_content",
);
assert.equal(
  rootContentInventorySource.mode,
  "read_only_static_plus_d1_page_content",
);
assert.equal(
  execFileSync(
    process.execPath,
    [
      "-e",
      "import('@anipotts/content/admin').then((mod) => process.stdout.write(mod.contentInventorySource.mode))",
    ],
    { cwd: "apps/admin", encoding: "utf8" },
  ),
  "read_only_static_plus_d1_page_content",
  "apps/admin must be able to import @anipotts/content/admin from the built package export",
);

assert.equal(proofSource.mode, "read_only_d1_plus_runtime_metadata");
assert.equal(proofSource.live_writes, "disabled");

const proofEntriesWithoutDb = await readProofEntries(undefined);
assert.deepEqual(
  countProofEntries(proofEntriesWithoutDb),
  {
    total: 6,
    verified: 4,
    blocked: 1,
    pending: 1,
  },
  "proof exports must preserve read-only fallback status without an app D1 binding",
);
assert.ok(
  proofEntriesWithoutDb.some(
    (entry) =>
      entry.id === "proof.admin.passkey-enrollment" &&
      entry.status === "blocked" &&
      entry.next_safe_action.includes("DB binding"),
  ),
  "proof fallback must keep Access removal blocked when passkey proof is unavailable",
);

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
