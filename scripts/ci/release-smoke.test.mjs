#!/usr/bin/env node

import assert from "node:assert/strict";
import { smokeRelease } from "./release-smoke.mjs";
import { activeVersion } from "./worker-version.mjs";

const expectedSha = "b".repeat(40);
const response = (status, body = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const publicReceipt = await smokeRelease({
  target: "www",
  baseUrl: "https://example.test",
  expectedSha,
  fetchImpl: async (url) =>
    url.endsWith("/api/health")
      ? response(200, { release_sha: expectedSha, schema_version: "0042" })
      : response(200),
});
assert.equal(publicReceipt.release_sha, expectedSha);
assert.ok(publicReceipt.checks.length > 10);

const adminReceipt = await smokeRelease({
  target: "admin",
  baseUrl: "https://admin.example.test",
  expectedSha,
  fetchImpl: async (url) =>
    url.endsWith("/api/health")
      ? response(200, { release_sha: expectedSha, schema_version: "0042" })
      : response(302),
});
assert.ok(adminReceipt.checks.every((check) => check.status === 302));

const publicPasskeyReceipt = await smokeRelease({
  target: "admin",
  baseUrl: "https://admin.example.test",
  expectedSha,
  fetchImpl: async (url) => {
    if (url.endsWith("/api/health")) {
      return response(200, {
        release_sha: expectedSha,
        schema_version: "0042",
      });
    }
    return response(url.endsWith("/auth/passkey") ? 200 : 302);
  },
});
assert.equal(
  publicPasskeyReceipt.checks.find((check) => check.path === "/auth/passkey")
    ?.status,
  200,
);

await assert.rejects(
  smokeRelease({
    target: "www",
    baseUrl: "https://example.test",
    expectedSha,
    fetchImpl: async (url) =>
      url.endsWith("/api/health")
        ? response(200, { release_sha: "wrong", schema_version: "0042" })
        : response(200),
  }),
  /release SHA mismatch/,
);

await assert.rejects(
  smokeRelease({
    target: "admin",
    mode: "authenticated",
    baseUrl: "https://admin.example.test",
    expectedSha,
    env: {},
    fetchImpl: async (url) =>
      url.endsWith("/api/health")
        ? response(200, { release_sha: expectedSha, schema_version: "0042" })
        : response(200),
  }),
  /authenticated smoke identity is not installed/,
);

await assert.rejects(
  smokeRelease({
    target: "admin",
    mode: "authenticated",
    baseUrl: "https://admin.example.test",
    expectedSha,
    env: {
      ADMIN_CI_ACCESS_CLIENT_ID: "test-client",
      ADMIN_CI_ACCESS_CLIENT_SECRET: "test-secret",
      ADMIN_CI_READ_TOKEN: "test-read-token",
    },
    fetchImpl: async (url, init = {}) => {
      if (url.endsWith("/api/health")) {
        return response(200, {
          release_sha: expectedSha,
          schema_version: "0042",
        });
      }
      return response(init.method === "POST" ? 200 : 200);
    },
  }),
  /read-only identity was allowed to write/,
);

assert.throws(
  () => activeVersion({ versions: [{ version_id: "split", percentage: 50 }] }),
  /single active Worker version/,
);
assert.equal(
  activeVersion({ versions: [{ version_id: "current", percentage: 100 }] }),
  "current",
);

console.log("release smoke tests passed");
