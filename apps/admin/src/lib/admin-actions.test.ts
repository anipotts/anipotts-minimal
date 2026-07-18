import { beforeAll, describe, expect, it } from "vitest";
import {
  createOpaqueAdminToken,
  encryptAdminPayload,
  hashAdminActionPayload,
  importAdminEncryptionKey,
} from "@anipotts/lib/admin";
import {
  approveAdminAction,
  claimAdminAction,
  proveAdminAction,
  proposeAdminAction,
  reviseAdminAction,
} from "./admin-actions";
import { PATCH as patchAdminAction } from "../pages/api/admin/actions/index";

let encodedKey: string;
let encrypted: Awaited<ReturnType<typeof encryptAdminPayload>>;
let payloadFingerprint: string;

beforeAll(async () => {
  encodedKey = createOpaqueAdminToken();
  encrypted = await encryptAdminPayload(
    { operation: "safe" },
    await importAdminEncryptionKey(encodedKey),
    1,
  );
  payloadFingerprint = await hashAdminActionPayload({
    domain: "career",
    action_type: "career.gmail.send",
    exact_scope: {},
    preview: {},
    payload: { operation: "safe" },
    proof_requirement: "provider receipt",
  });
});

class ActionDb {
  row: Record<string, unknown>;
  proofTransitions = 0;
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
      payload_fingerprint: payloadFingerprint,
      approved_payload_fingerprint: payloadFingerprint,
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
          db.proofTransitions += 1;
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
        if (query.includes("payload_ciphertext = ?")) {
          if (!["proposed", "approved"].includes(String(db.row.status))) {
            return { meta: { changes: 0 } };
          }
          if (db.row.payload_fingerprint !== values[9]) {
            return { meta: { changes: 0 } };
          }
          db.row.status = "proposed";
          db.row.exact_scope = values[0];
          db.row.preview = values[1];
          db.row.payload_ciphertext = values[2];
          db.row.payload_iv = values[3];
          db.row.key_version = values[4];
          db.row.payload_fingerprint = values[5];
          db.row.approved_payload_fingerprint = null;
          db.row.proof_requirement = values[6];
          db.row.approved_at = null;
          return { meta: { changes: 1 } };
        }
        if (query.includes("SET status = 'approved'")) {
          if (
            db.row.status !== "proposed" ||
            db.row.payload_fingerprint !== values[4]
          ) {
            return { meta: { changes: 0 } };
          }
          db.row.status = "approved";
          db.row.approved_payload_fingerprint = values[0];
          db.row.approved_at = values[1];
          return { meta: { changes: 1 } };
        }
        if (query.includes("approved_payload_fingerprint = NULL")) {
          db.row.status = "proposed";
          db.row.approved_payload_fingerprint = null;
          db.row.approved_at = null;
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

function routeContext(
  body: Record<string, unknown>,
  options: {
    origin?: string;
    db?: unknown;
    onDatabaseAccess?: () => void;
  } = {},
) {
  const request = new Request("https://admin.anipotts.com/api/admin/actions", {
    method: "PATCH",
    headers: {
      origin: options.origin ?? "https://admin.anipotts.com",
      "content-type": "application/json",
      "x-admin-csrf": "same-origin",
    },
    body: JSON.stringify(body),
  });
  return {
    request,
    url: new URL(request.url),
    locals: {
      runtime: {
        env: {
          get DB() {
            options.onDatabaseAccess?.();
            return options.db;
          },
        },
      },
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

  it("binds approval to the canonical payload fingerprint and rejects replay", async () => {
    const db = new ActionDb();
    db.row.status = "proposed";
    db.row.approved_payload_fingerprint = null;
    db.row.approved_at = null;
    const approved = await approveAdminAction(context(db), "action-safe");
    expect(approved.status).toBe(200);
    expect(db.row.approved_payload_fingerprint).toBe(payloadFingerprint);
    expect((await approveAdminAction(context(db), "action-safe")).status).toBe(
      409,
    );
  });

  it("requires renewed approval after a payload change", async () => {
    const db = new ActionDb();
    const revised = await reviseAdminAction(
      context(db, {
        expected_payload_fingerprint: payloadFingerprint,
        exact_scope: {},
        preview: { summary: "changed confirmed action" },
        payload: { operation: "changed" },
        proof_requirement: "provider receipt",
      }),
      "action-safe",
    );
    expect(revised.status).toBe(200);
    const revision = await revised.json();
    expect(revision).toMatchObject({
      status: "proposed",
      approval_required: true,
      approval_renewed: true,
    });
    expect(revision.payload_fingerprint).not.toBe(payloadFingerprint);
    expect(db.row.approved_payload_fingerprint).toBeNull();
    expect(
      (
        await reviseAdminAction(
          context(db, {
            expected_payload_fingerprint: payloadFingerprint,
            exact_scope: {},
            preview: { summary: "changed confirmed action" },
            payload: { operation: "changed" },
            proof_requirement: "provider receipt",
          }),
          "action-safe",
        )
      ).status,
    ).toBe(409);
    expect(
      (await claimAdminAction(context(db), "action-safe", "claim-token-id"))
        .status,
    ).toBe(409);
    expect((await approveAdminAction(context(db), "action-safe")).status).toBe(
      200,
    );
    expect(
      (await claimAdminAction(context(db), "action-safe", "claim-token-id"))
        .status,
    ).toBe(200);
  });

  it("keeps an identical approved payload revision idempotent", async () => {
    const db = new ActionDb();
    const response = await reviseAdminAction(
      context(db, {
        expected_payload_fingerprint: payloadFingerprint,
        exact_scope: {},
        preview: {},
        payload: { operation: "safe" },
        proof_requirement: "provider receipt",
      }),
      "action-safe",
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "approved",
      payload_fingerprint: payloadFingerprint,
      approval_required: false,
      idempotent: true,
    });
    expect(db.row.approved_payload_fingerprint).toBe(payloadFingerprint);
  });

  it("rejects an identical revision when ciphertext integrity is lost", async () => {
    const db = new ActionDb();
    db.row.payload_ciphertext = `${String(db.row.payload_ciphertext).startsWith("A") ? "B" : "A"}${String(db.row.payload_ciphertext).slice(1)}`;
    const response = await reviseAdminAction(
      context(db, {
        expected_payload_fingerprint: payloadFingerprint,
        exact_scope: {},
        preview: {},
        payload: { operation: "safe" },
        proof_requirement: "provider receipt",
      }),
      "action-safe",
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "action_payload_integrity_failed",
    });
  });

  it("rejects identical revision with null or stale approval binding", async () => {
    for (const approvedFingerprint of [null, "c".repeat(43)]) {
      const db = new ActionDb();
      db.row.approved_payload_fingerprint = approvedFingerprint;
      const response = await reviseAdminAction(
        context(db, {
          expected_payload_fingerprint: payloadFingerprint,
          exact_scope: {},
          preview: {},
          payload: { operation: "safe" },
          proof_requirement: "provider receipt",
        }),
        "action-safe",
      );
      expect(response.status).toBe(409);
      expect(await response.json()).toEqual({
        error: "action_approval_required",
      });
      expect(db.row.status).toBe("proposed");
    }
  });

  it("fails closed when stored payload and fingerprint diverge", async () => {
    const db = new ActionDb();
    db.row.payload_fingerprint = "b".repeat(43);
    const response = await claimAdminAction(
      context(db),
      "action-safe",
      "claim-token-id",
    );
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body).toEqual({
      error: "action_payload_integrity_failed",
    });
    expect(JSON.stringify(body)).not.toContain(encrypted.ciphertext);
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
            proof: { ...successProof, summary: "different proof" },
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

  it("replays an exactly committed proof idempotently after response loss", async () => {
    const db = new ActionDb();
    const claimed = await (
      await claimAdminAction(context(db), "action-safe", "claim-token-id")
    ).json();
    const request = {
      claim_handle: claimed.claim_handle,
      succeeded: true,
      proof: successProof,
    };
    expect(
      (
        await proveAdminAction(
          context(db, request),
          "action-safe",
          "proof-token-id",
        )
      ).status,
    ).toBe(200);
    const retry = await proveAdminAction(
      context(db, request),
      "action-safe",
      "proof-token-id",
    );
    expect(retry.status).toBe(200);
    expect(await retry.json()).toMatchObject({ idempotent: true });
    expect(db.proofTransitions).toBe(1);
    expect(
      (
        await proveAdminAction(
          context(db, request),
          "action-safe",
          "different-proof-token-id",
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

describe("admin action revision route", () => {
  it("rejects missing or invalid action ids before database access", async () => {
    for (const actionId of [undefined, "bad/action"]) {
      let databaseAccessed = false;
      const response = await patchAdminAction(
        routeContext(
          {
            action_id: actionId,
            expected_payload_fingerprint: "a".repeat(43),
          },
          { onDatabaseAccess: () => (databaseAccessed = true) },
        ),
      );
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "action_id_invalid" });
      expect(databaseAccessed).toBe(false);
    }
  });

  it("enforces same-origin mutation guard before database access", async () => {
    let databaseAccessed = false;
    const response = await patchAdminAction(
      routeContext(
        { action_id: "action-safe" },
        {
          origin: "https://outside.invalid",
          onDatabaseAccess: () => (databaseAccessed = true),
        },
      ),
    );
    expect(response.status).toBe(400);
    expect(databaseAccessed).toBe(false);
  });

  it("rejects a stale payload fingerprint through the route", async () => {
    const row = {
      action_id: "action-safe",
      status: "approved",
      expires_at: "2099-07-18T12:00:00.000Z",
      payload_fingerprint: "b".repeat(43),
    };
    const db = {
      prepare() {
        return {
          bind() {
            return this;
          },
          async first() {
            return row;
          },
        };
      },
    };
    const response = await patchAdminAction(
      routeContext(
        {
          action_id: "action-safe",
          expected_payload_fingerprint: "a".repeat(43),
        },
        { db },
      ),
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "action_payload_conflict" });
  });
});
