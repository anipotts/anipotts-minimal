#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { classifyRelease, githubOutputs } from "./release-policy.mjs";

const SHA_PATTERN = /^[0-9a-f]{40}$/u;

function parseLines(path) {
  return readFileSync(path, "utf8")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseHealth(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return {};
  }
}

export function planDeployment(changeLines, options = {}) {
  const release = classifyRelease(changeLines, options);
  const deployedWwwSha = options.publicHealth?.release_sha;
  let wwwDisposition = "event_diff";

  if (deployedWwwSha === options.sourceSha) {
    wwwDisposition = "current";
  } else if (!SHA_PATTERN.test(deployedWwwSha || "")) {
    release.deploy_targets.www = true;
    wwwDisposition = "missing_live_sha";
  } else {
    try {
      const cumulativeChanges = options.diffNameStatus(
        deployedWwwSha,
        options.sourceSha,
      );
      const cumulative = classifyRelease(cumulativeChanges, options);
      release.deploy_targets.www ||= cumulative.deploy_targets.www;
      wwwDisposition = release.deploy_targets.www
        ? "outdated"
        : "no_public_diff";
    } catch {
      release.deploy_targets.www = true;
      wwwDisposition = "unverifiable_live_sha";
    }
  }

  const deploymentRequired = Object.values(release.deploy_targets).some(
    Boolean,
  );
  return {
    release,
    deployment_required: deploymentRequired,
    deployment_disposition: deploymentRequired
      ? "deployment_required"
      : "no_deployment_required",
    deployed_www_sha: deployedWwwSha || "unknown",
    www_disposition: wwwDisposition,
  };
}

export function deploymentOutputs(plan) {
  return [
    githubOutputs(plan.release),
    `deployment_required=${plan.deployment_required}`,
    `deployment_disposition=${plan.deployment_disposition}`,
    `deployed_www_sha=${plan.deployed_www_sha}`,
    `www_disposition=${plan.www_disposition}`,
  ].join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [changePath, healthPath, sourceSha] = process.argv.slice(2);
  if (!changePath || !healthPath || !sourceSha) {
    console.error(
      "usage: deployment-plan.mjs <name-status-file> <www-health-json> <source-sha>",
    );
    process.exit(2);
  }
  const plan = planDeployment(parseLines(changePath), {
    sourceSha,
    eventName: process.env.GITHUB_EVENT_NAME || "release",
    publicHealth: parseHealth(healthPath),
    diffNameStatus(from, to) {
      return execFileSync("git", ["diff", "--name-status", from, to], {
        encoding: "utf8",
      })
        .split(/\r?\n/u)
        .filter(Boolean);
    },
  });
  console.log(deploymentOutputs(plan));
  console.error(JSON.stringify(plan, null, 2));
  if (plan.release.risk === "unknown") process.exit(1);
}
