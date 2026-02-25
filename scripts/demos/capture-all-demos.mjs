#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const scenariosDir = path.join(process.cwd(), "scripts", "demos", "scenarios");
const scenarioFiles = fs
  .readdirSync(scenariosDir)
  .filter((file) => file.endsWith(".json"));

if (scenarioFiles.length === 0) {
  console.log("No demo scenarios found.");
  process.exit(0);
}

for (const scenarioFile of scenarioFiles) {
  const slug = scenarioFile.replace(/\.json$/, "");
  console.log(`\n--- Capturing demo: ${slug} ---`);

  const result = spawnSync(
    "node",
    [path.join("scripts", "demos", "capture-project-demo.mjs"), slug],
    { stdio: "inherit" },
  );

  if (result.status !== 0) {
    console.error(`Demo capture failed for ${slug}`);
    process.exit(result.status ?? 1);
  }
}

console.log("\nAll demos generated.");
