import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import {
  ADMIN_RECOVERY_SESSION_SECONDS,
  adminJson,
  adminSessionCookie,
  applyAdminSetCookies,
  assertExactOrigin,
  createAdminSession,
  hashToken,
  nowIso,
  randomToken,
  recordAdminAudit,
  requireAdminDb,
  requireAdminMutation,
  requireAdminSessionAction,
  revokeAllUserAccess,
  type AdminAuthContext,
  type AdminPrincipal,
} from "./admin-auth";
import {
  beginPasskeyRegistration,
  insertPasskeyCredential,
  verifyPasskeyRegistration,
} from "./passkey-auth";
import { notifyAdminSecurityEvent } from "./security-notifications";

const GOOGLE_AUTHORIZATION_ENDPOINT =
  "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const RECOVERY_CALLBACK_PATH = "/api/admin/recovery/google/callback";
const RECOVERY_REQUEST_SECONDS = 10 * 60;
const GOOGLE_FRESH_AUTH_SECONDS = 5 * 60;

export const RECOVERY_VERIFIER_COOKIE = "__Host-admin_recovery_verifier";

type RecoveryRequestRow = {
  id: string;
  state_hash: string;
  verifier_hash: string;
  nonce_hash: string;
  redirect_uri: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
};

type ExternalIdentityRow = {
  id: string;
  user_id: string;
  role: "owner" | "operator" | "viewer";
  status: "pending" | "active" | "revoked";
};

type GoogleTokenResponse = {
  id_token?: unknown;
  error?: unknown;
};

export async function startGoogleRecovery(
  context: AdminAuthContext,
): Promise<Response> {
  assertExactOrigin(context.request, context.url);
  const db = requireAdminDb(context);
  const clientId = context.locals.runtime?.env.ADMIN_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw adminJson(
      { error: "google_recovery_not_configured" },
      { status: 503 },
    );
  }

  const state = randomToken(32);
  const verifier = randomToken(48);
  const nonce = randomToken(32);
  const redirectUri = recoveryRedirectUri(context.url);
  const createdAt = nowIso();
  const expiresAt = new Date(
    Date.now() + RECOVERY_REQUEST_SECONDS * 1000,
  ).toISOString();
  await db
    .prepare(
      `INSERT INTO admin_recovery_requests
        (id, state_hash, verifier_hash, nonce_hash, redirect_uri,
         created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      await hashToken(state),
      await hashToken(verifier),
      await hashToken(nonce),
      redirectUri,
      createdAt,
      expiresAt,
    )
    .run();

  const authorizationUrl = await buildGoogleAuthorizationUrl({
    clientId,
    redirectUri,
    state,
    nonce,
    verifier,
  });
  await recordAdminAudit(db, {
    eventType: "admin.recovery.started",
    summary: "started owner-only Google recovery request",
  });
  return applyAdminSetCookies(
    adminJson({ authorization_url: authorizationUrl }),
    [recoveryVerifierCookie(verifier)],
  );
}

export async function finishGoogleRecovery(
  context: AdminAuthContext,
): Promise<Response> {
  const db = requireAdminDb(context);
  const clientId = context.locals.runtime?.env.ADMIN_GOOGLE_CLIENT_ID;
  const clientSecret = context.locals.runtime?.env.ADMIN_GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw adminJson(
      { error: "google_recovery_not_configured" },
      { status: 503 },
    );
  }
  const code = context.url.searchParams.get("code") ?? "";
  const state = context.url.searchParams.get("state") ?? "";
  const verifier = context.cookies.get(RECOVERY_VERIFIER_COOKIE)?.value ?? "";
  if (!code || !state || !verifier) {
    throw adminJson({ error: "recovery_callback_invalid" }, { status: 400 });
  }

  const request = await db
    .prepare(
      `SELECT * FROM admin_recovery_requests
       WHERE state_hash = ? AND used_at IS NULL AND expires_at > ? LIMIT 1`,
    )
    .bind(await hashToken(state), nowIso())
    .first<RecoveryRequestRow>();
  if (!request || request.verifier_hash !== (await hashToken(verifier))) {
    throw adminJson({ error: "recovery_state_invalid" }, { status: 400 });
  }
  const lock = await db
    .prepare(
      `UPDATE admin_recovery_requests SET used_at = ?
       WHERE id = ? AND used_at IS NULL AND expires_at > ?`,
    )
    .bind(nowIso(), request.id, nowIso())
    .run();
  if (resultChanges(lock) !== 1) {
    throw adminJson({ error: "recovery_request_replayed" }, { status: 409 });
  }

  const idToken = await exchangeGoogleCode({
    code,
    verifier,
    redirectUri: request.redirect_uri,
    clientId,
    clientSecret,
  });
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: GOOGLE_ISSUERS,
    audience: clientId,
  });
  await validateGoogleClaims(payload, request.nonce_hash);
  const subjectHash = await hashToken(payload.sub!);
  const identity = await db
    .prepare(
      `SELECT i.id, i.user_id, u.role, u.status
       FROM admin_external_identities i
       JOIN admin_users u ON u.id = i.user_id
       WHERE i.provider = 'google'
         AND i.subject_hash = ?
         AND i.revoked_at IS NULL
       LIMIT 1`,
    )
    .bind(subjectHash)
    .first<ExternalIdentityRow>();
  if (!identity || identity.role !== "owner" || identity.status !== "active") {
    await recordAdminAudit(db, {
      eventType: "admin.recovery.denied",
      outcome: "denied",
      summary: "denied Google recovery for non-allowlisted subject",
    });
    throw adminJson({ error: "recovery_identity_denied" }, { status: 403 });
  }

  const created = await createAdminSession(db, {
    userId: identity.user_id,
    authMethod: "google_recovery",
    restriction: "recovery",
    lifetimeSeconds: ADMIN_RECOVERY_SESSION_SECONDS,
  });
  await recordAdminAudit(db, {
    eventType: "admin.recovery.google_verified",
    userId: identity.user_id,
    sessionId: created.sessionId,
    summary: "verified owner Google subject into restricted recovery session",
  });

  const response = Response.redirect(
    new URL("/auth/recover/passkey", context.url.origin),
    303,
  );
  return applyAdminSetCookies(response, [
    adminSessionCookie(created.token),
    expiredRecoveryVerifierCookie(),
  ]);
}

export async function recoveryRegistrationOptions(
  context: AdminAuthContext,
): Promise<Response> {
  const principal = await requireRecoverySession(context);
  return adminJson(
    await beginPasskeyRegistration(context, {
      purpose: "recovery_registration",
      userId: principal.userId,
      userName: "ani@admin.anipotts.com",
      displayName: principal.displayName,
      recoverySessionId: principal.sessionId,
    }),
  );
}

export async function verifyRecoveryRegistration(
  context: AdminAuthContext,
): Promise<Response> {
  const principal = await requireRecoverySession(context);
  const db = requireAdminDb(context);
  const verified = await verifyPasskeyRegistration(
    context,
    "recovery_registration",
  );
  if (
    verified.challenge.user_id !== principal.userId ||
    verified.challenge.recovery_session_id !== principal.sessionId
  ) {
    throw adminJson({ error: "recovery_challenge_mismatch" }, { status: 403 });
  }

  await insertPasskeyCredential(db, {
    userId: principal.userId,
    verified,
    createdBySessionId: principal.sessionId,
    label: "recovery passkey",
  });
  await revokeAllUserAccess(db, principal.userId, verified.credential.id);
  const cleanSession = await createAdminSession(db, {
    userId: principal.userId,
    credentialId: verified.credential.id,
    authMethod: "passkey",
    stepUpAt: nowIso(),
  });
  await recordAdminAudit(db, {
    eventType: "admin.recovery.completed",
    userId: principal.userId,
    sessionId: cleanSession.sessionId,
    credentialId: verified.credential.id,
    summary: "completed owner recovery and revoked prior owner access",
  });
  await recordAdminAudit(db, {
    eventType: "passkey.credential.registered",
    userId: principal.userId,
    sessionId: cleanSession.sessionId,
    credentialId: verified.credential.id,
    summary: "registered replacement owner passkey after recovery",
  });
  await notifyAdminSecurityEvent(context, {
    db,
    userId: principal.userId,
    eventType: "owner_recovery_completed",
    summary: "owner recovery completed and prior admin access was revoked",
  });

  return applyAdminSetCookies(
    adminJson({
      ok: true,
      csrf_token: cleanSession.csrfToken,
      next_safe_action: "recovery complete",
    }),
    [adminSessionCookie(cleanSession.token), expiredRecoveryVerifierCookie()],
  );
}

export async function bootstrapGoogleOwnerSubject(
  context: AdminAuthContext,
): Promise<Response> {
  const principal = await requireAdminMutation(context, "identity:manage");
  if (principal.role !== "owner") {
    throw adminJson({ error: "owner_required" }, { status: 403 });
  }
  const db = requireAdminDb(context);
  const body = (await context.request.json().catch(() => null)) as {
    subject?: unknown;
  } | null;
  if (!body || typeof body.subject !== "string" || !body.subject.trim()) {
    throw adminJson({ error: "google_subject_required" }, { status: 400 });
  }
  const subjectHash = await hashToken(body.subject.trim());
  const now = nowIso();
  await db
    .prepare(
      `INSERT INTO admin_external_identities
        (id, user_id, provider, subject_hash, created_at, verified_at)
       VALUES (?, ?, 'google', ?, ?, ?)
       ON CONFLICT(provider, subject_hash) DO UPDATE SET
         user_id = excluded.user_id,
         verified_at = excluded.verified_at,
         revoked_at = NULL`,
    )
    .bind(crypto.randomUUID(), principal.userId, subjectHash, now, now)
    .run();
  await recordAdminAudit(db, {
    eventType: "admin.recovery.identity_bootstrapped",
    userId: principal.userId,
    sessionId: principal.sessionId,
    credentialId: principal.credentialId,
    summary: "allowlisted owner Google subject hash",
  });
  return adminJson({ ok: true });
}

export async function buildGoogleAuthorizationUrl(input: {
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
  verifier: string;
}): Promise<string> {
  const url = new URL(GOOGLE_AUTHORIZATION_ENDPOINT);
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid");
  url.searchParams.set("state", input.state);
  url.searchParams.set("nonce", input.nonce);
  url.searchParams.set("code_challenge", await pkceChallenge(input.verifier));
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "login");
  url.searchParams.set("max_age", "0");
  return url.toString();
}

export async function validateGoogleClaims(
  payload: JWTPayload,
  expectedNonceHash: string,
  now = Date.now(),
): Promise<void> {
  if (!payload.sub || typeof payload.sub !== "string") {
    throw adminJson({ error: "google_subject_missing" }, { status: 400 });
  }
  if (!payload.nonce || typeof payload.nonce !== "string") {
    throw adminJson({ error: "google_nonce_missing" }, { status: 400 });
  }
  if (!payload.auth_time || typeof payload.auth_time !== "number") {
    throw adminJson({ error: "google_auth_time_missing" }, { status: 400 });
  }
  const authTimeMs = payload.auth_time * 1000;
  if (authTimeMs > now || now - authTimeMs > GOOGLE_FRESH_AUTH_SECONDS * 1000) {
    throw adminJson({ error: "google_auth_not_fresh" }, { status: 403 });
  }
  if ((await hashToken(payload.nonce)) !== expectedNonceHash) {
    throw adminJson({ error: "google_nonce_invalid" }, { status: 400 });
  }
}

async function requireRecoverySession(
  context: AdminAuthContext,
): Promise<AdminPrincipal> {
  const principal = await requireAdminSessionAction(context);
  if (
    principal.role !== "owner" ||
    principal.authMethod !== "google_recovery" ||
    principal.restriction !== "recovery"
  ) {
    throw adminJson({ error: "recovery_session_required" }, { status: 403 });
  }
  return principal;
}

async function exchangeGoogleCode(input: {
  code: string;
  verifier: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
}): Promise<string> {
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      code_verifier: input.verifier,
      client_id: input.clientId,
      client_secret: input.clientSecret,
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const body = (await response
    .json()
    .catch(() => null)) as GoogleTokenResponse | null;
  if (!response.ok || !body || typeof body.id_token !== "string") {
    throw adminJson({ error: "google_token_exchange_failed" }, { status: 400 });
  }
  return body.id_token;
}

function recoveryRedirectUri(url: URL): string {
  if (
    import.meta.env.DEV &&
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  ) {
    return `${url.origin}${RECOVERY_CALLBACK_PATH}`;
  }
  return `https://admin.anipotts.com${RECOVERY_CALLBACK_PATH}`;
}

async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return bytesToBase64Url(new Uint8Array(digest));
}

function recoveryVerifierCookie(verifier: string): string {
  return [
    `${RECOVERY_VERIFIER_COOKIE}=${verifier}`,
    "Path=/",
    `Max-Age=${RECOVERY_REQUEST_SECONDS}`,
    "Secure",
    "HttpOnly",
    "SameSite=Lax",
  ].join("; ");
}

function expiredRecoveryVerifierCookie(): string {
  return [
    `${RECOVERY_VERIFIER_COOKIE}=`,
    "Path=/",
    "Max-Age=0",
    "Secure",
    "HttpOnly",
    "SameSite=Lax",
  ].join("; ");
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function resultChanges(result: { meta?: unknown }): number {
  return Number(
    (result.meta as { changes?: number } | undefined)?.changes ?? 1,
  );
}
