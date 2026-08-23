#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "packages/brand";
const PACKET = join(ROOT, "ap-structural-v0.1.0-candidate.1");
const MANIFEST_HASH =
  "5d4d300ea05478f717fdd3eb6a52bb8e58281920d8994c1c4bb758d59070db75";
const WOFF2_HASH =
  "23c442113f828b5afdec48f2b5ffc12287bc48511458c05632d98eda64c976ae";

const manifestBytes = readFileSync(join(PACKET, "MANIFEST.json"));
assert.equal(sha256(manifestBytes), MANIFEST_HASH);
const manifest = JSON.parse(manifestBytes.toString("utf8"));
for (const file of manifest.files) {
  assert.equal(
    sha256(readFileSync(join(PACKET, file.path))),
    file.sha256,
    `${file.path} must match the preserved source packet`,
  );
}

const release = JSON.parse(readFileSync(join(ROOT, "RELEASE.json"), "utf8"));
assert.equal(release.status, "web-ready");
assert.equal(release.display_face, "AP Structural");
assert.equal(release.display_face_woff2_sha256, WOFF2_HASH);
assert.deepEqual(release.semantic_colors, {
  light_background: "#61abea",
  light_text: "#ffffff",
  light_reading_surface: "#0b1220",
  light_reading_surface_elevated: "#111b2e",
  dark_background: "#080b10",
  elevated_surface: "#11151d",
  action: "#61abea",
  primary_text: "#f7faff",
  muted_text: "#abb2be",
});

const tokens = readFileSync(join(ROOT, "src/tokens.css"), "utf8");
for (const value of Object.values(release.semantic_colors)) {
  assert.ok(tokens.includes(value), `tokens must contain ${value}`);
}

const typography = readFileSync(join(ROOT, "src/typography.css"), "utf8");
assert.ok(typography.includes('font-family: "AP Structural"'));
assert.ok(typography.includes('"Instrument Sans Variable"'));
assert.ok(
  typography.includes("APStructuralDisplayBlack-v0.1.0-candidate.1.woff2"),
);

const www = readFileSync("apps/www/src/styles/global.css", "utf8");
const admin = readFileSync("apps/admin/src/styles/admin.css", "utf8");
assert.ok(www.startsWith('@import "@anipotts/brand/public.css"'));
assert.ok(admin.startsWith('@import "@anipotts/brand/public.css"'));

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

console.log("brand contract tests passed");
