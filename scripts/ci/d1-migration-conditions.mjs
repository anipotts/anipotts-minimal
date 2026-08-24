#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { loadManifest } from "./migration-policy.mjs";

export function selectedConditions(manifest, changedLines, phase) {
  if (changedLines === "all-pending") {
    return manifest.migrations.flatMap((record) =>
      record[phase].map((condition) => ({ file: record.file, ...condition })),
    );
  }
  const changed = new Set(
    changedLines
      .filter(Boolean)
      .map((line) => basename(line.split("\t").at(-1)))
      .filter((file) => /^\d{4}_.+\.sql$/.test(file)),
  );
  return manifest.migrations
    .filter((record) => changed.has(record.file))
    .flatMap((record) =>
      record[phase].map((condition) => ({ file: record.file, ...condition })),
    );
}

export function assertConditionResult(condition, payload) {
  const batches = Array.isArray(payload) ? payload : [payload];
  for (const batch of batches) {
    if (batch.success !== true)
      throw new Error(`${condition.file} condition failed`);
    if (
      batch.meta?.changed_db === true ||
      (batch.meta?.changes ?? batch.meta?.rows_written ?? 0) !== 0
    ) {
      throw new Error(`${condition.file} condition unexpectedly wrote rows`);
    }
  }
  const row = batches.flatMap((batch) => batch.results || [])[0];
  assert.ok(row, `${condition.file} condition returned no row`);
  for (const [key, expected] of Object.entries(condition.expected)) {
    assert.deepEqual(row[key], expected, `${condition.file} expected ${key}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [phase, selection] = process.argv.slice(2);
  if (!["preconditions", "postconditions"].includes(phase) || !selection) {
    console.error(
      "usage: d1-migration-conditions.mjs <preconditions|postconditions> <name-status-file|all-pending>",
    );
    process.exit(2);
  }
  const manifest = loadManifest();
  const conditions = selectedConditions(
    manifest,
    selection === "all-pending"
      ? "all-pending"
      : readFileSync(selection, "utf8").split(/\r?\n/),
    phase,
  );
  for (const condition of conditions) {
    const output = execFileSync(
      "pnpm",
      [
        "exec",
        "wrangler",
        "d1",
        "execute",
        manifest.owner.database_name,
        "--remote",
        "--config",
        manifest.owner.wrangler_config,
        "--json",
        "--command",
        condition.sql,
      ],
      { encoding: "utf8", env: process.env },
    );
    assertConditionResult(condition, JSON.parse(output));
    console.log(`${condition.file} ${phase} passed with rows_written=0`);
  }
}
