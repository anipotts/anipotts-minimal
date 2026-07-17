import assert from "node:assert/strict";
import test from "node:test";
import { runAdminAction } from "./action-runner-lib.mjs";

const proof = {
  provider: "gmail",
  receipt_digest: "a".repeat(43),
  observed_at: "2026-07-17T12:00:00.000Z",
  summary: "provider accepted the confirmed action",
  provider_state: "accepted",
};

test("retries stored proof without invoking the adapter again", async () => {
  let adapterCalls = 0;
  let stored = null;
  let proofCalls = 0;
  const journal = {
    load: async () => stored,
    save: async (entry) => {
      stored = entry;
    },
    remove: async () => {
      stored = null;
    },
  };
  const common = {
    actionId: "action-safe",
    claim: async () => ({
      action_type: "career.gmail.send",
      payload: {},
      claim_handle: "handle",
      expires_at: "2026-07-18T00:00:00.000Z",
    }),
    adapter: () => {
      adapterCalls += 1;
      return proof;
    },
    journal,
    now: () => new Date("2026-07-17T12:00:00.000Z"),
  };
  await assert.rejects(
    runAdminAction({
      ...common,
      prove: async () => {
        proofCalls += 1;
        throw new Error("transport");
      },
    }),
  );
  assert.equal(adapterCalls, 1);
  assert.equal(stored?.request.proof.receipt_digest, proof.receipt_digest);
  await runAdminAction({
    ...common,
    prove: async () => {
      proofCalls += 1;
    },
  });
  assert.equal(adapterCalls, 1);
  assert.equal(proofCalls, 2);
  assert.equal(stored, null);
});

test("refuses an expired claim before adapter execution", async () => {
  let adapterCalls = 0;
  let submitted;
  await assert.rejects(
    runAdminAction({
      actionId: "action-safe",
      claim: async () => ({
        action_type: "career.gmail.send",
        payload: {},
        claim_handle: "handle",
        expires_at: "2026-07-17T11:00:00.000Z",
      }),
      prove: async (body) => {
        submitted = body;
      },
      adapter: () => {
        adapterCalls += 1;
      },
      journal: {
        load: async () => null,
        save: async () => {},
        remove: async () => {},
      },
      now: () => new Date("2026-07-17T12:00:00.000Z"),
    }),
  );
  assert.equal(adapterCalls, 0);
  assert.equal(submitted.proof.provider_state, "not_started");
});

test("treats an adapter exception as an ambiguous provider outcome", async () => {
  let stored = null;
  let submitted;
  await assert.rejects(
    runAdminAction({
      actionId: "action-safe",
      claim: async () => ({
        action_type: "career.gmail.send",
        payload: {},
        claim_handle: "handle",
        expires_at: "2026-07-18T00:00:00.000Z",
      }),
      prove: async (body) => {
        submitted = body;
      },
      adapter: () => {
        assert.equal(stored?.stage, "claimed");
        throw new Error("ambiguous command failure");
      },
      journal: {
        load: async () => null,
        save: async (entry) => {
          stored = entry;
        },
        remove: async () => {
          stored = null;
        },
      },
      now: () => new Date("2026-07-17T12:00:00.000Z"),
    }),
  );
  assert.equal(submitted.proof.provider_state, "unknown");
  assert.equal(submitted.error_code, "provider_outcome_unknown");
  assert.equal(stored, null);
});

test("does not restart execution from a claimed journal", async () => {
  let claimCalls = 0;
  let adapterCalls = 0;
  let proofCalls = 0;
  await assert.rejects(
    runAdminAction({
      actionId: "action-safe",
      claim: async () => {
        claimCalls += 1;
      },
      prove: async () => {
        proofCalls += 1;
      },
      adapter: () => {
        adapterCalls += 1;
      },
      journal: {
        load: async () => ({
          stage: "claimed",
          action_id: "action-safe",
          claim_handle: "handle",
        }),
        save: async () => {},
        remove: async () => {},
      },
    }),
    /explicit reconciliation/,
  );
  assert.equal(claimCalls, 0);
  assert.equal(adapterCalls, 0);
  assert.equal(proofCalls, 0);
});
