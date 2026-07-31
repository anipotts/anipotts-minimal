import {
  adminJson,
  adminSessionCookie,
  applyAdminSetCookies,
  assertExactOrigin,
  createAdminSession,
  hasAdminCapability,
  hashToken,
  nowIso,
  randomToken,
  recordAdminAudit,
  requireAdminDb,
  requireAdminMutation,
  type AdminAuthContext,
  type AdminD1Database,
} from "./admin-auth";

export const DEVICE_AUTHORIZATION_SECONDS = 5 * 60;
export const DEVICE_VERIFIER_COOKIE = "__Host-admin_device_verifier";

type DeviceAuthorizationRow = {
  id: string;
  verifier_hash: string;
  requesting_device: string;
  requested_origin: string;
  requested_at: string;
  expires_at: string;
  approved_by_user_id: string | null;
  approved_by_session_id: string | null;
  approved_at: string | null;
  denied_at: string | null;
  claimed_at: string | null;
  claimed_session_id: string | null;
};

export type DeviceAuthorizationState =
  | "pending"
  | "approved"
  | "denied"
  | "claimed"
  | "expired";

export async function startDeviceAuthorization(
  context: AdminAuthContext,
): Promise<Response> {
  assertExactOrigin(context.request, context.url);
  const db = requireAdminDb(context);
  const requestId = randomToken(24);
  const verifier = randomToken(32);
  const requestedAt = nowIso();
  const expiresAt = new Date(
    Date.now() + DEVICE_AUTHORIZATION_SECONDS * 1000,
  ).toISOString();

  await db
    .prepare(
      `INSERT INTO admin_device_authorizations
        (id, verifier_hash, requesting_device, requested_origin,
         requested_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      requestId,
      await hashToken(verifier),
      summarizeRequestingDevice(context.request),
      context.url.origin,
      requestedAt,
      expiresAt,
    )
    .run();
  await recordAdminAudit(db, {
    eventType: "admin.device.requested",
    summary: "created five minute cross-device authorization request",
    metadata: { request_id: requestId },
  });

  return applyAdminSetCookies(
    adminJson({
      request_id: requestId,
      approval_path: `/auth/device/${encodeURIComponent(requestId)}`,
      expires_at: expiresAt,
    }),
    [deviceVerifierCookie(verifier)],
  );
}

export async function readDeviceAuthorization(
  context: AdminAuthContext,
): Promise<Response> {
  const db = requireAdminDb(context);
  const requestId = context.url.searchParams.get("request_id") ?? "";
  const row = await verifiedRequest(db, context, requestId);
  if (!row) {
    throw adminJson({ error: "device_request_not_found" }, { status: 404 });
  }
  return adminJson({
    request_id: row.id,
    state: deviceAuthorizationState(row),
    requesting_device: row.requesting_device,
    requested_at: row.requested_at,
    expires_at: row.expires_at,
  });
}

export async function reviewDeviceAuthorization(
  context: AdminAuthContext,
): Promise<Response> {
  const principal = context.locals.adminPrincipal;
  if (!principal) {
    throw adminJson({ error: "admin_session_required" }, { status: 401 });
  }
  if (
    principal.restriction ||
    !hasAdminCapability(principal.role, "admin:read")
  ) {
    throw adminJson({ error: "role_denied" }, { status: 403 });
  }

  const db = requireAdminDb(context);
  const requestId = context.url.searchParams.get("request_id") ?? "";
  const row = await db
    .prepare(
      `SELECT * FROM admin_device_authorizations
       WHERE id = ? LIMIT 1`,
    )
    .bind(requestId)
    .first<DeviceAuthorizationRow>();
  if (!row) {
    throw adminJson({ error: "device_request_not_found" }, { status: 404 });
  }
  const state = deviceAuthorizationState(row);
  if (state === "expired") {
    throw adminJson({ error: "device_request_expired" }, { status: 410 });
  }
  return adminJson({
    request_id: row.id,
    state,
    requesting_device: row.requesting_device,
    requested_at: row.requested_at,
    expires_at: row.expires_at,
  });
}

export async function approveDeviceAuthorization(
  context: AdminAuthContext,
): Promise<Response> {
  const principal = await requireAdminMutation(context, "admin:read");
  const db = requireAdminDb(context);
  const body = (await context.request.json().catch(() => null)) as {
    request_id?: unknown;
  } | null;
  if (!body || typeof body.request_id !== "string" || !body.request_id) {
    throw adminJson({ error: "device_request_id_required" }, { status: 400 });
  }

  const row = await db
    .prepare(
      `SELECT * FROM admin_device_authorizations
       WHERE id = ? LIMIT 1`,
    )
    .bind(body.request_id)
    .first<DeviceAuthorizationRow>();
  if (!row || deviceAuthorizationState(row) === "expired") {
    throw adminJson({ error: "device_request_expired" }, { status: 410 });
  }
  if (deviceAuthorizationState(row) !== "pending") {
    throw adminJson(
      { error: "device_request_already_resolved" },
      { status: 409 },
    );
  }

  const approvedAt = nowIso();
  const result = await db
    .prepare(
      `UPDATE admin_device_authorizations
       SET approved_by_user_id = ?, approved_by_session_id = ?, approved_at = ?
       WHERE id = ?
         AND approved_at IS NULL
         AND denied_at IS NULL
         AND claimed_at IS NULL
         AND expires_at > ?`,
    )
    .bind(principal.userId, principal.sessionId, approvedAt, row.id, approvedAt)
    .run();
  if (resultChanges(result) !== 1) {
    throw adminJson({ error: "device_request_raced" }, { status: 409 });
  }
  await recordAdminAudit(db, {
    eventType: "admin.device.approved",
    userId: principal.userId,
    sessionId: principal.sessionId,
    credentialId: principal.credentialId,
    summary: "approved one cross-device admin session",
    metadata: { request_id: row.id, requesting_device: row.requesting_device },
  });

  return adminJson({ ok: true, state: "approved" });
}

export async function claimDeviceAuthorization(
  context: AdminAuthContext,
): Promise<Response> {
  assertExactOrigin(context.request, context.url);
  const db = requireAdminDb(context);
  const body = (await context.request.json().catch(() => null)) as {
    request_id?: unknown;
  } | null;
  if (!body || typeof body.request_id !== "string" || !body.request_id) {
    throw adminJson({ error: "device_request_id_required" }, { status: 400 });
  }
  const row = await verifiedRequest(db, context, body.request_id);
  if (!row) {
    throw adminJson({ error: "device_request_not_found" }, { status: 404 });
  }
  if (deviceAuthorizationState(row) === "expired") {
    throw adminJson({ error: "device_request_expired" }, { status: 410 });
  }
  if (deviceAuthorizationState(row) !== "approved" || !row.approved_at) {
    throw adminJson({ error: "device_request_not_approved" }, { status: 409 });
  }
  if (!row.approved_by_user_id) {
    throw adminJson({ error: "device_request_invalid" }, { status: 409 });
  }

  const claimedAt = nowIso();
  const lock = await db
    .prepare(
      `UPDATE admin_device_authorizations
       SET claimed_at = ?
       WHERE id = ?
         AND claimed_at IS NULL
         AND denied_at IS NULL
         AND approved_at IS NOT NULL
         AND expires_at > ?`,
    )
    .bind(claimedAt, row.id, claimedAt)
    .run();
  if (resultChanges(lock) !== 1) {
    throw adminJson(
      { error: "device_request_already_claimed" },
      { status: 409 },
    );
  }

  const created = await createAdminSession(db, {
    userId: row.approved_by_user_id,
    authMethod: "device_approval",
    stepUpAt: row.approved_at,
  });
  await db
    .prepare(
      `UPDATE admin_device_authorizations
       SET claimed_session_id = ? WHERE id = ? AND claimed_session_id IS NULL`,
    )
    .bind(created.sessionId, row.id)
    .run();
  await recordAdminAudit(db, {
    eventType: "admin.device.claimed",
    userId: row.approved_by_user_id,
    sessionId: created.sessionId,
    summary: "claimed approved cross-device admin session with verifier",
    metadata: { request_id: row.id },
  });

  return applyAdminSetCookies(
    adminJson({
      ok: true,
      state: "claimed",
      csrf_token: created.csrfToken,
    }),
    [adminSessionCookie(created.token), expiredDeviceVerifierCookie()],
  );
}

export function deviceAuthorizationState(
  row: Pick<
    DeviceAuthorizationRow,
    "expires_at" | "approved_at" | "denied_at" | "claimed_at"
  >,
  now = Date.now(),
): DeviceAuthorizationState {
  if (row.claimed_at) return "claimed";
  if (row.denied_at) return "denied";
  if (Date.parse(row.expires_at) <= now) return "expired";
  if (row.approved_at) return "approved";
  return "pending";
}

function summarizeRequestingDevice(request: Request): string {
  const userAgent = request.headers.get("user-agent")?.toLowerCase() ?? "";
  if (userAgent.includes("codex")) return "Codex Browser";
  if (userAgent.includes("iphone")) return "iPhone Safari";
  if (userAgent.includes("chrome")) return "Chrome on macOS";
  if (userAgent.includes("safari")) return "Safari on macOS";
  return "browser";
}

async function verifiedRequest(
  db: AdminD1Database,
  context: AdminAuthContext,
  requestId: string,
): Promise<DeviceAuthorizationRow | null> {
  const verifier = context.cookies.get(DEVICE_VERIFIER_COOKIE)?.value;
  if (!requestId || !verifier) return null;
  return db
    .prepare(
      `SELECT * FROM admin_device_authorizations
       WHERE id = ? AND verifier_hash = ? LIMIT 1`,
    )
    .bind(requestId, await hashToken(verifier))
    .first<DeviceAuthorizationRow>();
}

function deviceVerifierCookie(verifier: string): string {
  return [
    `${DEVICE_VERIFIER_COOKIE}=${verifier}`,
    "Path=/",
    `Max-Age=${DEVICE_AUTHORIZATION_SECONDS}`,
    "Secure",
    "HttpOnly",
    "SameSite=Lax",
  ].join("; ");
}

function expiredDeviceVerifierCookie(): string {
  return [
    `${DEVICE_VERIFIER_COOKIE}=`,
    "Path=/",
    "Max-Age=0",
    "Secure",
    "HttpOnly",
    "SameSite=Lax",
  ].join("; ");
}

function resultChanges(result: { meta?: unknown }): number {
  return Number(
    (result.meta as { changes?: number } | undefined)?.changes ?? 1,
  );
}
