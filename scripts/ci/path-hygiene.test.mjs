#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";

const ALLOW_PREFIXES = ["docs/archive/"];
const RETIRED_ACCOUNT_PATH = "/Users/" + "rudy";
const FORBIDDEN_ACTIVE_LITERALS = [
  {
    value: RETIRED_ACCOUNT_PATH,
    message:
      "active repo files must not point at the retired local account path",
  },
];

const files = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);

for (const file of files) {
  if (ALLOW_PREFIXES.some((prefix) => file.startsWith(prefix))) {
    continue;
  }
  if (statSync(file).size > 2 * 1024 * 1024) continue;

  const source = readFileSync(file, "utf8");
  for (const literal of FORBIDDEN_ACTIVE_LITERALS) {
    assert.equal(
      source.includes(literal.value),
      false,
      `${file}: ${literal.message}`,
    );
  }
}
