#!/usr/bin/env node

import assert from "node:assert/strict";
import { planDeployment } from "./deployment-plan.mjs";

const current = "b".repeat(40);
const deployed = "a".repeat(40);
const base = {
  sourceSha: current,
  eventName: "push",
  diffNameStatus: () => ["M\tapps/www/src/styles/global.css"],
};

const missing = planDeployment(["M\t.github/workflows/deploy.yml"], {
  ...base,
  publicHealth: {},
});
assert.equal(missing.release.deploy_targets.www, true);
assert.equal(missing.www_disposition, "missing_live_sha");

const currentPlan = planDeployment(["M\tdocs/release.md"], {
  ...base,
  publicHealth: { release_sha: current },
});
assert.equal(currentPlan.deployment_required, false);
assert.equal(currentPlan.deployment_disposition, "no_deployment_required");

const outdated = planDeployment(["M\t.github/workflows/deploy.yml"], {
  ...base,
  publicHealth: { release_sha: deployed },
});
assert.equal(outdated.release.deploy_targets.www, true);
assert.equal(outdated.www_disposition, "outdated");

const noPublicDiff = planDeployment(["M\tdocs/release.md"], {
  ...base,
  publicHealth: { release_sha: deployed },
  diffNameStatus: () => ["M\tdocs/release.md"],
});
assert.equal(noPublicDiff.release.deploy_targets.www, false);
assert.equal(noPublicDiff.www_disposition, "no_public_diff");

console.log("deployment plan tests passed");
