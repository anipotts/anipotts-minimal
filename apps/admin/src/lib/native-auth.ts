import {
  ADMIN_MACHINE_TOKEN_SCOPES,
  assertSameOriginMutation,
  canAuthorizeAdminPasswordReplacement,
  createOpaqueAdminToken,
  hasAdminMachineScope,
  hashAdminPasswordWeb,
  hashOpaqueAdminToken,
  isAdminMachineTokenScope,
  isAdminRateLimited,
  isAdminSessionActive,
  validateAdminPasswordCandidate,
  verifyAdminPasswordWeb,
  type AdminMachineTokenScope,
} from "@anipotts/lib/admin";
import { getPasskeyStatus, json, type D1Database } from "./passkey-auth";

export const NATIVE_SESSION_COOKIE = "admin_session";
const USER_ID = "ani";
const SESSION_SECONDS = 30 * 24 * 60 * 60;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

type NativeAuthContext = {
  request: Request;
  url: URL;
  locals: App.Locals;
  cookies: {
    get(name: string): { value: string } | undefined;
    set(name: string, value: string, options: Record<string, unknown>): void;
    delete(name: string, options: Record<string, unknown>): void;
  };
};

type PasswordRow = {
  password_hash: string;
  must_change: number;
  updated_at: string;
};

type SessionRow = {
  id: string;
  auth_method: string;
  credential_ref: string | null;
  created_at: string;
  expires_at: string;
  last_seen_at: string;
  revoked_at: string | null;
};

type MachineTokenRow = {
  id: string;
  name: string;
  scopes: string;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  revoked_at: string | null;
};

export type NativeAuthStatus = {
  available: boolean;
  password_configured: boolean;
  password_replaced: boolean;
  native_session_active: boolean;
  passkey_count: number;
  two_passkeys_ready: boolean;
  ready_for_access_cutover: boolean;
  blockers: string[];
};

export async function getNativeAuthStatus(
  context: NativeAuthContext,
): Promise<NativeAuthStatus> {
  const db = context.locals.runtime?.env.DB;
  if (!db) return unavailableStatus();

  try {
    const [password, session, passkey] = await Promise.all([
      readPassword(db),
      getNativeSession(context, db),
      getPasskeyStatus(context),
    ]);
    const blockers: string[] = [];
    if (!password) blockers.push("password not configured");
    if (password?.must_change !== 0)
      blockers.push("temporary password not replaced");
    if (passkey.credential_count < 2)
      blockers.push("two independent passkeys required");
    if (!passkey.ready_for_access_removal)
      blockers.push(...passkey.access_removal_blockers);
    return {
      available: true,
      password_configured: Boolean(password),
      password_replaced: password?.must_change === 0,
      native_session_active: Boolean(session),
      passkey_count: passkey.credential_count,
      two_passkeys_ready: passkey.credential_count >= 2,
      ready_for_access_cutover: blockers.length === 0,
      blockers: [...new Set(blockers)],
    };
  } catch {
    return unavailableStatus();
  }
}

export async function hasActiveNativeSession(
  context: NativeAuthContext,
): Promise<boolean> {
  const db = context.locals.runtime?.env.DB;
  if (!db) return false;
  try {
    return Boolean(await getNativeSession(context, db));
  } catch {
    return false;
  }
}

export async function bootstrapPassword(
  context: NativeAuthContext,
): Promise<Response> {
  assertSameOriginMutation(context.request);
  const db = requiredDb(context);
  if (await readPassword(db))
    return json({ error: "password_already_configured" }, { status: 409 });
  const passkey = await getPasskeyStatus(context);
  if (!passkey.access_identity_present && !import.meta.env.DEV) {
    return json({ error: "access_identity_required" }, { status: 403 });
  }
  const body = await readJson(context.request);
  const password = stringField(body, "password");
  if (password.length < 8) {
    return json({ error: "temporary_password_too_short" }, { status: 400 });
  }
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO admin_password_credentials
        (user_id, password_hash, must_change, created_at, updated_at)
       VALUES (?, ?, 1, ?, ?)`,
    )
    .bind(USER_ID, await hashAdminPasswordWeb(password), now, now)
    .run();
  await recordAudit(
    db,
    "password.bootstrap",
    "password",
    null,
    "temporary password configured behind Access",
  );
  return json({ ok: true, must_change: true });
}

export async function loginWithPassword(
  context: NativeAuthContext,
): Promise<Response> {
  assertSameOriginMutation(context.request);
  const db = requiredDb(context);
  const actorKey = await requestActorKey(context.request);
  const attempt = await readAttempt(db, actorKey);
  const now = Date.now();
  if (isAdminRateLimited(attempt?.locked_until, new Date(now))) {
    await recordAudit(
      db,
      "password.denied",
      "password",
      null,
      "password login rate limited",
    );
    return json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await readJson(context.request);
  const password = stringField(body, "password");
  const row = await readPassword(db);
  if (!row || !(await verifyAdminPasswordWeb(password, row.password_hash))) {
    await recordFailure(db, actorKey, attempt);
    await recordAudit(
      db,
      "password.denied",
      "password",
      null,
      "password login denied",
    );
    return json({ error: "invalid_credentials" }, { status: 401 });
  }

  await db
    .prepare(`DELETE FROM admin_auth_attempts WHERE actor_key = ?`)
    .bind(actorKey)
    .run();
  const token = createOpaqueAdminToken();
  const sessionId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();
  await db
    .prepare(
      `INSERT INTO admin_auth_sessions
        (id, token_hash, user_id, auth_method, created_at, expires_at, last_seen_at)
       VALUES (?, ?, ?, 'password', ?, ?, ?)`,
    )
    .bind(
      sessionId,
      await hashOpaqueAdminToken(token),
      USER_ID,
      createdAt,
      expiresAt,
      createdAt,
    )
    .run();
  await recordAudit(
    db,
    "password.login",
    "password",
    null,
    "password session created",
  );
  context.cookies.set(
    NATIVE_SESSION_COOKIE,
    token,
    cookieOptions(SESSION_SECONDS),
  );
  return json({ ok: true, must_change: row.must_change !== 0 });
}

export async function logoutNativeSession(
  context: NativeAuthContext,
): Promise<Response> {
  assertSameOriginMutation(context.request);
  const db = requiredDb(context);
  const token = context.cookies.get(NATIVE_SESSION_COOKIE)?.value;
  if (token) {
    await db
      .prepare(
        `UPDATE admin_auth_sessions SET revoked_at = ? WHERE token_hash = ?`,
      )
      .bind(new Date().toISOString(), await hashOpaqueAdminToken(token))
      .run();
  }
  context.cookies.delete(NATIVE_SESSION_COOKIE, { path: "/" });
  await recordAudit(
    db,
    "session.revoked",
    "password",
    null,
    "current native session revoked",
  );
  return json({ ok: true });
}

export async function revokeNativeSession(
  context: NativeAuthContext,
  sessionId: string,
): Promise<Response> {
  assertSameOriginMutation(context.request);
  const db = requiredDb(context);
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `UPDATE admin_auth_sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL`,
    )
    .bind(now, sessionId)
    .run();
  if (result.meta?.changes !== 1) {
    return json({ error: "session_not_found" }, { status: 404 });
  }
  await recordAudit(
    db,
    "session.revoked",
    "password",
    sessionId,
    "native session revoked",
  );
  return json({ ok: true });
}

export async function changePassword(
  context: NativeAuthContext,
): Promise<Response> {
  assertSameOriginMutation(context.request);
  const db = requiredDb(context);
  const [nativeSession, passkeyStatus, current] = await Promise.all([
    getNativeSession(context, db),
    getPasskeyStatus(context),
    readPassword(db),
  ]);
  if (!nativeSession && !passkeyStatus.has_session) {
    return json({ error: "authenticated_session_required" }, { status: 403 });
  }
  if (!current)
    return json({ error: "password_not_configured" }, { status: 409 });

  const body = await readJson(context.request);
  const password = stringField(body, "password");
  const currentPassword = stringField(body, "current_password");
  const currentPasswordVerified = passkeyStatus.has_session
    ? false
    : await verifyAdminPasswordWeb(currentPassword, current.password_hash);
  if (
    !canAuthorizeAdminPasswordReplacement({
      hasNativeSession: Boolean(nativeSession),
      hasPasskeySession: passkeyStatus.has_session,
      currentPasswordVerified,
    })
  ) {
    return json({ error: "current_password_invalid" }, { status: 401 });
  }
  const validation = validateAdminPasswordCandidate(password);
  if (!validation.success)
    return json(
      { error: "password_policy", detail: validation.error },
      { status: 400 },
    );

  const now = new Date().toISOString();
  await db
    .prepare(
      `UPDATE admin_password_credentials
       SET password_hash = ?, must_change = 0, updated_at = ?
       WHERE user_id = ?`,
    )
    .bind(await hashAdminPasswordWeb(password), now, USER_ID)
    .run();
  await db
    .prepare(
      `UPDATE admin_auth_sessions SET revoked_at = ? WHERE revoked_at IS NULL`,
    )
    .bind(now)
    .run();
  context.cookies.delete(NATIVE_SESSION_COOKIE, { path: "/" });
  await recordAudit(
    db,
    "password.replaced",
    "password",
    null,
    "password replaced and sessions revoked",
  );
  return json({ ok: true, reauthenticate: true });
}

export async function readSecurityState(
  context: NativeAuthContext,
): Promise<Response> {
  const db = requiredDb(context);
  const [status, sessions, tokens, audit] = await Promise.all([
    getNativeAuthStatus(context),
    db
      .prepare(
        `SELECT id, auth_method, credential_ref, created_at, expires_at, last_seen_at
       FROM admin_auth_sessions WHERE revoked_at IS NULL AND expires_at > ?
       ORDER BY last_seen_at DESC LIMIT 30`,
      )
      .bind(new Date().toISOString())
      .all<SessionRow>(),
    db
      .prepare(
        `SELECT id, name, scopes, created_at, expires_at, last_used_at, revoked_at
       FROM admin_machine_tokens ORDER BY created_at DESC LIMIT 30`,
      )
      .all<MachineTokenRow>(),
    db
      .prepare(
        `SELECT event_type, auth_method, credential_ref, summary, created_at
       FROM admin_auth_audit ORDER BY created_at DESC LIMIT 50`,
      )
      .all(),
  ]);
  return json({
    status,
    sessions: sessions.results ?? [],
    tokens: (tokens.results ?? []).map((row) => ({
      ...row,
      scopes: parseScopes(row.scopes),
    })),
    audit: audit.results ?? [],
    allowed_scopes: ADMIN_MACHINE_TOKEN_SCOPES,
  });
}

export async function createMachineToken(
  context: NativeAuthContext,
): Promise<Response> {
  assertSameOriginMutation(context.request);
  const db = requiredDb(context);
  const body = await readJson(context.request);
  const name = stringField(body, "name").trim();
  const scopes = Array.isArray(body.scopes)
    ? body.scopes.filter(isAdminMachineTokenScope)
    : [];
  if (!name || scopes.length === 0)
    return json({ error: "name_and_scopes_required" }, { status: 400 });
  const token = createOpaqueAdminToken();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO admin_machine_tokens
        (id, name, token_hash, scopes, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      name,
      await hashOpaqueAdminToken(token),
      JSON.stringify(scopes),
      now,
    )
    .run();
  await recordAudit(
    db,
    "machine_token.created",
    "machine_token",
    id,
    "scoped machine token created",
  );
  return json({ id, token, scopes, shown_once: true }, { status: 201 });
}

export async function revokeMachineToken(
  context: NativeAuthContext,
  tokenId: string,
): Promise<Response> {
  assertSameOriginMutation(context.request);
  const db = requiredDb(context);
  await db
    .prepare(
      `UPDATE admin_machine_tokens SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL`,
    )
    .bind(new Date().toISOString(), tokenId)
    .run();
  await recordAudit(
    db,
    "machine_token.revoked",
    "machine_token",
    tokenId,
    "machine token revoked",
  );
  return json({ ok: true });
}

export async function requireMachineToken(
  context: { request: Request; locals: App.Locals },
  scope: AdminMachineTokenScope,
): Promise<{ id: string; name: string } | Response> {
  const authorization = context.request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer "))
    return json({ error: "bearer_token_required" }, { status: 401 });
  const token = authorization.slice(7).trim();
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return json({ error: "invalid_machine_token" }, { status: 401 });
  }
  const db = context.locals.runtime?.env.DB;
  if (!db) return json({ error: "db_binding_missing" }, { status: 503 });
  const tokenHash = await hashOpaqueAdminToken(token);
  const row = await db
    .prepare(
      `SELECT id, name, scopes FROM admin_machine_tokens
       WHERE token_hash = ? AND revoked_at IS NULL
         AND (expires_at IS NULL OR expires_at > ?)`,
    )
    .bind(tokenHash, new Date().toISOString())
    .first<{ id: string; name: string; scopes: string }>();
  if (!row || !hasAdminMachineScope(parseScopes(row.scopes), scope)) {
    return json(
      { error: "insufficient_machine_scope", required_scope: scope },
      { status: 401 },
    );
  }
  await db
    .prepare(`UPDATE admin_machine_tokens SET last_used_at = ? WHERE id = ?`)
    .bind(new Date().toISOString(), row.id)
    .run();
  return { id: row.id, name: row.name };
}

function requiredDb(context: NativeAuthContext): D1Database {
  const db = context.locals.runtime?.env.DB;
  if (!db) throw json({ error: "db_binding_missing" }, { status: 503 });
  return db;
}

async function readPassword(db: D1Database): Promise<PasswordRow | null> {
  return db
    .prepare(
      `SELECT password_hash, must_change, updated_at FROM admin_password_credentials WHERE user_id = ?`,
    )
    .bind(USER_ID)
    .first<PasswordRow>();
}

async function getNativeSession(
  context: NativeAuthContext,
  db: D1Database,
): Promise<SessionRow | null> {
  const token = context.cookies.get(NATIVE_SESSION_COOKIE)?.value;
  if (!token) return null;
  const now = new Date().toISOString();
  const row = await db
    .prepare(
      `SELECT id, auth_method, credential_ref, created_at, expires_at, last_seen_at, revoked_at
       FROM admin_auth_sessions
       WHERE token_hash = ?`,
    )
    .bind(await hashOpaqueAdminToken(token))
    .first<SessionRow>();
  if (
    !row ||
    !isAdminSessionActive(
      { expiresAt: row.expires_at, revokedAt: row.revoked_at },
      new Date(now),
    )
  ) {
    return null;
  }
  await db
    .prepare(`UPDATE admin_auth_sessions SET last_seen_at = ? WHERE id = ?`)
    .bind(now, row.id)
    .run();
  return row;
}

async function requestActorKey(request: Request): Promise<string> {
  const source = `${request.headers.get("cf-connecting-ip") ?? "local"}:${request.headers.get("user-agent") ?? "unknown"}`;
  return hashOpaqueAdminToken(source);
}

async function readAttempt(db: D1Database, actorKey: string) {
  return db
    .prepare(
      `SELECT failure_count, window_started_at, locked_until FROM admin_auth_attempts WHERE actor_key = ?`,
    )
    .bind(actorKey)
    .first<{
      failure_count: number;
      window_started_at: string;
      locked_until: string | null;
    }>();
}

async function recordFailure(
  db: D1Database,
  actorKey: string,
  existing: Awaited<ReturnType<typeof readAttempt>>,
) {
  const now = new Date();
  const windowExpired =
    !existing ||
    Date.parse(existing.window_started_at) + FAILURE_WINDOW_MS <= now.getTime();
  const count = windowExpired ? 1 : Number(existing.failure_count) + 1;
  const lockedUntil =
    count >= MAX_FAILURES
      ? new Date(now.getTime() + FAILURE_WINDOW_MS).toISOString()
      : null;
  await db
    .prepare(
      `INSERT INTO admin_auth_attempts
      (actor_key, failure_count, window_started_at, locked_until, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(actor_key) DO UPDATE SET failure_count = excluded.failure_count,
       window_started_at = excluded.window_started_at, locked_until = excluded.locked_until,
       updated_at = excluded.updated_at`,
    )
    .bind(
      actorKey,
      count,
      windowExpired ? now.toISOString() : existing?.window_started_at,
      lockedUntil,
      now.toISOString(),
    )
    .run();
}

async function recordAudit(
  db: D1Database,
  eventType: string,
  method: string | null,
  credentialRef: string | null,
  summary: string,
) {
  await db
    .prepare(
      `INSERT INTO admin_auth_audit
      (id, event_type, auth_method, credential_ref, summary, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      eventType,
      method,
      credentialRef,
      summary,
      new Date().toISOString(),
    )
    .run();
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  return (await request.json().catch(() => ({}))) as Record<string, unknown>;
}

function stringField(body: Record<string, unknown>, key: string): string {
  return typeof body[key] === "string" ? body[key] : "";
}

function parseScopes(value: string): AdminMachineTokenScope[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isAdminMachineTokenScope) : [];
  } catch {
    return [];
  }
}

function cookieOptions(maxAge: number) {
  return {
    path: "/",
    httpOnly: true,
    secure: !import.meta.env.DEV,
    sameSite: "strict" as const,
    maxAge,
  };
}

function unavailableStatus(): NativeAuthStatus {
  return {
    available: false,
    password_configured: false,
    password_replaced: false,
    native_session_active: false,
    passkey_count: 0,
    two_passkeys_ready: false,
    ready_for_access_cutover: false,
    blockers: ["native auth migration or D1 binding unavailable"],
  };
}
