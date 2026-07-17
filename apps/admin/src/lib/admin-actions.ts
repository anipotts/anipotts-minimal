import {
  assertAdminActionTransition,
  assertSanitizedAdminActionMetadata,
  assertSameOriginMutation,
  decryptAdminPayload,
  encryptAdminPayload,
  parseAdminEncryptionKeyring,
  resolveAdminEncryptionKey,
  isActionExpired,
  isAdminIdempotencyConflict,
  hashOpaqueAdminToken,
  isAdminDomain,
  type AdminActionState,
} from "@anipotts/lib/admin";
import { json, type D1Database } from "./passkey-auth";

const ENABLED_RUNNER_ACTIONS = new Set([
  "career.gmail.send",
  "career.gmail.reply",
  "career.calendar.create",
  "career.calendar.update",
  "career.tracker.update",
]);

type ActionContext = {
  request: Request;
  locals: App.Locals;
};

type ActionRow = {
  action_id: string;
  domain: string;
  action_type: string;
  status: AdminActionState;
  idempotency_key: string;
  exact_scope: string;
  preview: string;
  payload_ciphertext: string;
  payload_iv: string;
  key_version: number;
  proof_requirement: string;
  created_by: string;
  runner_token_id: string | null;
  error_code: string | null;
  proof: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  claimed_at: string | null;
  completed_at: string | null;
  expires_at: string;
};

export async function listAdminActions(
  context: ActionContext,
): Promise<Response> {
  const db = requiredDb(context);
  const result = await db
    .prepare(
      `SELECT action_id, domain, action_type, status, idempotency_key, exact_scope,
            preview, payload_ciphertext, payload_iv, key_version, proof_requirement, created_by,
            runner_token_id, error_code, proof, created_at, updated_at, approved_at,
            claimed_at, completed_at, expires_at
       FROM admin_actions ORDER BY created_at DESC LIMIT 100`,
    )
    .all<ActionRow>();
  const rows = result.results ?? [];
  const key = rows.some((row) => ["proposed", "approved"].includes(row.status))
    ? await actionKeyring(context)
    : null;
  const actions = await Promise.all(
    rows.map(async (row) => ({
      ...sanitizeActionRow(row),
      confirmation:
        key && ["proposed", "approved"].includes(row.status)
          ? await decryptAdminPayload(
              {
                ciphertext: row.payload_ciphertext,
                iv: row.payload_iv,
              },
              resolveAdminEncryptionKey(key, row.key_version),
            )
          : null,
    })),
  );
  return json({ actions });
}

export async function proposeAdminAction(
  context: ActionContext,
): Promise<Response> {
  assertSameOriginMutation(context.request);
  const db = requiredDb(context);
  const body = await readBody(context.request);
  if (!isAdminDomain(body.domain))
    return json({ error: "invalid_domain" }, { status: 400 });
  const actionType = text(body.action_type);
  const idempotencyKey = text(body.idempotency_key);
  const proofRequirement = text(body.proof_requirement);
  const exactScope = object(body.exact_scope);
  const preview = object(body.preview);
  const payload = object(body.payload);
  if (!actionType || !idempotencyKey || !proofRequirement) {
    return json({ error: "action_contract_incomplete" }, { status: 400 });
  }
  try {
    assertSanitizedAdminActionMetadata({ exactScope, preview });
  } catch {
    return json({ error: "private_action_metadata_rejected" }, { status: 400 });
  }
  const keyring = await actionKeyring(context);
  const encrypted = await encryptAdminPayload(
    payload,
    resolveAdminEncryptionKey(keyring, keyring.currentVersion),
    keyring.currentVersion,
  );
  const now = new Date();
  const actionId = crypto.randomUUID();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  try {
    await db
      .prepare(
        `INSERT INTO admin_actions
        (action_id, domain, action_type, status, idempotency_key, exact_scope,
         preview, payload_ciphertext, payload_iv, key_version, proof_requirement,
         created_by, created_at, updated_at, expires_at)
       VALUES (?, ?, ?, 'proposed', ?, ?, ?, ?, ?, ?, ?, 'ani', ?, ?, ?)`,
      )
      .bind(
        actionId,
        body.domain,
        actionType,
        idempotencyKey,
        JSON.stringify(exactScope),
        JSON.stringify(preview),
        encrypted.ciphertext,
        encrypted.iv,
        encrypted.key_version,
        proofRequirement,
        now.toISOString(),
        now.toISOString(),
        expiresAt,
      )
      .run();
  } catch (error) {
    if (isAdminIdempotencyConflict(error)) {
      return json({ error: "duplicate_idempotency_key" }, { status: 409 });
    }
    throw error;
  }
  return json(
    { action_id: actionId, status: "proposed", expires_at: expiresAt },
    { status: 201 },
  );
}

export async function approveAdminAction(
  context: ActionContext,
  actionId: string,
): Promise<Response> {
  assertSameOriginMutation(context.request);
  const db = requiredDb(context);
  const row = await readAction(db, actionId);
  if (!row) return json({ error: "action_not_found" }, { status: 404 });
  if (isActionExpired(row.expires_at)) return expireAction(db, row);
  if (row.status !== "proposed") {
    return json({ error: "action_state_conflict" }, { status: 409 });
  }
  assertAdminActionTransition(row.status, "approved");
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `UPDATE admin_actions SET status = 'approved', approved_at = ?, updated_at = ? WHERE action_id = ? AND status = 'proposed'`,
    )
    .bind(now, now, actionId)
    .run();
  if (result.meta?.changes !== 1) {
    return json({ error: "action_state_conflict" }, { status: 409 });
  }
  return json({
    action_id: actionId,
    status: "approved",
    expires_at: row.expires_at,
  });
}

export async function claimAdminAction(
  context: ActionContext,
  actionId: string,
  runnerTokenId: string,
): Promise<Response> {
  const db = requiredDb(context);
  const row = await readAction(db, actionId);
  if (!row) return json({ error: "action_not_found" }, { status: 404 });
  if (!ENABLED_RUNNER_ACTIONS.has(row.action_type)) {
    return json({ error: "proposal_only_action" }, { status: 403 });
  }
  if (isActionExpired(row.expires_at)) return expireAction(db, row);
  if (row.status !== "approved") {
    return json({ error: "action_state_conflict" }, { status: 409 });
  }
  assertAdminActionTransition(row.status, "claimed");
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `UPDATE admin_actions SET status = 'claimed', runner_token_id = ?, claimed_at = ?, updated_at = ?
     WHERE action_id = ? AND status = 'approved'`,
    )
    .bind(runnerTokenId, now, now, actionId)
    .run();
  if (result.meta?.changes !== 1)
    return json({ error: "action_state_conflict" }, { status: 409 });
  const keyring = await actionKeyring(context);
  const payload = await decryptAdminPayload(
    { ciphertext: row.payload_ciphertext, iv: row.payload_iv },
    resolveAdminEncryptionKey(keyring, row.key_version),
  );
  return json({
    action_id: row.action_id,
    action_type: row.action_type,
    exact_scope: parseObject(row.exact_scope),
    preview: parseObject(row.preview),
    proof_requirement: row.proof_requirement,
    expires_at: row.expires_at,
    payload,
  });
}

export async function proveAdminAction(
  context: ActionContext,
  actionId: string,
  runnerTokenId: string,
): Promise<Response> {
  const db = requiredDb(context);
  const row = await readAction(db, actionId);
  if (!row || row.runner_token_id !== runnerTokenId) {
    return json({ error: "claimed_action_not_found" }, { status: 404 });
  }
  if (row.status !== "claimed") {
    return json({ error: "action_state_conflict" }, { status: 409 });
  }
  const body = await readBody(context.request);
  const nextState = body.succeeded === true ? "succeeded" : "failed";
  assertAdminActionTransition(row.status, nextState);
  const proof = await sanitizeProof(object(body.proof));
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `UPDATE admin_actions SET status = ?, proof = ?, error_code = ?, completed_at = ?, updated_at = ?
     WHERE action_id = ? AND status = 'claimed' AND runner_token_id = ?`,
    )
    .bind(
      nextState,
      JSON.stringify(proof),
      text(body.error_code) || null,
      now,
      now,
      actionId,
      runnerTokenId,
    )
    .run();
  if (result.meta?.changes !== 1) {
    return json({ error: "action_state_conflict" }, { status: 409 });
  }
  return json({ action_id: actionId, status: nextState, proof });
}

function requiredDb(context: ActionContext): D1Database {
  const db = context.locals.runtime?.env.DB;
  if (!db) throw json({ error: "db_binding_missing" }, { status: 503 });
  return db;
}

async function actionKeyring(context: ActionContext) {
  try {
    return await parseAdminEncryptionKeyring({
      currentVersion:
        context.locals.runtime?.env.ADMIN_ACTION_ENCRYPTION_KEY_VERSION,
      keysJson: context.locals.runtime?.env.ADMIN_ACTION_ENCRYPTION_KEYS,
      legacyKey: context.locals.runtime?.env.ADMIN_ACTION_ENCRYPTION_KEY,
    });
  } catch {
    throw json({ error: "action_encryption_key_unavailable" }, { status: 503 });
  }
}

async function readAction(
  db: D1Database,
  actionId: string,
): Promise<ActionRow | null> {
  return db
    .prepare(`SELECT * FROM admin_actions WHERE action_id = ?`)
    .bind(actionId)
    .first<ActionRow>();
}

async function expireAction(db: D1Database, row: ActionRow): Promise<Response> {
  if (["proposed", "approved", "claimed"].includes(row.status)) {
    const now = new Date().toISOString();
    await db
      .prepare(
        `UPDATE admin_actions SET status = 'expired', updated_at = ? WHERE action_id = ?`,
      )
      .bind(now, row.action_id)
      .run();
  }
  return json(
    { error: "action_expired", action_id: row.action_id },
    { status: 410 },
  );
}

function sanitizeActionRow(row: ActionRow) {
  const {
    payload_ciphertext: _payloadCiphertext,
    payload_iv: _payloadIv,
    ...safeRow
  } = row;
  return {
    ...safeRow,
    exact_scope: parseObject(row.exact_scope),
    preview: parseObject(row.preview),
    proof: parseObject(row.proof ?? ""),
  };
}

async function sanitizeProof(proof: Record<string, unknown>) {
  const receipt = text(proof.receipt_ref);
  return {
    provider: text(proof.provider),
    receipt_ref: receipt ? await hashOpaqueAdminToken(receipt) : "",
    observed_at: text(proof.observed_at) || new Date().toISOString(),
    summary: text(proof.summary),
  };
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return (await request.json().catch(() => ({}))) as Record<string, unknown>;
}
function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function parseObject(value: string): Record<string, unknown> {
  try {
    return object(JSON.parse(value));
  } catch {
    return {};
  }
}
