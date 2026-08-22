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
import {
  ADMIN_SESSION_COOKIE,
  adminDb,
  adminJson,
  adminSessionCookie,
  applyAdminSetCookies,
  assertExactOrigin,
  createAdminSession,
  expiredAdminSessionCookies,
  nowIso,
  recordAdminAudit,
  requireAdminDb,
  requireAdminMutation,
  requireAdminSessionAction,
  resolveAdminSession,
  revokeAdminSession,
  type AdminAuthContext,
  type AdminD1Database,
  type AdminPrincipal,
} from "./admin-auth";
import { notifyAdminSecurityEvent } from "./security-notifications";

export const PASSKEY_SESSION_COOKIE = ADMIN_SESSION_COOKIE;

const CHALLENGE_MAX_AGE_MS = 10 * 60 * 1000;
const PRODUCTION_RP_ID = "admin.anipotts.com";
const RP_NAME = "anipotts admin";
const EXPECTED_ORIGIN = "https://admin.anipotts.com";
const OWNER_USER_ID = "ani";
const OWNER_USER_NAME = "ani@admin.anipotts.com";
const OWNER_DISPLAY_NAME = "Ani";
const ACCESS_JWT_HEADER = "cf-access-jwt-assertion";
const PASSKEY_HINTS = ["client-device", "hybrid", "security-key"] as const;
const accessJwksByIssuer = new Map<
  string,
  ReturnType<typeof createRemoteJWKSet>
>();

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

export type ChallengePurpose =
  | "registration"
  | "authentication"
  | "invite_registration"
  | "recovery_registration";

export type ChallengeRow = {
  id: string;
  purpose: ChallengePurpose;
  challenge: string;
  credential_id: string | null;
  user_id: string | null;
  session_id: string | null;
  invite_id: string | null;
  recovery_session_id: string | null;
  request_origin: string | null;
  metadata: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
};

type PasskeyAuditEventRow = {
  event_type: string;
  count: number;
};

type UserRow = {
  id: string;
  display_name: string;
  role: "owner" | "operator" | "viewer";
  status: "pending" | "active" | "revoked";
};

type RegistrationEnvelope = {
  challenge_id?: unknown;
  credential?: unknown;
};

type AuthenticationEnvelope = {
  challenge_id?: unknown;
  credential?: unknown;
};

export type AccessIdentity = {
  verified: boolean;
  hint: string | null;
};

export type PasskeyContext = AdminAuthContext;

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

export type BeginRegistrationInput = {
  purpose: Exclude<ChallengePurpose, "authentication">;
  userId: string;
  userName: string;
  displayName: string;
  sessionId?: string | null;
  inviteId?: string | null;
  recoverySessionId?: string | null;
  metadata?: Record<string, unknown>;
};

export type VerifiedRegistration = {
  challenge: ChallengeRow;
  credential: WebAuthnCredential;
  credentialDeviceType: string;
  credentialBackedUp: boolean;
  transports: AuthenticatorTransportFuture[];
};

export function json(data: unknown, init?: ResponseInit): Response {
  return adminJson(data, init);
}

export function handlePasskeyError(error: unknown): Response {
  if (error instanceof Response) return error;
  return adminJson(
    {
      error: "passkey_request_failed",
      ...(import.meta.env.DEV && error instanceof Error
        ? { detail: error.message }
        : {}),
    },
    { status: 400 },
  );
}

export async function getPasskeyStatus(
  context: PasskeyContext,
): Promise<PasskeyStatus> {
  const db = adminDb(context);
  const accessIdentity = await verifyAccessIdentity(context);
  if (!db) return missingDbStatus(context, accessIdentity);

  try {
    const credentialCount = await countActiveCredentials(db);
    const auditCount = await countAuditEvents(db);
    const auditEvents = await readRequiredAuditEvents(db);
    const resolved = await resolveAdminSession(context);
    const hasSession = Boolean(
      resolved.principal && !resolved.principal.restriction,
    );
    const canRegister =
      resolved.principal?.role === "owner" ||
      (credentialCount === 0 && accessIdentity.verified);
    const blockers = passkeyAccessRemovalBlockers({
      credentialCount,
      hasSession,
      auditEvents,
    });

    return {
      available: true,
      mode: "ready",
      credential_count: credentialCount,
      audit_count: auditCount,
      has_session: hasSession,
      can_register: canRegister,
      access_identity_present: accessIdentity.verified,
      access_identity_hint: accessIdentity.hint,
      expected_origin: EXPECTED_ORIGIN,
      expected_rp_id: expectedRpId(context),
      current_origin: context.url.origin,
      audit_events: auditEvents,
      proof_items: buildPasskeyProofItems(
        credentialCount,
        hasSession,
        auditEvents,
      ),
      access_removal_blockers: blockers,
      ready_for_access_removal: blockers.length === 0,
      next_safe_action: nextPasskeyStatusAction({
        hasSession,
        credentialCount,
        accessIdentityVerified: accessIdentity.verified,
      }),
    };
  } catch (error) {
    if (!isMissingAuthTable(error)) throw error;
    return missingDbStatus(context, accessIdentity);
  }
}

export async function hasActivePasskeySession(
  context: PasskeyContext,
): Promise<boolean> {
  try {
    const resolved = await resolveAdminSession(context);
    return Boolean(resolved.principal && !resolved.principal.restriction);
  } catch {
    return false;
  }
}

export async function getPasskeyActor(
  context: PasskeyContext,
): Promise<PasskeyActor> {
  const principal =
    context.locals.adminPrincipal ??
    (await resolveAdminSession(context)).principal;
  if (!principal || principal.restriction) {
    throw adminJson(
      {
        error: "passkey_session_required",
        next_safe_action: "authenticate before changing admin state",
      },
      { status: 403 },
    );
  }
  return actorFromPrincipal(principal);
}

export async function registrationOptions(
  context: PasskeyContext,
): Promise<Response> {
  assertExactOrigin(context.request, context.url);
  const db = requireAdminDb(context);
  const resolved = await resolveAdminSession(context);
  let principal = resolved.principal;

  if (principal) {
    principal = await requireAdminMutation(context, "identity:manage");
  } else {
    const credentialCount = await countActiveCredentials(db);
    const accessIdentity = await verifyAccessIdentity(context);
    if (credentialCount > 0 || !accessIdentity.verified) {
      throw adminJson({ error: "registration_not_allowed" }, { status: 403 });
    }
    await ensureOwnerUser(db);
  }

  return adminJson(
    await beginPasskeyRegistration(context, {
      purpose: "registration",
      userId: principal?.userId ?? OWNER_USER_ID,
      userName: OWNER_USER_NAME,
      displayName: principal?.displayName ?? OWNER_DISPLAY_NAME,
      sessionId: principal?.sessionId ?? null,
    }),
  );
}

export async function verifyRegistration(
  context: PasskeyContext,
): Promise<Response> {
  assertExactOrigin(context.request, context.url);
  const db = requireAdminDb(context);
  const verified = await verifyPasskeyRegistration(context, "registration");
  const existingPrincipal =
    context.locals.adminPrincipal ??
    (await resolveAdminSession(context)).principal;
  if (verified.challenge.session_id) {
    const principal = await requireAdminMutation(context, "identity:manage");
    if (principal.sessionId !== verified.challenge.session_id) {
      throw adminJson({ error: "challenge_session_mismatch" }, { status: 403 });
    }
  } else {
    const accessIdentity = await verifyAccessIdentity(context);
    if (!accessIdentity.verified || (await countActiveCredentials(db)) > 0) {
      throw adminJson({ error: "registration_not_allowed" }, { status: 403 });
    }
    await ensureOwnerUser(db);
  }

  const userId = verified.challenge.user_id ?? OWNER_USER_ID;
  await insertPasskeyCredential(db, {
    userId,
    verified,
    createdBySessionId: existingPrincipal?.sessionId ?? null,
  });

  const created = await createAdminSession(db, {
    userId,
    credentialId: verified.credential.id,
    authMethod: "passkey",
    stepUpAt: nowIso(),
  });
  await recordAdminAudit(db, {
    eventType: "passkey.credential.registered",
    userId,
    sessionId: created.sessionId,
    credentialId: verified.credential.id,
    summary: "registered discoverable admin passkey",
  });
  await recordAdminAudit(db, {
    eventType: "passkey.session.created",
    userId,
    sessionId: created.sessionId,
    credentialId: verified.credential.id,
    summary: "created unified admin session after passkey registration",
  });
  await notifyAdminSecurityEvent(context, {
    db,
    userId,
    eventType: "passkey_registered",
    summary: "a new admin passkey was registered",
  });

  return applyAdminSetCookies(
    adminJson({
      verified: true,
      csrf_token: created.csrfToken,
      next_safe_action: "passkey session active",
    }),
    [
      adminSessionCookie(created.token),
      ...expiredAdminSessionCookies().slice(1),
    ],
  );
}

export async function authenticationOptions(
  context: PasskeyContext,
): Promise<Response> {
  assertExactOrigin(context.request, context.url);
  const db = requireAdminDb(context);
  if ((await countActiveCredentials(db)) === 0) {
    if ((await countRevokedCredentials(db)) > 0) {
      await recordAdminAudit(db, {
        eventType: "passkey.authentication.denied",
        outcome: "denied",
        summary: "denied authentication because all credentials are revoked",
      });
    }
    throw adminJson({ error: "no_credentials" }, { status: 409 });
  }

  const generatedOptions = await generateAuthenticationOptions({
    rpID: expectedRpId(context),
    userVerification: "required",
    timeout: 90_000,
  });
  const options = { ...generatedOptions, hints: [...PASSKEY_HINTS] };
  const challengeId = await storeChallenge(context, {
    purpose: "authentication",
    challenge: options.challenge,
  });
  return adminJson({ options, challenge_id: challengeId });
}

export async function verifyAuthentication(
  context: PasskeyContext,
): Promise<Response> {
  assertExactOrigin(context.request, context.url);
  const db = requireAdminDb(context);
  const envelope = await readAuthenticationEnvelope(context.request);
  const credential = await findActiveCredential(db, envelope.credential.id);
  if (!credential) {
    await recordAdminAudit(db, {
      eventType: "passkey.authentication.denied",
      outcome: "denied",
      credentialId: envelope.credential.id,
      summary: "denied missing or revoked passkey credential",
    });
    throw adminJson({ error: "credential_not_found" }, { status: 404 });
  }

  const challenge = await consumeChallenge(
    db,
    "authentication",
    envelope.challengeId,
  );
  let result: Awaited<ReturnType<typeof verifyAuthenticationResponse>>;
  try {
    result = await verifyAuthenticationResponse({
      response: envelope.credential,
      expectedChallenge: challenge.challenge,
      expectedOrigin: expectedOrigin(context),
      expectedRPID: expectedRpId(context),
      credential: toWebAuthnCredential(credential),
      requireUserVerification: true,
    });
  } catch {
    await recordAdminAudit(db, {
      eventType: "passkey.authentication.denied",
      outcome: "denied",
      userId: credential.user_id,
      credentialId: credential.credential_id,
      summary: "denied passkey assertion verification",
    });
    throw adminJson(
      { error: "authentication_verification_failed" },
      { status: 400 },
    );
  }
  if (!result.verified) {
    await recordAdminAudit(db, {
      eventType: "passkey.authentication.denied",
      outcome: "denied",
      userId: credential.user_id,
      credentialId: credential.credential_id,
      summary: "denied unverified passkey assertion",
    });
    throw adminJson(
      { error: "authentication_verification_failed" },
      { status: 400 },
    );
  }

  const user = await activeUser(db, credential.user_id);
  if (!user) {
    throw adminJson({ error: "user_not_active" }, { status: 403 });
  }
  await db
    .prepare(
      `UPDATE admin_passkey_credentials
       SET counter = ?, device_type = ?, backed_up = ?, last_used_at = ?, updated_at = ?
       WHERE credential_id = ? AND revoked_at IS NULL`,
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

  const created = await createAdminSession(db, {
    userId: user.id,
    credentialId: credential.credential_id,
    authMethod: "passkey",
    stepUpAt: nowIso(),
  });
  await recordAdminAudit(db, {
    eventType: "passkey.authentication.verified",
    userId: user.id,
    sessionId: created.sessionId,
    credentialId: credential.credential_id,
    summary: "verified discoverable passkey assertion",
  });
  await recordAdminAudit(db, {
    eventType: "passkey.session.created",
    userId: user.id,
    sessionId: created.sessionId,
    credentialId: credential.credential_id,
    summary: "created unified admin session",
  });

  return applyAdminSetCookies(
    adminJson({
      verified: true,
      role: user.role,
      csrf_token: created.csrfToken,
      next_safe_action: "passkey session active",
    }),
    [
      adminSessionCookie(created.token),
      ...expiredAdminSessionCookies().slice(1),
    ],
  );
}

export async function logout(context: PasskeyContext): Promise<Response> {
  const principal = await requireAdminSessionAction(context);
  const db = requireAdminDb(context);
  await revokeAdminSession(db, principal.sessionId, "logout");
  await recordAdminAudit(db, {
    eventType: "passkey.session.revoked",
    userId: principal.userId,
    sessionId: principal.sessionId,
    credentialId: principal.credentialId,
    summary: "revoked unified admin session on logout",
  });
  return applyAdminSetCookies(
    adminJson({ ok: true, next_safe_action: "session cleared" }),
    expiredAdminSessionCookies(),
  );
}

export async function revokeCurrentCredential(
  context: PasskeyContext,
): Promise<Response> {
  const principal = await requireAdminMutation(context, "identity:manage");
  const db = requireAdminDb(context);
  if (!principal.credentialId) {
    throw adminJson({ error: "credential_session_required" }, { status: 409 });
  }
  const activeCount = await countUserActiveCredentials(db, principal.userId);
  if (activeCount <= 1) {
    throw adminJson(
      { error: "last_credential_cannot_be_revoked" },
      { status: 409 },
    );
  }

  await db
    .prepare(
      `UPDATE admin_passkey_credentials
       SET revoked_at = ?, revocation_reason = 'owner_requested', updated_at = ?
       WHERE credential_id = ? AND user_id = ? AND revoked_at IS NULL`,
    )
    .bind(nowIso(), nowIso(), principal.credentialId, principal.userId)
    .run();
  await db
    .prepare(
      `UPDATE admin_sessions
       SET revoked_at = ?, revoked_reason = 'credential_revoked', updated_at = ?
       WHERE credential_id = ? AND revoked_at IS NULL`,
    )
    .bind(nowIso(), nowIso(), principal.credentialId)
    .run();
  await recordAdminAudit(db, {
    eventType: "passkey.credential.revoked",
    userId: principal.userId,
    sessionId: principal.sessionId,
    credentialId: principal.credentialId,
    summary: "revoked one admin passkey credential",
  });
  await recordAdminAudit(db, {
    eventType: "passkey.session.revoked",
    userId: principal.userId,
    sessionId: principal.sessionId,
    credentialId: principal.credentialId,
    summary: "revoked sessions bound to revoked passkey",
  });
  await notifyAdminSecurityEvent(context, {
    db,
    userId: principal.userId,
    eventType: "passkey_revoked",
    summary: "an admin passkey was revoked",
  });

  return applyAdminSetCookies(
    adminJson({ ok: true, next_safe_action: "sign in with another passkey" }),
    expiredAdminSessionCookies(),
  );
}

export async function beginPasskeyRegistration(
  context: PasskeyContext,
  input: BeginRegistrationInput,
): Promise<{ options: unknown; challenge_id: string }> {
  const db = requireAdminDb(context);
  const credentials = await listCredentialsForUser(db, input.userId);
  const generatedOptions = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: expectedRpId(context),
    userID: new TextEncoder().encode(input.userId),
    userName: input.userName,
    userDisplayName: input.displayName,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required",
    },
    excludeCredentials: credentials.map((credential) => ({
      id: credential.credential_id,
      transports: parseTransports(credential.transports),
    })),
    timeout: 90_000,
  });
  const options = { ...generatedOptions, hints: [...PASSKEY_HINTS] };
  const challengeId = await storeChallenge(context, {
    purpose: input.purpose,
    challenge: options.challenge,
    userId: input.userId,
    sessionId: input.sessionId ?? null,
    inviteId: input.inviteId ?? null,
    recoverySessionId: input.recoverySessionId ?? null,
    metadata: input.metadata,
  });
  return { options, challenge_id: challengeId };
}

export async function verifyPasskeyRegistration(
  context: PasskeyContext,
  purpose: Exclude<ChallengePurpose, "authentication">,
): Promise<VerifiedRegistration> {
  const db = requireAdminDb(context);
  const envelope = await readRegistrationEnvelope(context.request);
  const challenge = await consumeChallenge(db, purpose, envelope.challengeId);
  let result: Awaited<ReturnType<typeof verifyRegistrationResponse>>;
  try {
    result = await verifyRegistrationResponse({
      response: envelope.credential,
      expectedChallenge: challenge.challenge,
      expectedOrigin: expectedOrigin(context),
      expectedRPID: expectedRpId(context),
      requireUserVerification: true,
    });
  } catch {
    throw adminJson(
      { error: "registration_verification_failed" },
      { status: 400 },
    );
  }
  if (!result.verified || !result.registrationInfo) {
    throw adminJson(
      { error: "registration_verification_failed" },
      { status: 400 },
    );
  }
  return {
    challenge,
    credential: result.registrationInfo.credential,
    credentialDeviceType: result.registrationInfo.credentialDeviceType,
    credentialBackedUp: result.registrationInfo.credentialBackedUp,
    transports: envelope.credential.response.transports ?? [],
  };
}

export async function insertPasskeyCredential(
  db: AdminD1Database,
  input: {
    userId: string;
    verified: VerifiedRegistration;
    createdBySessionId?: string | null;
    label?: string | null;
  },
): Promise<void> {
  const existing = await db
    .prepare(
      `SELECT credential_id, user_id, revoked_at FROM admin_passkey_credentials
       WHERE credential_id = ? LIMIT 1`,
    )
    .bind(input.verified.credential.id)
    .first<{
      credential_id: string;
      user_id: string;
      revoked_at: string | null;
    }>();
  if (
    existing &&
    (existing.user_id !== input.userId || existing.revoked_at === null)
  ) {
    throw adminJson(
      { error: "credential_already_registered" },
      { status: 409 },
    );
  }

  const inserted = await db
    .prepare(
      `INSERT INTO admin_passkey_credentials
        (id, user_id, credential_id, public_key, counter, transports,
         device_type, backed_up, created_at, updated_at, label,
         created_by_session_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(credential_id) DO UPDATE SET
         public_key = excluded.public_key,
         counter = excluded.counter,
         transports = excluded.transports,
         device_type = excluded.device_type,
         backed_up = excluded.backed_up,
         last_used_at = NULL,
         revoked_at = NULL,
         revocation_reason = NULL,
         updated_at = excluded.updated_at,
         label = excluded.label,
         created_by_session_id = excluded.created_by_session_id
       WHERE admin_passkey_credentials.user_id = excluded.user_id
         AND admin_passkey_credentials.revoked_at IS NOT NULL`,
    )
    .bind(
      crypto.randomUUID(),
      input.userId,
      input.verified.credential.id,
      bytesToBase64Url(input.verified.credential.publicKey),
      input.verified.credential.counter,
      JSON.stringify(input.verified.transports),
      input.verified.credentialDeviceType,
      input.verified.credentialBackedUp ? 1 : 0,
      nowIso(),
      nowIso(),
      input.label ?? null,
      input.createdBySessionId ?? null,
    )
    .run();
  const changes = Number(
    (inserted.meta as { changes?: number } | undefined)?.changes ?? 1,
  );
  if (changes !== 1) {
    throw adminJson(
      { error: "credential_registration_conflict" },
      { status: 409 },
    );
  }
}

export async function consumeChallenge(
  db: AdminD1Database,
  purpose: ChallengePurpose,
  challengeId: string,
): Promise<ChallengeRow> {
  const row = await db
    .prepare(
      `SELECT * FROM admin_passkey_challenges
       WHERE id = ? AND purpose = ? AND used_at IS NULL AND expires_at > ?
       LIMIT 1`,
    )
    .bind(challengeId, purpose, nowIso())
    .first<ChallengeRow>();
  if (!row) {
    throw adminJson({ error: "challenge_missing_or_expired" }, { status: 400 });
  }

  const update = await db
    .prepare(
      `UPDATE admin_passkey_challenges
       SET used_at = ?
       WHERE id = ? AND used_at IS NULL AND expires_at > ?`,
    )
    .bind(nowIso(), row.id, nowIso())
    .run();
  const changes = Number(
    (update.meta as { changes?: number } | undefined)?.changes ?? 1,
  );
  if (changes !== 1) {
    throw adminJson({ error: "challenge_already_used" }, { status: 409 });
  }
  return row;
}

export async function verifyAccessIdentity(
  context: Pick<PasskeyContext, "request" | "url" | "locals">,
): Promise<AccessIdentity> {
  if (isLoopbackDevOrigin(context.url.origin)) {
    return { verified: true, hint: "local-dev" };
  }

  const teamDomain = context.locals.runtime?.env.ACCESS_TEAM_DOMAIN;
  const audience = context.locals.runtime?.env.ACCESS_POLICY_AUD;
  if (!teamDomain || !audience) return { verified: false, hint: null };

  const cfJwt = context.request.headers.get(ACCESS_JWT_HEADER);
  if (!cfJwt) return { verified: false, hint: null };

  try {
    const issuer = teamDomain.replace(/\/$/, "");
    const jwks = accessJwks(issuer);
    const { payload } = await jwtVerify(cfJwt, jwks, { issuer, audience });
    const email = typeof payload.email === "string" ? payload.email : null;
    if (!email) return { verified: false, hint: null };
    return { verified: true, hint: maskEmail(email) };
  } catch {
    return { verified: false, hint: null };
  }
}

function missingDbStatus(
  context: PasskeyContext,
  accessIdentity: AccessIdentity,
): PasskeyStatus {
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
    next_safe_action: "apply the additive admin auth migration behind Access",
  };
}

async function storeChallenge(
  context: PasskeyContext,
  input: {
    purpose: ChallengePurpose;
    challenge: string;
    userId?: string | null;
    sessionId?: string | null;
    inviteId?: string | null;
    recoverySessionId?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<string> {
  const db = requireAdminDb(context);
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + CHALLENGE_MAX_AGE_MS).toISOString();
  await db
    .prepare(
      `INSERT INTO admin_passkey_challenges
        (id, purpose, challenge, user_id, session_id, invite_id,
         recovery_session_id, request_origin, metadata, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.purpose,
      input.challenge,
      input.userId ?? null,
      input.sessionId ?? null,
      input.inviteId ?? null,
      input.recoverySessionId ?? null,
      context.url.origin,
      JSON.stringify(input.metadata ?? {}),
      nowIso(),
      expiresAt,
    )
    .run();
  return id;
}

async function readRegistrationEnvelope(request: Request): Promise<{
  challengeId: string;
  credential: RegistrationResponseJSON;
}> {
  const body = (await request
    .json()
    .catch(() => null)) as RegistrationEnvelope | null;
  if (
    !body ||
    typeof body.challenge_id !== "string" ||
    !body.challenge_id ||
    !body.credential ||
    typeof body.credential !== "object"
  ) {
    throw adminJson({ error: "invalid_registration_body" }, { status: 400 });
  }
  return {
    challengeId: body.challenge_id,
    credential: body.credential as RegistrationResponseJSON,
  };
}

async function readAuthenticationEnvelope(request: Request): Promise<{
  challengeId: string;
  credential: AuthenticationResponseJSON;
}> {
  const body = (await request
    .json()
    .catch(() => null)) as AuthenticationEnvelope | null;
  if (
    !body ||
    typeof body.challenge_id !== "string" ||
    !body.challenge_id ||
    !body.credential ||
    typeof body.credential !== "object"
  ) {
    throw adminJson({ error: "invalid_authentication_body" }, { status: 400 });
  }
  return {
    challengeId: body.challenge_id,
    credential: body.credential as AuthenticationResponseJSON,
  };
}

async function ensureOwnerUser(db: AdminD1Database): Promise<void> {
  await db
    .prepare(
      `INSERT OR IGNORE INTO admin_users
        (id, display_name, role, status, created_at, updated_at, approved_at)
       VALUES (?, ?, 'owner', 'active', ?, ?, ?)`,
    )
    .bind(OWNER_USER_ID, OWNER_DISPLAY_NAME, nowIso(), nowIso(), nowIso())
    .run();
}

async function activeUser(
  db: AdminD1Database,
  userId: string,
): Promise<UserRow | null> {
  return db
    .prepare(
      `SELECT id, display_name, role, status FROM admin_users
       WHERE id = ? AND status = 'active' LIMIT 1`,
    )
    .bind(userId)
    .first<UserRow>();
}

async function listCredentialsForUser(
  db: AdminD1Database,
  userId: string,
): Promise<CredentialRow[]> {
  const result = await db
    .prepare(
      `SELECT * FROM admin_passkey_credentials
       WHERE user_id = ? AND revoked_at IS NULL
       ORDER BY created_at ASC`,
    )
    .bind(userId)
    .all<CredentialRow>();
  return result.results ?? [];
}

async function findActiveCredential(
  db: AdminD1Database,
  credentialId: string,
): Promise<CredentialRow | null> {
  return db
    .prepare(
      `SELECT * FROM admin_passkey_credentials
       WHERE credential_id = ? AND revoked_at IS NULL LIMIT 1`,
    )
    .bind(credentialId)
    .first<CredentialRow>();
}

async function countActiveCredentials(db: AdminD1Database): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS count FROM admin_passkey_credentials
       WHERE revoked_at IS NULL`,
    )
    .first<{ count: number }>();
  return Number(row?.count ?? 0);
}

async function countUserActiveCredentials(
  db: AdminD1Database,
  userId: string,
): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS count FROM admin_passkey_credentials
       WHERE user_id = ? AND revoked_at IS NULL`,
    )
    .bind(userId)
    .first<{ count: number }>();
  return Number(row?.count ?? 0);
}

async function countRevokedCredentials(db: AdminD1Database): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS count FROM admin_passkey_credentials
       WHERE revoked_at IS NOT NULL`,
    )
    .first<{ count: number }>();
  return Number(row?.count ?? 0);
}

async function countAuditEvents(db: AdminD1Database): Promise<number> {
  const row = await db
    .prepare(`SELECT COUNT(*) AS count FROM admin_passkey_audit`)
    .first<{ count: number }>();
  return Number(row?.count ?? 0);
}

async function readRequiredAuditEvents(
  db: AdminD1Database,
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

function actorFromPrincipal(principal: AdminPrincipal): PasskeyActor {
  return {
    id: principal.userId,
    display_name: principal.displayName,
    credential_id_hint: principal.credentialId
      ? principal.credentialId.slice(-8)
      : null,
  };
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

function expectedOrigin(context: PasskeyContext): string {
  return isLoopbackDevOrigin(context.url.origin)
    ? context.url.origin
    : EXPECTED_ORIGIN;
}

function expectedRpId(context: PasskeyContext): string {
  return isLoopbackDevOrigin(context.url.origin)
    ? context.url.hostname
    : PRODUCTION_RP_ID;
}

function accessJwks(issuer: string): ReturnType<typeof createRemoteJWKSet> {
  const cached = accessJwksByIssuer.get(issuer);
  if (cached) return cached;
  const jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
  accessJwksByIssuer.set(issuer, jwks);
  return jwks;
}

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "access-user";
  return `${name.slice(0, 2)}***@${domain}`;
}

function isLoopbackDevOrigin(origin: string): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    const url = new URL(origin);
    return (
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    );
  } catch {
    return false;
  }
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

function isMissingAuthTable(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("no such table") &&
    (error.message.includes("admin_passkey_") ||
      error.message.includes("admin_users") ||
      error.message.includes("admin_sessions"))
  );
}
