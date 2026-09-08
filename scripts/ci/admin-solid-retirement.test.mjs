import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { DEPLOY_TARGETS, computeDeployTargets } from "./release-policy.mjs";

assert.equal(existsSync("apps/admin-solid/package.json"), false);
assert.equal(existsSync("config/admin-solid-retirement.json"), false);
assert.equal(DEPLOY_TARGETS.includes("admin_solid"), false);
for (const path of [".github/workflows/deploy.yml", "turbo.json"]) {
  assert.doesNotMatch(readFileSync(path, "utf8"), /admin[-_]solid/);
}
assert.equal(
  Object.values(computeDeployTargets(["apps/admin-solid/package.json"])).some(
    Boolean,
  ),
  false,
  "legacy deletion must not deploy unrelated targets",
);
console.log("legacy admin absent from active apps and deployment targets");
