#!/usr/bin/env node

import { execFileSync } from "node:child_process";

export function activeVersion(status) {
  const active = status?.versions?.find(
    (version) => version.percentage === 100,
  );
  if (!active?.version_id) {
    throw new Error("a single active Worker version could not be identified");
  }
  return active.version_id;
}

function wrangler(args) {
  return execFileSync("pnpm", ["exec", "wrangler", ...args], {
    encoding: "utf8",
    env: process.env,
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [command, config, versionId] = process.argv.slice(2);
  if (command === "capture" && config) {
    const status = JSON.parse(
      wrangler(["deployments", "status", "--config", config, "--json"]),
    );
    console.log(`previous_version=${activeVersion(status)}`);
  } else if (command === "rollback" && config && versionId) {
    wrangler([
      "rollback",
      versionId,
      "--config",
      config,
      "--message",
      `automatic app rollback after smoke failure for ${process.env.GITHUB_SHA || "unknown"}`,
      "--yes",
    ]);
    console.log(`restored_version=${versionId}`);
  } else {
    console.error(
      "usage: worker-version.mjs capture <config> | rollback <config> <version-id>",
    );
    process.exit(2);
  }
}
