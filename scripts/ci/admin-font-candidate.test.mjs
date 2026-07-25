#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "apps/admin/src/assets/ap-structural-candidate";
const PACKET = join(ROOT, "v0.1.0-candidate.1");
const MANIFEST_HASH =
  "5d4d300ea05478f717fdd3eb6a52bb8e58281920d8994c1c4bb758d59070db75";
const SOURCE_COMMIT = "3fce36bee9af1ace23ea1ab70c45d46b9a117975";

const manifestBytes = readFileSync(join(PACKET, "MANIFEST.json"));
assert.equal(sha256(manifestBytes), MANIFEST_HASH);

const manifest = JSON.parse(manifestBytes.toString("utf8"));
assert.equal(manifest.status, "candidate");
assert.equal(manifest.intendedUse, "localhost preview only");
assert.equal(manifest.sourceCommit, SOURCE_COMMIT);
assert.equal(manifest.promotion.currentProductionDisplayFont, "Urbanist Black");
assert.equal(manifest.files.length, 22);

for (const file of manifest.files) {
  assert.equal(
    sha256(readFileSync(join(PACKET, file.path))),
    file.sha256,
    `${file.path} must match the immutable Brand packet`,
  );
}

const css = readFileSync(join(PACKET, manifest.css.file), "utf8");
assert.ok(css.includes('font-family: "AP Structural", "Urbanist", sans-serif'));
assert.ok(css.includes("font-synthesis: none"));

const layout = readFileSync("apps/admin/src/layouts/AdminLayout.astro", "utf8");
assert.ok(layout.includes("if (import.meta.env.DEV)"));
assert.ok(layout.includes('data-font-candidate="ap-structural"'));
assert.ok(layout.includes("v0.1.0-candidate.1/css/ap-structural.css?raw"));
assert.ok(layout.includes("candidate.1.woff2?url"));
assert.ok(layout.includes("candidate.1.ttf?url"));
assert.ok(layout.includes('font-family: "AP Structural", "Urbanist"'));
assert.ok(layout.includes("set:html={candidateStyles}"));

for (const page of [
  "apps/admin/src/components/AdminHome.astro",
  "apps/admin/src/pages/work.astro",
]) {
  const source = readFileSync(page, "utf8");
  assert.ok(
    source.includes('import.meta.env.DEV && "ap-structural-candidate"'),
  );
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

console.log("admin AP Structural candidate packet verified");
