#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  isSensitivePath,
  requiresSecurityReview,
  reviewFiles,
} from "./security-review.mjs";

function expectSensitive(file, expected) {
  assert.equal(isSensitivePath(file), expected, file);
}

expectSensitive(".github/workflows/deploy.yml", true);
expectSensitive("apps/admin/src/middleware.ts", true);
expectSensitive(
  "apps/admin/src/pages/api/admin/content/draft-operation.ts",
  true,
);
expectSensitive("apps/admin/src/pages/api/admin/passkey/status.ts", true);
expectSensitive("apps/admin/src/pages/auth/passkey.astro", true);
expectSensitive("workers/state/src/index.ts", true);
expectSensitive("packages/content/src/public/defaults.ts", true);
expectSensitive("packages/lib/src/cms/homepage.ts", true);
expectSensitive("drizzle/migrations/0016_seed_homepage_rich_summary.sql", true);
expectSensitive("scripts/ci/security-review.mjs", true);
expectSensitive("package.json", true);
expectSensitive("docs/platform-architecture.md", false);
expectSensitive("apps/www/src/pages/index.astro", false);
expectSensitive("apps/admin/README.md", false);

assert.equal(
  requiresSecurityReview([
    "docs/platform-architecture.md",
    "apps/admin/src/middleware.ts",
  ]),
  true,
);

assert.equal(requiresSecurityReview(["docs/platform-architecture.md"]), false);

const publicSqlMetadataAssignment =
  "  authority_" + "state = 'passkey_draft_save_no_publish';\n";

const fakeFiles = new Map([
  [
    ".github/workflows/review.yml",
    "env:\n  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}\n",
  ],
  [
    "scripts/example.ts",
    `const token = "${"sk-proj-" + "abcdefghijklmnopqrstuvwxyz"}";\n`,
  ],
  [
    "drizzle/migrations/0099_drop.sql",
    "-- rollback comment can say DELETE FROM safely\nDROP TABLE sessions;\n",
  ],
  [
    ".github/workflows/deploy.yml",
    "env:\n  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}\n",
  ],
  [
    "packages/content/src/admin/operations.ts",
    `const operation = {
  authority_state: "source_truth_resolved_preview_only",
  current_value_ref: "published_page_content:newsletter_archive",
};
`,
  ],
  ["drizzle/migrations/0100_public_metadata.sql", publicSqlMetadataAssignment],
]);

function readFake(file) {
  return fakeFiles.get(file) ?? "";
}

const findings = reviewFiles(
  [
    ".github/workflows/review.yml",
    "scripts/example.ts",
    "drizzle/migrations/0099_drop.sql",
    ".github/workflows/deploy.yml",
    "packages/content/src/admin/operations.ts",
    "drizzle/migrations/0100_public_metadata.sql",
    "docs/archive/old.md",
  ],
  readFake,
);

assert.deepEqual(findings.map((finding) => finding.rule).sort(), [
  "anthropic-api-key",
  "drop-table",
  "inline-secret-assignment",
  "openai-or-similar-key",
]);

assert.deepEqual(reviewFiles([".github/workflows/deploy.yml"], readFake), []);
