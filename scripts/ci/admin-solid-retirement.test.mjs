#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { computeDeployTargets } from "./release-policy.mjs";

const CONTRACT_PATH = "config/admin-solid-retirement.json";
const REQUIRED_PROOFS = [
  "route_parity",
  "native_auth",
  "mobile_qa",
  "rollback_rehearsal",
  "production_proof",
  "recovery_ref",
];
const ALLOWED_STATES = new Set(["retained_rollback", "retire_ready"]);
const ALLOWED_PROOF_STATES = new Set(["pending", "passed"]);

const contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));

assert.equal(contract.schema_version, 1, "unsupported retirement contract");
assert.equal(contract.surface, "apps/admin-solid", "wrong rollback surface");
assert.ok(ALLOWED_STATES.has(contract.state), "unknown retirement state");
assert.deepEqual(
  Object.keys(contract.proofs).sort(),
  REQUIRED_PROOFS.toSorted(),
  "retirement proof inventory drifted",
);

for (const name of REQUIRED_PROOFS) {
  const proof = contract.proofs[name];
  assert.ok(
    ALLOWED_PROOF_STATES.has(proof.status),
    `${name} has unknown status`,
  );
  if (proof.status === "passed") {
    assert.match(
      proof.ref ?? "",
      /^(git|github|cloudflare|browser|d1):\S+$/u,
      `${name} needs a durable proof ref`,
    );
  } else {
    assert.equal(proof.ref, null, `${name} cannot retain an unverified ref`);
  }
}

const allProofsPassed = REQUIRED_PROOFS.every(
  (name) => contract.proofs[name].status === "passed",
);

assert.equal(
  contract.retire_ready,
  allProofsPassed,
  "retire_ready must equal the complete proof set",
);
assert.equal(
  contract.state,
  allProofsPassed ? "retire_ready" : "retained_rollback",
  "retirement state does not match proof completion",
);

if (allProofsPassed) {
  assert.match(
    contract.recovery_ref ?? "",
    /^refs\/tags\/admin-solid-recovery-[0-9]{4}-[0-9]{2}-[0-9]{2}$/u,
    "retirement requires a dated immutable recovery tag",
  );
  assert.equal(
    existsSync("apps/admin-solid"),
    false,
    "remove the active rollback app after its retirement proof passes",
  );
} else {
  assert.equal(
    contract.recovery_ref,
    null,
    "pending retirement cannot claim a recovery ref",
  );
  assert.equal(
    existsSync("apps/admin-solid/package.json"),
    true,
    "keep the rollback app until every retirement proof passes",
  );
}

assert.equal(
  computeDeployTargets(["apps/admin-solid/src/routes/index.tsx"]).admin_solid,
  false,
  "rollback app must remain excluded from automatic deploy selection",
);

console.log(`admin-solid retirement: ${contract.state}`);
