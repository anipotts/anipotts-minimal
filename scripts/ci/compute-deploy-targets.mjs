#!/usr/bin/env node

import { readFileSync } from "node:fs";

const TARGETS = [
  "www",
  "admin",
  "admin_solid",
  "ingest",
  "newsletter",
  "state",
  "weekly_email",
];

function isIgnoredForDeploy(file) {
  return (
    file.endsWith(".md") ||
    file.startsWith("docs/") ||
    file.startsWith(".github/ISSUE_TEMPLATE/") ||
    file === "LICENSE"
  );
}

export function computeDeployTargets(files) {
  const targets = Object.fromEntries(TARGETS.map((target) => [target, false]));

  for (const file of files) {
    if (!file || isIgnoredForDeploy(file)) continue;

    if (
      file.startsWith("apps/www/") ||
      file.startsWith("packages/lib/") ||
      file.startsWith("packages/content/src/public/") ||
      file === "packages/content/package.json" ||
      file === "packages/content/src/index.ts" ||
      file.startsWith("packages/styles/") ||
      file.startsWith("packages/types/")
    ) {
      targets.www = true;
    }

    if (
      file.startsWith("apps/admin/") ||
      file.startsWith("packages/content/")
    ) {
      targets.admin = true;
    }

    // apps/admin-solid is retained as a temporary rollback surface only.
    // It should not auto-deploy from agent PRs or path-filtered main pushes.
    // Use the explicit deploy workflow input if rollback deployment is needed.

    if (file.startsWith("workers/ingest/")) {
      targets.ingest = true;
    }

    if (file.startsWith("workers/newsletter/")) {
      targets.newsletter = true;
    }

    if (file.startsWith("workers/state/")) {
      targets.state = true;
    }

    if (file.startsWith("workers/weekly-email/")) {
      targets.weekly_email = true;
    }
  }

  return targets;
}

function readFiles(path) {
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function printGithubOutput(targets) {
  for (const target of TARGETS) {
    console.log(`${target}=${targets[target] ? "true" : "false"}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fileListPath = process.argv[2];
  if (!fileListPath) {
    console.error("usage: compute-deploy-targets.mjs <file-list>");
    process.exit(2);
  }

  printGithubOutput(computeDeployTargets(readFiles(fileListPath)));
}
