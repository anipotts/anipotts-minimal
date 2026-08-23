#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { computeDeployTargets, DEPLOY_TARGETS } from "./release-policy.mjs";

export { computeDeployTargets } from "./release-policy.mjs";

function readFiles(path) {
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function printGithubOutput(targets) {
  for (const target of DEPLOY_TARGETS) {
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
