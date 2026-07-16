import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  RegistrationResponseJSON,
  WebAuthnCredential,
} from "@simplewebauthn/server";
import {
  buildPasskeyProofItems,
  emptyPasskeyAuditEvents,
  nextPasskeyStatusAction,
  passkeyAccessRemovalBlockers,
  REQUIRED_PASSKEY_AUDIT_EVENTS,
  type PasskeyAuditEvents,
  type PasskeyProofItem,
  type RequiredPasskeyAuditEvent,
} from "@anipotts/content/admin";

export const PASSKEY_SESSION_COOKIE = "admin_passkey_session";

const SESSION_DAYS = 30;
const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;
const CHALLENGE_MAX_AGE_MS = 10 * 60 * 1000;
const PRODUCTION_RP_ID = "admin.anipotts.com";
const RP_NAME = "anipotts admin";
const EXPECTED_ORIGIN = "https://admin.anipotts.com";
const USER_ID = "ani";
const USER_NAME = "ani@admin.anipotts.com";
const USER_DISPLAY_NAME = "Ani";
const ACCESS_JWT_HEADER = "cf-access-jwt-assertion";

type D1Result<T = unknown> = {
  results?: T[];
  success?: boolean;
  meta?: { changes?: number; [key: string]: unknown };
};

type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
};

export type D1Database = {
  prepare(query: string): D1PreparedStatement;
};

type CredentialRow = {
  id: string;
  user_id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  transports: string;
  device_type: string | null;
  backed_up: number | null;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

type ChallengePurpose = "registration" | "authentication";

type ChallengeRow = {
  id: string;
  purpose: ChallengePurpose;
  challenge: string;
  credential_id: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
};

type SessionRow = {
  id: string;
  token_hash: string;
  credential_id: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
};

type AccessIdentity = {
  verified: boolean;
  hint: string | null;
};

type PasskeyAuditEventRow = {
  event_type: string;
  count: number;
};

export type PasskeyContext = {
  request: Request;
  url: URL;
  locals: App.Locals;
  cookies: {
    get(name: string): { value: string } | undefined;
  };
};

export type PasskeyStatus = {
  available: boolean;
  mode: "ready" | "missing_db";
  credential_count: number;
  audit_count: number;
  has_session: boolean;
  can_register: boolean;
  access_identity_present: boolean;
  access_identity_hint: string | null;
  expected_origin: string;
  expected_rp_id: string;
  current_origin: string;
  audit_events: Record<RequiredPasskeyAuditEvent, number>;
  proof_items: PasskeyProofItem[];
  access_removal_blockers: string[];
  ready_for_access_removal: boolean;
  next_safe_action: string;
};

export type PasskeyActor = {
  id: string;
  display_name: string;
  credential_id_hint: string | null;
};

export function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, {
    ...init,
    headers: {
      "cache-control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

export function handlePasskeyError(error: unknown): Response {
  if (error instanceof Response) return error;
  return json(
    {
      error: "passkey_request_failed",
      detail:
        import.meta.env.DEV && error instanceof Error
          ? error.message
          : "request rejected",
    },
    { status: 400 },
  );
}

export async function getPasskeyStatus(
  context: PasskeyContext,
): Promise<PasskeyStatus> {
  const db = dbFromContext(context);
  const accessIdentity = await resolveAccessIdentity(context);
  if (!db) {
    const auditEvents = emptyPasskeyAuditEvents();
    const blockers = passkeyAccessRemovalBlockers({
      credentialCount: 0,
      hasSession: false,
      auditEvents,
    });
    return {
      available: false,
      mode: "missing_db",
      credential_count: 0,
      audit_count: 0,
      has_session: false,
      can_register: false,
      access_identity_present: accessIdentity.verified,
      access_identity_hint: accessIdentity.hint,
      expected_origin: EXPECTED_ORIGIN,
      expected_rp_id: expectedRpId(context),
      current_origin: context.url.origin,
      audit_events: auditEvents,
      proof_items: buildPasskeyProofItems(0, false, auditEvents),
      access_removal_blockers: blockers,
      ready_for_access_removal: false,
      next_safe_action:
        "deploy with DB binding and apply migration before enrollment",
    };
  }

  let credentialCount = 0;
  let auditCount = 0;
  let auditEvents = emptyPasskeyAuditEvents();
  let session: SessionRow | null = null;
  try {
    credentialCount = await countActiveCredentials(db);
    auditCount = await countAuditEvents(db);
    auditEvents = await readRequiredAuditEvents(db);
    session = await getSession(context, db);
  } catch (error) {
    if (!isMissingPasskeyTable(error)) throw error;
    const missingAuditEvents = emptyPasskeyAuditEvents();
    const blockers = passkeyAccessRemovalBlockers({
      credentialCount: 0,
      hasSession: false,
      auditEvents: missingAuditEvents,
    });
    return {
      available: false,
      mode: "missing_db",
      credential_count: 0,
      audit_count: 0,
      has_session: false,
      can_register: false,
      access_identity_present: accessIdentity.verified,
      access_identity_hint: accessIdentity.hint,
      expected_origin: EXPECTED_ORIGIN,
      expected_rp_id: expectedRpId(context),
      current_origin: context.url.origin,
      audit_events: missingAuditEvents,
      proof_items: buildPasskeyProofItems(0, false, missingAuditEvents),
      access_removal_blockers: blockers,
      ready_for_access_removal: false,
      next_safe_action:
        "apply drizzle/migrations/0006_admin_passkeys.sql before enrollment",
    };
  }
  const canRegister =
    Boolean(session) || (credentialCount === 0 && accessIdentity.verified);
  const blockers = passkeyAccessRemovalBlockers({
    credentialCount,
    hasSession: Boolean(session),
    auditEvents,
  });

  return {
    available: true,
    mode: "ready",
    credential_count: credentialCount,
    audit_count: auditCount,
    has_session: Boolean(session),
    can_register: canRegister,
    access_identity_present: accessIdentity.verified,
    access_identity_hint: accessIdentity.hint,
    expected_origin: EXPECTED_ORIGIN,
    expected_rp_id: expectedRpId(context),
    current_origin: context.url.origin,
    audit_events: auditEvents,
    proof_items: buildPasskeyProofItems(
      credentialCount,
      Boolean(session),
      auditEvents,
    ),
    access_removal_blockers: blockers,
    ready_for_access_removal: blockers.length === 0,
    next_safe_action: nextPasskeyStatusAction({
      hasSession: Boolean(session),
      credentialCount,
      accessIdentityVerified: accessIdentity.verified,
    }),
  };
}

export async function hasActivePasskeySession(
  context: PasskeyContext,
): Promise<boolean> {
  const db = dbFromContext(context);
  if (!db) return false;
  try {
    return Boolean(await getSession(context, db));
  } catch {
    return false;
  }
}

export async function getPasskeyActor(
  context: PasskeyContext,
): Promise<PasskeyActor> {
  const db = dbFromContext(context);
  if (!db) {
    return {
      id: USER_ID,
      display_name: USER_DISPLAY_NAME,
      credential_id_hint: null,
    };
  }

  const session = await getSession(context, db);
  if (!session) {
    throw json(
      {
        error: "passkey_session_required",
        next_safe_action: "authenticate before saving or publishing content",
      },
      { status: 403 },
    );
  }

  return {
    id: USER_ID,
    display_name: USER_DISPLAY_NAME,
    credential_id_hint: credentialHint(session.credential_id),
  };
}

export async function registrationOptions(
  context: PasskeyContext,
): Promise<Response> {
  const db = requiredDb(context);
  const status = await getPasskeyStatus(context);
  if (!status.can_register) {
    return json(
      {
        error: "registration_not_allowed",
        next_safe_action:
          "authenticate first or register while Cloudflare Access identity is present",
      },
      { status: 403 },
    );
  }

  const credentials = await listActiveCredentials(db);
  const rpID = expectedRpId(context);
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userID: new TextEncoder().encode(USER_ID),
    userName: USER_NAME,
    userDisplayName: USER_DISPLAY_NAME,
    attestationType: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "preferred",
      userVerification: "required",
    },
    excludeCredentials: credentials.map((credential) => ({
      id: credential.credential_id,
      transports: parseTransports(credential.transports),
    })),
    timeout: 90_000,
  });

  await storeChallenge(db, "registration", options.challenge);
  return json(options);
}

export async function verifyRegistration(
  context: PasskeyContext,
): Promise<Response> {
  const db = requiredDb(context);
  const body = (await context.request.json()) as RegistrationResponseJSON;
  const challenge = await consumeChallenge(db, "registration");
  const result = await verifyRegistrationResponse({
    response: body,
    expectedChallenge: challenge.challenge,
    expectedOrigin: expectedOrigin(context),
    expectedRPID: expectedRpId(context),
    requireUserVerification: true,
  });

  if (!result.verified) {
    return json(
      { verified: false, error: "registration_verification_failed" },
      { status: 400 },
    );
  }

  const info = result.registrationInfo;
  await db
    .prepare(
      `INSERT INTO admin_passkey_credentials
        (id, user_id, credential_id, public_key, counter, transports, device_type, backed_up, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(credential_id) DO UPDATE SET
        user_id = excluded.user_id,
        public_key = excluded.public_key,
        counter = excluded.counter,
        transports = excluded.transports,
        device_type = excluded.device_type,
        backed_up = excluded.backed_up,
        last_used_at = NULL,
        revoked_at = NULL,
        updated_at = excluded.updated_at`,
    )
    .bind(
      randomId(),
      USER_ID,
      info.credential.id,
      bytesToBase64Url(info.credential.publicKey),
      info.credential.counter,
      JSON.stringify(body.response.transports ?? []),
      info.credentialDeviceType,
      info.credentialBackedUp ? 1 : 0,
      nowIso(),
      nowIso(),
    )
    .run();
  await recordAudit(
    db,
    "passkey.credential.registered",
    info.credential.id,
    "registered platform passkey for admin",
  );

  return json({
    verified: true,
    next_safe_action: "use authenticate to create an app-native session",
  });
}

export async function authenticationOptions(
  context: PasskeyContext,
): Promise<Response> {
  const db = requiredDb(context);
  const credentials = await listActiveCredentials(db);
  if (credentials.length === 0) {
    const revokedCredentials = await countRevokedCredentials(db);
    if (revokedCredentials > 0) {
      await recordAudit(
        db,
        "passkey.authentication.denied",
        null,
        "denied authentication because all registered passkeys are revoked",
      );
    }
    return json(
      {
        error: "no_credentials",
        next_safe_action: "register the first passkey behind Cloudflare Access",
      },
      { status: 409 },
    );
  }

  const options = await generateAuthenticationOptions({
    rpID: expectedRpId(context),
    allowCredentials: credentials.map((credential) => ({
      id: credential.credential_id,
      transports: parseTransports(credential.transports),
    })),
    userVerification: "required",
    timeout: 90_000,
  });

  await storeChallenge(db, "authentication", options.challenge);
  return json(options);
}

export async function verifyAuthentication(
  context: PasskeyContext,
): Promise<Response> {
  const db = requiredDb(context);
  const body = (await context.request.json()) as AuthenticationResponseJSON;
  const credential = await findCredential(db, body.id);
  if (!credential) {
    await recordAudit(
      db,
      "passkey.authentication.denied",
      null,
      "denied authentication for missing or revoked credential",
    );
    return json(
      { verified: false, error: "credential_not_found" },
      { status: 404 },
    );
  }

  const challenge = await consumeChallenge(db, "authentication");
  const result = await verifyAuthenticationResponse({
    response: body,
    expectedChallenge: challenge.challenge,
    expectedOrigin: expectedOrigin(context),
    expectedRPID: expectedRpId(context),
    credential: toWebAuthnCredential(credential),
    requireUserVerification: true,
  });

  if (!result.verified) {
    return json(
      { verified: false, error: "authentication_verification_failed" },
      { status: 400 },
    );
  }

  await db
    .prepare(
      `UPDATE admin_passkey_credentials
       SET counter = ?, device_type = ?, backed_up = ?, last_used_at = ?, updated_at = ?
       WHERE credential_id = ?`,
    )
    .bind(
      result.authenticationInfo.newCounter,
      result.authenticationInfo.credentialDeviceType,
      result.authenticationInfo.credentialBackedUp ? 1 : 0,
      nowIso(),
      nowIso(),
      credential.credential_id,
    )
    .run();

  const token = randomToken();
  const tokenHash = await hashToken(token);
  const expires = new Date(
    Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  ).toISOString();
  await db
    .prepare(
      `INSERT INTO admin_passkey_sessions
        (id, token_hash, credential_id, created_at, expires_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      randomId(),
      tokenHash,
      credential.credential_id,
      nowIso(),
      expires,
      nowIso(),
    )
    .run();
  await recordAudit(
    db,
    "passkey.session.created",
    credential.credential_id,
    "created app-native admin session",
  );

  return json(
    {
      verified: true,
      next_safe_action: "passkey session active",
    },
    { headers: { "set-cookie": sessionCookie(context, token) } },
  );
}

export async function logout(context: PasskeyContext): Promise<Response> {
  const db = dbFromContext(context);
  const token = context.cookies.get(PASSKEY_SESSION_COOKIE)?.value;
  if (db && token) {
    const session = await getSession(context, db);
    const tokenHash = await hashToken(token);
    await db
      .prepare(
        `UPDATE admin_passkey_sessions
         SET revoked_at = ?, updated_at = ?
         WHERE token_hash = ? AND revoked_at IS NULL`,
      )
      .bind(nowIso(), nowIso(), tokenHash)
      .run();
    await recordAudit(
      db,
      "passkey.session.revoked",
      session?.credential_id ?? null,
      session ? "revoked app-native admin session" : "logout without session",
    );
  }

  return json(
    { ok: true, next_safe_action: "passkey session cleared" },
    { headers: { "set-cookie": expiredSessionCookie(context) } },
  );
}

export async function revokeCurrentCredential(
  context: PasskeyContext,
): Promise<Response> {
  const db = requiredDb(context);
  const session = await getSession(context, db);
  if (!session) {
    return json(
      {
        error: "session_required",
        next_safe_action:
          "authenticate with a passkey before revoking the current credential",
      },
      { status: 403 },
    );
  }

  await db
    .prepare(
      `UPDATE admin_passkey_credentials
       SET revoked_at = ?, updated_at = ?
       WHERE credential_id = ? AND revoked_at IS NULL`,
    )
    .bind(nowIso(), nowIso(), session.credential_id)
    .run();

  await db
    .prepare(
      `UPDATE admin_passkey_sessions
       SET revoked_at = ?, updated_at = ?
       WHERE credential_id = ? AND revoked_at IS NULL`,
    )
    .bind(nowIso(), nowIso(), session.credential_id)
    .run();

  await recordAudit(
    db,
    "passkey.credential.revoked",
    session.credential_id,
    "revoked current admin passkey for denial proof",
  );
  await recordAudit(
    db,
    "passkey.session.revoked",
    session.credential_id,
    "revoked app-native admin session during credential revocation",
  );

  return json(
    {
      ok: true,
      next_safe_action:
        "attempt authenticate to record denial, then register a replacement passkey while Cloudflare Access remains active",
    },
    { headers: { "set-cookie": expiredSessionCookie(context) } },
  );
}

export function dbFromContext(context: PasskeyContext): D1Database | null {
  return context.locals.runtime?.env.DB ?? null;
}

function requiredDb(context: PasskeyContext): D1Database {
  const db = dbFromContext(context);
  if (!db) {
    throw json(
      {
        error: "db_binding_missing",
        next_safe_action:
          "deploy with DB binding and apply migration before enrollment",
      },
      { status: 503 },
    );
  }
  return db;
}

async function listActiveCredentials(db: D1Database): Promise<CredentialRow[]> {
  const result = await db
    .prepare(
      `SELECT * FROM admin_passkey_credentials
       WHERE user_id = ? AND revoked_at IS NULL
       ORDER BY created_at ASC`,
    )
    .bind(USER_ID)
    .all<CredentialRow>();
  return result.results ?? [];
}

async function countActiveCredentials(db: D1Database): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS count FROM admin_passkey_credentials
       WHERE user_id = ? AND revoked_at IS NULL`,
    )
    .bind(USER_ID)
    .first<{ count: number }>();
  return Number(row?.count ?? 0);
}

async function countRevokedCredentials(db: D1Database): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS count FROM admin_passkey_credentials
       WHERE user_id = ? AND revoked_at IS NOT NULL`,
    )
    .bind(USER_ID)
    .first<{ count: number }>();
  return Number(row?.count ?? 0);
}

async function countAuditEvents(db: D1Database): Promise<number> {
  const row = await db
    .prepare(`SELECT COUNT(*) AS count FROM admin_passkey_audit`)
    .first<{ count: number }>();
  return Number(row?.count ?? 0);
}

async function readRequiredAuditEvents(
  db: D1Database,
): Promise<PasskeyAuditEvents> {
  const eventCounts = emptyPasskeyAuditEvents();
  const placeholders = REQUIRED_PASSKEY_AUDIT_EVENTS.map(() => "?").join(", ");
  const result = await db
    .prepare(
      `SELECT event_type, COUNT(*) AS count
       FROM admin_passkey_audit
       WHERE event_type IN (${placeholders})
       GROUP BY event_type`,
    )
    .bind(...REQUIRED_PASSKEY_AUDIT_EVENTS)
    .all<PasskeyAuditEventRow>();

  for (const row of result.results ?? []) {
    const eventType = row.event_type as RequiredPasskeyAuditEvent;
    if (REQUIRED_PASSKEY_AUDIT_EVENTS.includes(eventType)) {
      eventCounts[eventType] = Number(row.count ?? 0);
    }
  }

  return eventCounts;
}

async function findCredential(
  db: D1Database,
  credentialId: string,
): Promise<CredentialRow | null> {
  return db
    .prepare(
      `SELECT * FROM admin_passkey_credentials
       WHERE credential_id = ? AND revoked_at IS NULL`,
    )
    .bind(credentialId)
    .first<CredentialRow>();
}

async function storeChallenge(
  db: D1Database,
  purpose: ChallengePurpose,
  challenge: string,
): Promise<void> {
  const expiresAt = new Date(Date.now() + CHALLENGE_MAX_AGE_MS).toISOString();
  await db
    .prepare(
      `INSERT INTO admin_passkey_challenges
        (id, purpose, challenge, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(randomId(), purpose, challenge, nowIso(), expiresAt)
    .run();
}

async function consumeChallenge(
  db: D1Database,
  purpose: ChallengePurpose,
): Promise<ChallengeRow> {
  const row = await db
    .prepare(
      `SELECT * FROM admin_passkey_challenges
       WHERE purpose = ? AND used_at IS NULL AND expires_at > ?
       ORDER BY created_at DESC
       LIMIT 1`,
    )
    .bind(purpose, nowIso())
    .first<ChallengeRow>();

  if (!row) {
    throw json({ error: "challenge_missing_or_expired" }, { status: 400 });
  }

  await db
    .prepare(
      `UPDATE admin_passkey_challenges
       SET used_at = ?
       WHERE id = ? AND used_at IS NULL`,
    )
    .bind(nowIso(), row.id)
    .run();
  return row;
}

async function getSession(
  context: PasskeyContext,
  db: D1Database,
): Promise<SessionRow | null> {
  const token = context.cookies.get(PASSKEY_SESSION_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = await hashToken(token);
  const row = await db
    .prepare(
      `SELECT * FROM admin_passkey_sessions
       WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ?
       LIMIT 1`,
    )
    .bind(tokenHash, nowIso())
    .first<SessionRow>();
  if (!row) return null;
  await db
    .prepare(
      `UPDATE admin_passkey_sessions
       SET last_seen_at = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(nowIso(), nowIso(), row.id)
    .run();
  return row;
}

function toWebAuthnCredential(row: CredentialRow): WebAuthnCredential {
  return {
    id: row.credential_id,
    publicKey: base64UrlToBytes(row.public_key),
    counter: row.counter,
    transports: parseTransports(row.transports),
  };
}

function credentialHint(credentialId: string): string {
  return credentialId.slice(-8);
}

function parseTransports(raw: string): AuthenticatorTransportFuture[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is AuthenticatorTransportFuture => typeof item === "string",
    );
  } catch {
    return [];
  }
}

function expectedOrigin(context: PasskeyContext): string {
  const origin = context.request.headers.get("origin");
  if (origin && isLocalDevOrigin(origin)) return origin;
  return EXPECTED_ORIGIN;
}

function expectedRpId(context: PasskeyContext): string {
  if (isLocalDevOrigin(context.url.origin)) {
    return context.url.hostname;
  }
  return PRODUCTION_RP_ID;
}

async function resolveAccessIdentity(
  context: PasskeyContext,
): Promise<AccessIdentity> {
  if (isLocalDevOrigin(context.url.origin)) {
    return { verified: true, hint: "local-dev" };
  }

  const teamDomain = context.locals.runtime?.env.ACCESS_TEAM_DOMAIN;
  const audience = context.locals.runtime?.env.ACCESS_POLICY_AUD;
  if (!teamDomain || !audience) {
    return { verified: false, hint: null };
  }

  const cfJwt = context.request.headers.get(ACCESS_JWT_HEADER);
  if (!cfJwt) {
    return { verified: false, hint: null };
  }

  try {
    const issuer = teamDomain.replace(/\/$/, "");
    const jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
    const { payload } = await jwtVerify(cfJwt, jwks, {
      issuer,
      audience,
    });
    const email = typeof payload.email === "string" ? payload.email : null;
    if (!email) {
      return { verified: false, hint: null };
    }
    return { verified: true, hint: maskEmail(email) };
  } catch {
    return { verified: false, hint: null };
  }
}

function isLocalDevOrigin(origin: string): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    const hostname = new URL(origin).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "access-user";
  return `${name.slice(0, 2)}***@${domain}`;
}

function sessionCookie(context: PasskeyContext, token: string): string {
  const attributes = [
    `${PASSKEY_SESSION_COOKIE}=${token}`,
    "Path=/",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (usesSecureCookie(context)) attributes.splice(4, 0, "Secure");
  return attributes.join("; ");
}

function expiredSessionCookie(context: PasskeyContext): string {
  const attributes = [
    `${PASSKEY_SESSION_COOKIE}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (usesSecureCookie(context)) attributes.splice(4, 0, "Secure");
  return attributes.join("; ");
}

function usesSecureCookie(context: PasskeyContext): boolean {
  return !isLocalDevOrigin(context.url.origin);
}

async function recordAudit(
  db: D1Database,
  eventType: string,
  credentialId: string | null,
  summary: string,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO admin_passkey_audit
        (id, event_type, credential_id, summary, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(randomId(), eventType, credentialId, summary, nowIso())
    .run();
}

function randomId(): string {
  return crypto.randomUUID();
}

function randomToken(): string {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

async function hashToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return bytesToHex(new Uint8Array(digest));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = value
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function nowIso(): string {
  return new Date().toISOString();
}

function isMissingPasskeyTable(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("admin_passkey_") &&
    error.message.includes("no such table")
  );
}
