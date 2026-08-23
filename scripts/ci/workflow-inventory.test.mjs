#!/usr/bin/env node

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const WORKFLOW_DIR = ".github/workflows";
const ALLOWED_WORKFLOWS = [
  "agent-automerge.yml",
  "ci.yml",
  "deploy.yml",
  "security-review.yml",
  "smoke.yml",
];

const BANNED_PATTERNS = [
  /ANTHROPIC_API_KEY/i,
  /CLAUDE_API_KEY/i,
  /anthropic-ai\/claude/i,
  /claude-code-action/i,
  /api\.anthropic\.com/i,
];

const workflowFiles = readdirSync(WORKFLOW_DIR)
  .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
  .sort();

const autoMergeWorkflow = readFileSync(
  join(WORKFLOW_DIR, "agent-automerge.yml"),
  "utf8",
);
const deployWorkflow = readFileSync(join(WORKFLOW_DIR, "deploy.yml"), "utf8");
const ciWorkflow = readFileSync(join(WORKFLOW_DIR, "ci.yml"), "utf8");
const securityWorkflow = readFileSync(
  join(WORKFLOW_DIR, "security-review.yml"),
  "utf8",
);
const smokeWorkflow = readFileSync(join(WORKFLOW_DIR, "smoke.yml"), "utf8");

assert.deepEqual(
  workflowFiles,
  ALLOWED_WORKFLOWS,
  "workflow inventory drifted from the approved CI/CD set",
);

assert.ok(
  deployWorkflow.includes("push:\n    branches: [main]"),
  "deploy workflow must promote path-filtered changes from merged main",
);
assert.equal(
  deployWorkflow.includes('- "**.md"'),
  false,
  "deploy workflow must not suppress canonical public Markdown",
);
assert.equal(
  autoMergeWorkflow.includes("gh workflow run deploy.yml"),
  false,
  "automerge must not dispatch a duplicate deploy after the main push",
);
for (const checkName of [
  "Build, lint, typecheck, test",
  "Migration Preflight",
]) {
  assert.ok(
    ciWorkflow.includes(`name: ${checkName}`),
    `ci.yml must report required check ${checkName}`,
  );
}
for (const workflow of [ciWorkflow, deployWorkflow]) {
  assert.ok(
    workflow.includes("uses: oven-sh/setup-bun@v2") &&
      workflow.includes('bun-version: "1.3.4"'),
    "full validation workflows must install the pinned Bun runtime",
  );
}
assert.ok(
  securityWorkflow.includes("name: Security Review"),
  "security-review.yml must report the required security check",
);
assert.equal(
  /pull_request:\n\s+paths:/.test(securityWorkflow),
  false,
  "required security review must run for every pull request",
);
assert.ok(
  autoMergeWorkflow.includes("name: Agent Merge Readiness"),
  "the retained workflow must describe merge readiness without merging",
);
assert.ok(
  autoMergeWorkflow.includes("contents: read") &&
    autoMergeWorkflow.includes("pull-requests: read"),
  "merge readiness must use read-only repository permissions",
);
for (const guard of [
  "!github.event.pull_request.draft",
  "github.event.pull_request.base.ref == 'main'",
  "github.event.pull_request.head.repo.full_name == github.repository",
]) {
  assert.ok(
    autoMergeWorkflow.includes(guard),
    `merge readiness is missing ${guard}`,
  );
}
assert.equal(
  /gh\s+pr\s+merge|gh\s+pr\s+edit|gh\s+label\s+create|contents:\s*write|pull-requests:\s*write|issues:\s*write/.test(
    autoMergeWorkflow,
  ),
  false,
  "merge readiness must not mutate pull requests, labels, or shared history",
);
for (const forbiddenCeremony of [
  "/approve-release",
  "release-approved",
  "issue_comment:",
  "pull_request_review:",
  "Promotion Policy",
]) {
  assert.equal(
    `${autoMergeWorkflow}\n${ciWorkflow}`.includes(forbiddenCeremony),
    false,
    `workflow approval ceremony must not include ${forbiddenCeremony}`,
  );
}
assert.ok(
  deployWorkflow.includes("group: production-release"),
  "production releases must share one serialized concurrency group",
);
assert.ok(
  deployWorkflow.includes("cancel-in-progress: false"),
  "a newer release must not cancel an in-flight release",
);
assert.ok(
  deployWorkflow.includes("node scripts/ci/release-policy.mjs"),
  "deployment must use the shared release classifier",
);
assert.ok(
  deployWorkflow.includes("pnpm validate"),
  "deployment must revalidate the exact main SHA before mutation",
);
assert.ok(
  deployWorkflow.includes(
    'admin_enabled=${policy.authenticated_admin_smoke === "enabled"}',
  ) && deployWorkflow.includes("needs.release.outputs.admin_enabled == 'true'"),
  "Admin deployment must retain its independent authenticated smoke gate",
);
for (const manualGuard of [
  'test "${{ github.ref }}" = "refs/heads/main"',
  'test "${{ github.actor }}" = "anipotts"',
  'test "${{ inputs.source_sha }}" = "${{ github.sha }}"',
]) {
  assert.ok(
    deployWorkflow.includes(manualGuard),
    `manual deployment is missing exact authority guard ${manualGuard}`,
  );
}
assert.ok(
  deployWorkflow.includes("d1 time-travel info"),
  "migration releases must capture a Time Travel bookmark",
);
assert.equal(
  /d1\s+time-travel\s+restore/.test(deployWorkflow),
  false,
  "migration failures must never restore D1 automatically",
);
assert.ok(
  deployWorkflow.includes("needs.release.outputs.d1_changed != 'true'"),
  "automatic Worker rollback must be limited to app-only releases",
);
for (const workflow of [deployWorkflow, smokeWorkflow]) {
  assert.ok(
    workflow.includes("scripts/ci/release-smoke.mjs"),
    "deploy and manual smoke must share one smoke implementation",
  );
}

for (const file of workflowFiles) {
  const body = readFileSync(join(WORKFLOW_DIR, file), "utf8");
  for (const pattern of BANNED_PATTERNS) {
    assert.equal(
      pattern.test(body),
      false,
      `${file} includes disabled external LLM review hook ${pattern}`,
    );
  }
}
