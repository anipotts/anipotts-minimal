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

assert.deepEqual(
  workflowFiles,
  ALLOWED_WORKFLOWS,
  "workflow inventory drifted from the approved CI/CD set",
);

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
