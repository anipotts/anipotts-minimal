import { beforeAll, describe, expect, it } from "vitest";
import {
  createOpaqueAdminToken,
  encryptAdminPayload,
  importAdminEncryptionKey,
} from "@anipotts/lib/admin";
import {
  claimAdminAction,
  proveAdminAction,
  proposeAdminAction,
} from "./admin-actions";

let encodedKey: string;
let encrypted: Awaited<ReturnType<typeof encryptAdminPayload>>;

beforeAll(async () => {
  encodedKey = createOpaqueAdminToken();
  encrypted = await encryptAdminPayload(
    { operation: "safe" },
    await importAdminEncryptionKey(encodedKey),
    1,
  );
});

class ActionDb {
  row: Record<string, unknown>;
  constructor() {
    this.row = {
      action_id: "action-safe",
      domain: "career",
      action_type: "career.gmail.send",
      status: "approved",
      idempotency_key: "idempotency-safe",
      exact_scope: "{}",
      preview: "{}",
      payload_ciphertext: encrypted.ciphertext,
      payload_iv: encrypted.iv,
      key_version: 1,
      proof_requirement: "provider receipt",
      created_by: "ani",
      runner_token_id: null,
      proof_token_id: null,
      claim_handle_hash: null,
      claim_handle_used_at: null,
      execution_started_at: null,
      error_code: null,
      proof: null,
      created_at: "2026-07-17T12:00:00.000Z",
      updated_at: "2026-07-17T12:00:00.000Z",
      approved_at: "2026-07-17T12:00:00.000Z",
      claimed_at: null,
      completed_at: null,
      expires_at: "2099-07-18T12:00:00.000Z",
    };
  }
  prepare(query: string) {
    const db = this;
    let values: unknown[] = [];
    return {
      bind(...bound: unknown[]) {
        values = bound;
        return this;
      },
      async first<T>() {
        return db.row as T;
      },
      async all<T>() {
        return { results: [db.row as T] };
      },
      async run() {
        if (query.includes("proof_token_id")) {
          if (db.row.status !== "claimed" || db.row.claim_handle_used_at)
            return { meta: { changes: 0 } };
          db.row.status = values[0];
          db.row.proof = values[1];
          db.row.error_code = values[2];
          db.row.proof_token_id = values[3];
          db.row.claim_handle_used_at = values[4];
          return { meta: { changes: 1 } };
        }
        if (query.includes("status = 'claimed'")) {
          if (db.row.status !== "approved") return { meta: { changes: 0 } };
          db.row.status = "claimed";
          db.row.runner_token_id = values[0];
          db.row.claim_handle_hash = values[1];
          db.row.execution_started_at = values[2];
          db.row.claimed_at = values[3];
          return { meta: { changes: 1 } };
        }
        return { meta: { changes: 1 } };
      },
    };
  }
  async batch() {
    return [];
  }
}

function context(db: ActionDb, body: Record<string, unknown> = {}) {
  return {
    request: new Request(
      "https://admin.anipotts.com/api/admin/actions/action-safe/proof",
      {
        method: "POST",
        headers: {
          origin: "https://admin.anipotts.com",
          "content-type": "application/json",
          "x-admin-csrf": "same-origin",
        },
        body: JSON.stringify(body),
      },
    ),
    locals: {
      runtime: { env: { DB: db, ADMIN_ACTION_ENCRYPTION_KEY: encodedKey } },
    },
  } as never;
}

const successProof = {
  provider: "gmail",
  receipt_digest: "a".repeat(43),
  observed_at: "2026-07-17T12:00:00.000Z",
  summary: "provider accepted the confirmed action",
  provider_state: "accepted",
};

describe("admin action service boundary", () => {
  it("rejects CSRF before database access", async () => {
    let databaseAccessed = false;
    const requestContext = {
      request: new Request("https://admin.anipotts.com/api/admin/actions", {
        method: "POST",
        headers: {
          origin: "https://outside.invalid",
          "content-type": "application/json",
        },
        body: "{}",
      }),
      locals: {
        runtime: {
          env: {
            get DB() {
              databaseAccessed = true;
              return undefined;
            },
          },
        },
      },
    } as never;
    await expect(proposeAdminAction(requestContext)).rejects.toThrow("origin");
    expect(databaseAccessed).toBe(false);
  });

  it("binds independent claim and proof token ids through a one-time handle", async () => {
    const db = new ActionDb();
    const claim = await claimAdminAction(
      context(db),
      "action-safe",
      "claim-token-id",
    );
    const claimed = await claim.json();
    expect(claimed.claim_handle).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(JSON.stringify(db.row)).not.toContain(claimed.claim_handle);
    const response = await proveAdminAction(
      context(db, {
        claim_handle: claimed.claim_handle,
        succeeded: true,
        proof: successProof,
      }),
      "action-safe",
      "proof-token-id",
    );
    expect(response.status).toBe(200);
    expect(db.row.runner_token_id).toBe("claim-token-id");
    expect(db.row.proof_token_id).toBe("proof-token-id");
  });

  it("fails closed for missing, wrong, and reused handles plus duplicate claims", async () => {
    const db = new ActionDb();
    const claimed = await (
      await claimAdminAction(context(db), "action-safe", "claim-token-id")
    ).json();
    expect(
      (await claimAdminAction(context(db), "action-safe", "claim-token-id"))
        .status,
    ).toBe(409);
    expect(
      (
        await proveAdminAction(
          context(db, { succeeded: true, proof: successProof }),
          "action-safe",
          "proof-token-id",
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await proveAdminAction(
          context(db, {
            claim_handle: "wrong",
            succeeded: true,
            proof: successProof,
          }),
          "action-safe",
          "proof-token-id",
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await proveAdminAction(
          context(db, {
            claim_handle: claimed.claim_handle,
            succeeded: true,
            proof: successProof,
          }),
          "action-safe",
          "proof-token-id",
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await proveAdminAction(
          context(db, {
            claim_handle: claimed.claim_handle,
            succeeded: true,
            proof: successProof,
          }),
          "action-safe",
          "proof-token-id",
        )
      ).status,
    ).toBe(409);
  });

  it("requires strict success proof and bounded failed proof", async () => {
    const db = new ActionDb();
    const claimed = await (
      await claimAdminAction(context(db), "action-safe", "claim-token-id")
    ).json();
    expect(
      (
        await proveAdminAction(
          context(db, {
            claim_handle: claimed.claim_handle,
            succeeded: true,
            proof: { ...successProof, receipt_digest: "" },
          }),
          "action-safe",
          "proof-token-id",
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await proveAdminAction(
          context(db, {
            claim_handle: claimed.claim_handle,
            succeeded: false,
            error_code: "provider_rejected",
            proof: {
              provider: "gmail",
              observed_at: "2026-07-17T12:00:00.000Z",
              summary: "provider rejected the operation",
              provider_state: "rejected",
            },
          }),
          "action-safe",
          "proof-token-id",
        )
      ).status,
    ).toBe(200);
  });
});
