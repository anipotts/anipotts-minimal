import {
  assertAdminActionTransition,
  assertSanitizedAdminActionMetadata,
  assertSameOriginMutation,
  constantTimeEqualAdminDigest,
  createOpaqueAdminToken,
  decryptAdminPayload,
  encryptAdminPayload,
  hashAdminActionPayload,
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
  payload_fingerprint: string;
  approved_payload_fingerprint: string | null;
  proof_requirement: string;
  created_by: string;
  runner_token_id: string | null;
  proof_token_id: string | null;
  claim_handle_hash: string | null;
  claim_handle_used_at: string | null;
  execution_started_at: string | null;
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
            preview, payload_ciphertext, payload_iv, key_version, payload_fingerprint,
            approved_payload_fingerprint, proof_requirement, created_by,
            runner_token_id, proof_token_id, claim_handle_used_at, execution_started_at,
            error_code, proof, created_at, updated_at, approved_at, claimed_at,
            completed_at, expires_at
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
  const payloadFingerprint = await fingerprintActionEnvelope({
    domain: body.domain,
    actionType,
    exactScope,
    preview,
    payload,
    proofRequirement,
  });
  const now = new Date();
  const actionId = crypto.randomUUID();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  try {
    await db
      .prepare(
        `INSERT INTO admin_actions
        (action_id, domain, action_type, status, idempotency_key, exact_scope,
         preview, payload_ciphertext, payload_iv, key_version, payload_fingerprint,
         proof_requirement,
         created_by, created_at, updated_at, expires_at)
       VALUES (?, ?, ?, 'proposed', ?, ?, ?, ?, ?, ?, ?, ?, 'ani', ?, ?, ?)`,
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
        payloadFingerprint,
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
    {
      action_id: actionId,
      status: "proposed",
      payload_fingerprint: payloadFingerprint,
      expires_at: expiresAt,
    },
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
  const integrity = await verifyActionPayloadIntegrity(context, row);
  if (integrity instanceof Response) return integrity;
  assertAdminActionTransition(row.status, "approved");
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `UPDATE admin_actions SET status = 'approved', approved_payload_fingerprint = ?,
       approved_at = ?, updated_at = ?
       WHERE action_id = ? AND status = 'proposed' AND payload_fingerprint = ?`,
    )
    .bind(row.payload_fingerprint, now, now, actionId, row.payload_fingerprint)
    .run();
  if (result.meta?.changes !== 1) {
    return json({ error: "action_state_conflict" }, { status: 409 });
  }
  return json({
    action_id: actionId,
    status: "approved",
    approved_payload_fingerprint: row.payload_fingerprint,
    expires_at: row.expires_at,
  });
}

export async function reviseAdminAction(
  context: ActionContext,
  actionId: string,
  parsedBody?: Record<string, unknown>,
): Promise<Response> {
  assertSameOriginMutation(context.request);
  const db = requiredDb(context);
  const row = await readAction(db, actionId);
  if (!row) return json({ error: "action_not_found" }, { status: 404 });
  if (isActionExpired(row.expires_at)) return expireAction(db, row);
  if (!["proposed", "approved"].includes(row.status)) {
    return json({ error: "action_state_conflict" }, { status: 409 });
  }
  const body = parsedBody ?? (await readBody(context.request));
  const expectedFingerprint = text(body.expected_payload_fingerprint);
  if (
    !expectedFingerprint ||
    !constantTimeEqualAdminDigest(expectedFingerprint, row.payload_fingerprint)
  ) {
    return json({ error: "action_payload_conflict" }, { status: 409 });
  }
  const integrity = await verifyActionPayloadIntegrity(context, row);
  if (integrity instanceof Response) return integrity;
  const proofRequirement = text(body.proof_requirement);
  const exactScope = object(body.exact_scope);
  const preview = object(body.preview);
  const payload = object(body.payload);
  if (!proofRequirement) {
    return json({ error: "action_contract_incomplete" }, { status: 400 });
  }
  try {
    assertSanitizedAdminActionMetadata({ exactScope, preview });
  } catch {
    return json({ error: "private_action_metadata_rejected" }, { status: 400 });
  }
  const payloadFingerprint = await fingerprintActionEnvelope({
    domain: row.domain,
    actionType: row.action_type,
    exactScope,
    preview,
    payload,
    proofRequirement,
  });
  if (
    constantTimeEqualAdminDigest(payloadFingerprint, row.payload_fingerprint)
  ) {
    if (
      row.status === "approved" &&
      (!row.approved_payload_fingerprint ||
        !constantTimeEqualAdminDigest(
          row.approved_payload_fingerprint,
          row.payload_fingerprint,
        ))
    ) {
      const now = new Date().toISOString();
      await db
        .prepare(
          `UPDATE admin_actions SET status = 'proposed', approved_payload_fingerprint = NULL,
           approved_at = NULL, updated_at = ?
           WHERE action_id = ? AND status = 'approved' AND payload_fingerprint = ?`,
        )
        .bind(now, actionId, row.payload_fingerprint)
        .run();
      return json({ error: "action_approval_required" }, { status: 409 });
    }
    return json({
      action_id: actionId,
      status: row.status,
      payload_fingerprint: row.payload_fingerprint,
      approval_required: row.status !== "approved",
      idempotent: true,
    });
  }
  const keyring = await actionKeyring(context);
  const encrypted = await encryptAdminPayload(
    payload,
    resolveAdminEncryptionKey(keyring, keyring.currentVersion),
    keyring.currentVersion,
  );
  const approvalRenewed = row.status === "approved";
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `UPDATE admin_actions SET status = 'proposed', exact_scope = ?, preview = ?,
       payload_ciphertext = ?, payload_iv = ?, key_version = ?, payload_fingerprint = ?,
       approved_payload_fingerprint = NULL, proof_requirement = ?, approved_at = NULL,
       updated_at = ?
       WHERE action_id = ? AND status IN ('proposed', 'approved') AND payload_fingerprint = ?`,
    )
    .bind(
      JSON.stringify(exactScope),
      JSON.stringify(preview),
      encrypted.ciphertext,
      encrypted.iv,
      encrypted.key_version,
      payloadFingerprint,
      proofRequirement,
      now,
      actionId,
      row.payload_fingerprint,
    )
    .run();
  if (result.meta?.changes !== 1) {
    return json({ error: "action_payload_conflict" }, { status: 409 });
  }
  return json({
    action_id: actionId,
    status: "proposed",
    payload_fingerprint: payloadFingerprint,
    approval_required: true,
    approval_renewed: approvalRenewed,
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
  const integrity = await verifyActionPayloadIntegrity(context, row);
  if (integrity instanceof Response) return integrity;
  if (
    !row.approved_payload_fingerprint ||
    !constantTimeEqualAdminDigest(
      row.approved_payload_fingerprint,
      row.payload_fingerprint,
    )
  ) {
    const now = new Date().toISOString();
    await db
      .prepare(
        `UPDATE admin_actions SET status = 'proposed', approved_payload_fingerprint = NULL,
         approved_at = NULL, updated_at = ?
         WHERE action_id = ? AND status = 'approved' AND payload_fingerprint = ?`,
      )
      .bind(now, actionId, row.payload_fingerprint)
      .run();
    return json({ error: "action_approval_required" }, { status: 409 });
  }
  assertAdminActionTransition(row.status, "claimed");
  const now = new Date().toISOString();
  const claimHandle = createOpaqueAdminToken();
  const claimHandleHash = await hashOpaqueAdminToken(claimHandle);
  const payload = integrity;
  const result = await db
    .prepare(
      `UPDATE admin_actions SET status = 'claimed', runner_token_id = ?, claim_handle_hash = ?,
       execution_started_at = ?, claimed_at = ?, updated_at = ?
     WHERE action_id = ? AND status = 'approved'
       AND payload_fingerprint = ? AND approved_payload_fingerprint = ?`,
    )
    .bind(
      runnerTokenId,
      claimHandleHash,
      now,
      now,
      now,
      actionId,
      row.payload_fingerprint,
      row.approved_payload_fingerprint,
    )
    .run();
  if (result.meta?.changes !== 1)
    return json({ error: "action_state_conflict" }, { status: 409 });
  return json({
    action_id: row.action_id,
    action_type: row.action_type,
    exact_scope: parseObject(row.exact_scope),
    preview: parseObject(row.preview),
    proof_requirement: row.proof_requirement,
    payload_fingerprint: row.payload_fingerprint,
    expires_at: row.expires_at,
    claim_handle: claimHandle,
    payload,
  });
}

export async function proveAdminAction(
  context: ActionContext,
  actionId: string,
  proofTokenId: string,
): Promise<Response> {
  const db = requiredDb(context);
  const row = await readAction(db, actionId);
  if (!row) {
    return json({ error: "claimed_action_not_found" }, { status: 404 });
  }
  // A claim records execution_started_at before its payload is released. Proof
  // may arrive after expires_at so an accepted provider result can be recovered
  // without executing the adapter a second time.
  const body = await readBody(context.request);
  const claimHandle = text(body.claim_handle);
  if (!claimHandle || !row.claim_handle_hash) {
    return json({ error: "claim_handle_invalid" }, { status: 401 });
  }
  const claimHandleHash = await hashOpaqueAdminToken(claimHandle);
  if (!constantTimeEqualAdminDigest(claimHandleHash, row.claim_handle_hash)) {
    return json({ error: "claim_handle_invalid" }, { status: 401 });
  }
  const nextState = body.succeeded === true ? "succeeded" : "failed";
  const proofResult = sanitizeProof(object(body.proof), nextState);
  if (proofResult instanceof Response) return proofResult;
  const proof = proofResult;
  const errorCode = boundedErrorCode(body.error_code, nextState);
  if (errorCode instanceof Response) return errorCode;
  const serializedProof = JSON.stringify(proof);
  if (row.status === "succeeded" || row.status === "failed") {
    if (
      row.status === nextState &&
      Boolean(row.claim_handle_used_at) &&
      row.proof_token_id === proofTokenId &&
      row.proof === serializedProof &&
      row.error_code === errorCode
    ) {
      return json({
        action_id: actionId,
        status: nextState,
        proof,
        idempotent: true,
      });
    }
    return json({ error: "action_state_conflict" }, { status: 409 });
  }
  if (row.status !== "claimed" || row.claim_handle_used_at) {
    return json({ error: "action_state_conflict" }, { status: 409 });
  }
  assertAdminActionTransition(row.status, nextState);
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `UPDATE admin_actions SET status = ?, proof = ?, error_code = ?, proof_token_id = ?,
       claim_handle_used_at = ?, completed_at = ?, updated_at = ?
     WHERE action_id = ? AND status = 'claimed' AND claim_handle_used_at IS NULL`,
    )
    .bind(
      nextState,
      serializedProof,
      errorCode,
      proofTokenId,
      now,
      now,
      now,
      actionId,
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

async function verifyActionPayloadIntegrity(
  context: ActionContext,
  row: ActionRow,
): Promise<Record<string, unknown> | Response> {
  try {
    const keyring = await actionKeyring(context);
    const payload = await decryptAdminPayload<Record<string, unknown>>(
      { ciphertext: row.payload_ciphertext, iv: row.payload_iv },
      resolveAdminEncryptionKey(keyring, row.key_version),
    );
    const fingerprint = await fingerprintActionEnvelope({
      domain: row.domain,
      actionType: row.action_type,
      exactScope: parseObject(row.exact_scope),
      preview: parseObject(row.preview),
      payload,
      proofRequirement: row.proof_requirement,
    });
    return constantTimeEqualAdminDigest(fingerprint, row.payload_fingerprint)
      ? payload
      : json({ error: "action_payload_integrity_failed" }, { status: 409 });
  } catch {
    return json({ error: "action_payload_integrity_failed" }, { status: 409 });
  }
}

function fingerprintActionEnvelope(input: {
  domain: unknown;
  actionType: string;
  exactScope: Record<string, unknown>;
  preview: Record<string, unknown>;
  payload: Record<string, unknown>;
  proofRequirement: string;
}): Promise<string> {
  return hashAdminActionPayload({
    domain: input.domain,
    action_type: input.actionType,
    exact_scope: input.exactScope,
    preview: input.preview,
    payload: input.payload,
    proof_requirement: input.proofRequirement,
  });
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
    claim_handle_hash: _claimHandleHash,
    ...safeRow
  } = row;
  return {
    ...safeRow,
    exact_scope: parseObject(row.exact_scope),
    preview: parseObject(row.preview),
    proof: parseObject(row.proof ?? ""),
  };
}

function sanitizeProof(
  proof: Record<string, unknown>,
  state: "succeeded" | "failed",
): Record<string, string> | Response {
  const provider = text(proof.provider);
  const receiptDigest = text(proof.receipt_digest);
  const observedAt = text(proof.observed_at);
  const summary = text(proof.summary).trim();
  const providerState = text(proof.provider_state);
  try {
    assertSanitizedAdminActionMetadata({ provider, summary, providerState });
  } catch {
    return json({ error: "private_proof_metadata_rejected" }, { status: 400 });
  }
  if (!/^[a-z0-9_-]{1,32}$/.test(provider))
    return json({ error: "proof_provider_invalid" }, { status: 400 });
  if (!observedAt || !Number.isFinite(Date.parse(observedAt)))
    return json({ error: "proof_timestamp_invalid" }, { status: 400 });
  if (!summary || summary.length > 240)
    return json({ error: "proof_summary_invalid" }, { status: 400 });
  if (state === "succeeded") {
    if (!/^[A-Za-z0-9_-]{43}$/.test(receiptDigest))
      return json({ error: "proof_receipt_invalid" }, { status: 400 });
    if (providerState !== "accepted")
      return json({ error: "provider_state_invalid" }, { status: 400 });
  } else if (
    !["not_started", "rejected", "unknown", "accepted_unconfirmed"].includes(
      providerState,
    )
  ) {
    return json({ error: "provider_state_invalid" }, { status: 400 });
  }
  return {
    provider,
    receipt_digest: state === "succeeded" ? receiptDigest : "",
    observed_at: new Date(observedAt).toISOString(),
    summary,
    provider_state: providerState,
  };
}

function boundedErrorCode(
  value: unknown,
  state: "succeeded" | "failed",
): string | null | Response {
  const code = text(value);
  if (state === "succeeded")
    return code
      ? json({ error: "error_code_not_allowed" }, { status: 400 })
      : null;
  return /^[a-z0-9_]{1,64}$/.test(code)
    ? code
    : json({ error: "error_code_invalid" }, { status: 400 });
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
