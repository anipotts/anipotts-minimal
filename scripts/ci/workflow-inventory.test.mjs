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
  autoMergeWorkflow.includes("gh workflow run deploy.yml"),
  false,
  "automerge must not dispatch a duplicate deploy after the main push",
);
for (const checkName of ["Build, lint, typecheck, test", "Security Review"]) {
  assert.ok(
    autoMergeWorkflow.includes(checkName),
    `automerge must wait for ${checkName}`,
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
