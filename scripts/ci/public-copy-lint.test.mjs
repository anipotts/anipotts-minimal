#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { analyzePublicCopy } from "../../packages/content/dist/public/index.js";

const direct = analyzePublicCopy("this is not just a dashboard", {
  surfaceId: "test",
});
assert.equal(
  direct.some((finding) => finding.rule === "litotes"),
  true,
);
assert.equal(
  direct.every((finding) => finding.severity === "blocker"),
  true,
);
assert.equal(
  analyzePublicCopy("less polish and more proof", {
    surfaceId: "test",
  }).some((finding) => finding.rule === "reversal_frame"),
  true,
);

const historical = analyzePublicCopy("it is not x but y", {
  surfaceId: "test",
  context: "historical",
});
assert.equal(historical.length > 0, true);
assert.equal(
  historical.every((finding) => finding.severity === "review"),
  true,
);

for (const context of ["quotation", "safety", "technical"]) {
  assert.deepEqual(
    analyzePublicCopy("do not publish this", { surfaceId: "test", context }),
    [],
  );
}

const lint = spawnSync(process.execPath, ["scripts/ci/public-copy-lint.mjs"], {
  encoding: "utf8",
});
assert.equal(lint.status, 0, lint.stderr);
assert.equal(lint.stderr, "");
