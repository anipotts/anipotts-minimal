import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  RegistrationResponseJSON,
  WebAuthnCredential,
} from "@simplewebauthn/server";
import type { HTTPEvent } from "vinxi/http";
import { getCookie, getRequestHeader, getWebRequest } from "vinxi/http";

export const PASSKEY_SESSION_COOKIE = "admin_passkey_session";
const SESSION_DAYS = 30;
const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;
const CHALLENGE_MAX_AGE_MS = 10 * 60 * 1000;
const RP_ID = "admin.anipotts.com";
const RP_NAME = "anipotts admin";
const EXPECTED_ORIGIN = "https://admin.anipotts.com";
const LOCAL_ORIGIN = "http://localhost:3001";
const USER_ID = "ani";
const USER_NAME = "ani@admin.anipotts.com";
const USER_DISPLAY_NAME = "Ani";

type D1Result<T = unknown> = {
  results?: T[];
  success?: boolean;
  meta?: unknown;
};

type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
};

export type D1Database = {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
};

type CloudflareEnv = {
  DB?: D1Database;
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

export type PasskeyStatus = {
  available: boolean;
  mode: "ready" | "missing_db";
  credential_count: number;
  has_session: boolean;
  can_register: boolean;
  access_identity_present: boolean;
  access_identity_hint: string | null;
  next_safe_action: string;
};

export function dbFromEvent(event: HTTPEvent): D1Database | null {
  const context = (event.context ?? {}) as {
    cloudflare?: { env?: CloudflareEnv };
    _platform?: { cloudflare?: { env?: CloudflareEnv } };
  };
  const globalEnv = (
    globalThis as typeof globalThis & { __env__?: CloudflareEnv }
  ).__env__;
  return (
    context.cloudflare?.env?.DB ??
    context._platform?.cloudflare?.env?.DB ??
    globalEnv?.DB ??
    null
  );
}

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
      detail: error instanceof Error ? error.message : "unknown error",
    },
    { status: 400 },
  );
}

export async function getPasskeyStatus(
  event: HTTPEvent,
): Promise<PasskeyStatus> {
  const db = dbFromEvent(event);
  const accessIdentity = accessIdentityHint(event);
  if (!db) {
    return {
      available: false,
      mode: "missing_db",
      credential_count: 0,
      has_session: false,
      can_register: false,
      access_identity_present: Boolean(accessIdentity),
      access_identity_hint: accessIdentity,
      next_safe_action:
        "deploy with DB binding and apply migration before enrollment",
    };
  }

  const credentialCount = await countActiveCredentials(db);
  const session = await getSession(event, db);
  const canRegister =
    Boolean(session) || (credentialCount === 0 && Boolean(accessIdentity));

  return {
    available: true,
    mode: "ready",
    credential_count: credentialCount,
    has_session: Boolean(session),
    can_register: canRegister,
    access_identity_present: Boolean(accessIdentity),
    access_identity_hint: accessIdentity,
    next_safe_action: session
      ? "passkey session active behind Cloudflare Access"
      : "register the first passkey while Cloudflare Access is still active",
  };
}

export async function registrationOptions(event: HTTPEvent): Promise<Response> {
  const db = requiredDb(event);
  const status = await getPasskeyStatus(event);
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
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
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

export async function verifyRegistration(event: HTTPEvent): Promise<Response> {
  const db = requiredDb(event);
  const body = (await getWebRequest().json()) as RegistrationResponseJSON;
  const challenge = await consumeChallenge(db, "registration");
  const result = await verifyRegistrationResponse({
    response: body,
    expectedChallenge: challenge.challenge,
    expectedOrigin: expectedOrigin(event),
    expectedRPID: RP_ID,
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
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

  return json({
    verified: true,
    next_safe_action:
      "use authenticate to create an app-native passkey session",
  });
}

export async function authenticationOptions(
  event: HTTPEvent,
): Promise<Response> {
  const db = requiredDb(event);
  const credentials = await listActiveCredentials(db);
  if (credentials.length === 0) {
    return json(
      {
        error: "no_credentials",
        next_safe_action: "register the first passkey behind Cloudflare Access",
      },
      { status: 409 },
    );
  }

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
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
  event: HTTPEvent,
): Promise<Response> {
  const db = requiredDb(event);
  const body = (await getWebRequest().json()) as AuthenticationResponseJSON;
  const credential = await findCredential(db, body.id);
  if (!credential) {
    return json(
      { verified: false, error: "credential_not_found" },
      { status: 404 },
    );
  }
  const challenge = await consumeChallenge(db, "authentication");
  const result = await verifyAuthenticationResponse({
    response: body,
    expectedChallenge: challenge.challenge,
    expectedOrigin: expectedOrigin(event),
    expectedRPID: RP_ID,
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

  return json(
    {
      verified: true,
      next_safe_action:
        "passkey session active; Cloudflare Access remains the outer gate",
    },
    { headers: { "set-cookie": sessionCookie(token) } },
  );
}

export async function logout(event: HTTPEvent): Promise<Response> {
  const db = dbFromEvent(event);
  const token = getCookie(PASSKEY_SESSION_COOKIE);
  if (db && token) {
    const tokenHash = await hashToken(token);
    await db
      .prepare(
        `UPDATE admin_passkey_sessions
         SET revoked_at = ?, updated_at = ?
         WHERE token_hash = ? AND revoked_at IS NULL`,
      )
      .bind(nowIso(), nowIso(), tokenHash)
      .run();
  }
  return json(
    { ok: true, next_safe_action: "passkey session cleared" },
    { headers: { "set-cookie": expiredSessionCookie() } },
  );
}

function requiredDb(event: HTTPEvent): D1Database {
  const db = dbFromEvent(event);
  if (!db) {
    throw json(
      {
        error: "db_binding_missing",
        next_safe_action: "deploy with DB binding and apply migration before enrollment",
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
    throw new Response("challenge missing or expired", { status: 400 });
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
  event: HTTPEvent,
  db: D1Database,
): Promise<SessionRow | null> {
  void event;
  const token = getCookie(PASSKEY_SESSION_COOKIE);
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

function expectedOrigin(event: HTTPEvent): string {
  void event;
  const origin = getRequestHeader("origin");
  if (origin === LOCAL_ORIGIN && import.meta.env.DEV) return LOCAL_ORIGIN;
  return EXPECTED_ORIGIN;
}

function accessIdentityHint(event: HTTPEvent): string | null {
  void event;
  const email = getRequestHeader("cf-access-authenticated-user-email");
  if (!email) return import.meta.env.DEV ? "local-dev" : null;
  const [name, domain] = email.split("@");
  if (!name || !domain) return "access-user";
  return `${name.slice(0, 2)}***@${domain}`;
}

function sessionCookie(token: string): string {
  return [
    `${PASSKEY_SESSION_COOKIE}=${token}`,
    "Path=/",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ].join("; ");
}

function expiredSessionCookie(): string {
  return [
    `${PASSKEY_SESSION_COOKIE}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ].join("; ");
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
