import {
  adminJson,
  applyAdminSetCookies,
  assertExactOrigin,
  hashToken,
  nowIso,
  randomToken,
  recordAdminAudit,
  requireAdminDb,
  requireAdminMutation,
  type AdminAuthContext,
  type AdminD1Database,
  type AdminRole,
} from "./admin-auth";
import {
  beginPasskeyRegistration,
  insertPasskeyCredential,
  verifyPasskeyRegistration,
} from "./passkey-auth";
import { notifyAdminSecurityEvent } from "./security-notifications";

export const ADMIN_INVITE_SECONDS = 30 * 60;
export const ADMIN_INVITE_COOKIE = "__Host-admin_invite";

type InviteRole = Exclude<AdminRole, "owner">;

type InviteRow = {
  id: string;
  token_hash: string;
  role: InviteRole;
  invited_by_user_id: string;
  pending_user_id: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  approved_at: string | null;
  approved_by_user_id: string | null;
  revoked_at: string | null;
};

export async function createAdminInvite(
  context: AdminAuthContext,
): Promise<Response> {
  const principal = await requireAdminMutation(context, "member:approve");
  const db = requireAdminDb(context);
  const body = (await context.request.json().catch(() => null)) as {
    role?: unknown;
  } | null;
  if (!body || (body.role !== "operator" && body.role !== "viewer")) {
    throw adminJson({ error: "invite_role_invalid" }, { status: 400 });
  }

  const token = randomToken(32);
  const inviteId = crypto.randomUUID();
  const createdAt = nowIso();
  const expiresAt = new Date(
    Date.now() + ADMIN_INVITE_SECONDS * 1000,
  ).toISOString();
  await db
    .prepare(
      `INSERT INTO admin_invites
        (id, token_hash, role, invited_by_user_id, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      inviteId,
      await hashToken(token),
      body.role,
      principal.userId,
      createdAt,
      expiresAt,
    )
    .run();
  await recordAdminAudit(db, {
    eventType: "admin.invite.created",
    userId: principal.userId,
    sessionId: principal.sessionId,
    credentialId: principal.credentialId,
    summary: `created one-time ${body.role} invitation`,
    metadata: { invite_id: inviteId, expires_at: expiresAt },
  });

  return adminJson({
    invite_url: `${context.url.origin}/auth/invite?token=${encodeURIComponent(token)}`,
    role: body.role,
    expires_at: expiresAt,
  });
}

export async function inviteStatus(
  context: AdminAuthContext,
): Promise<Response> {
  const db = requireAdminDb(context);
  const token = inviteToken(context);
  const invite = await inviteByToken(db, token);
  if (!invite) {
    throw adminJson({ error: "invite_not_found" }, { status: 404 });
  }
  return adminJson({
    role: invite.role,
    state: inviteState(invite),
    expires_at: invite.expires_at,
  });
}

export async function inviteRegistrationOptions(
  context: AdminAuthContext,
): Promise<Response> {
  assertExactOrigin(context.request, context.url);
  const db = requireAdminDb(context);
  const body = (await context.request.json().catch(() => null)) as {
    display_name?: unknown;
  } | null;
  const token = inviteToken(context);
  if (!token) {
    throw adminJson({ error: "invite_token_required" }, { status: 400 });
  }
  const invite = await inviteByToken(db, token);
  if (!invite || inviteState(invite) !== "ready") {
    throw adminJson({ error: "invite_expired_or_used" }, { status: 410 });
  }
  const displayName = cleanDisplayName(body?.display_name);
  const pendingUserId = invite.pending_user_id ?? `member-${invite.id}`;
  if (!invite.pending_user_id) {
    await db
      .prepare(
        `UPDATE admin_invites SET pending_user_id = ?
         WHERE id = ? AND pending_user_id IS NULL AND used_at IS NULL`,
      )
      .bind(pendingUserId, invite.id)
      .run();
  }

  return adminJson(
    await beginPasskeyRegistration(context, {
      purpose: "invite_registration",
      userId: pendingUserId,
      userName: `${pendingUserId}@admin.anipotts.com`,
      displayName,
      inviteId: invite.id,
      metadata: { role: invite.role, display_name: displayName },
    }),
  );
}

export async function verifyInviteRegistration(
  context: AdminAuthContext,
): Promise<Response> {
  assertExactOrigin(context.request, context.url);
  const db = requireAdminDb(context);
  const verified = await verifyPasskeyRegistration(
    context,
    "invite_registration",
  );
  if (!verified.challenge.invite_id || !verified.challenge.user_id) {
    throw adminJson({ error: "invite_challenge_invalid" }, { status: 400 });
  }
  const invite = await inviteById(db, verified.challenge.invite_id);
  if (
    !invite ||
    invite.pending_user_id !== verified.challenge.user_id ||
    inviteState(invite) !== "ready"
  ) {
    throw adminJson({ error: "invite_expired_or_used" }, { status: 410 });
  }
  const metadata = parseChallengeMetadata(verified.challenge.metadata);
  const displayName = cleanDisplayName(metadata.display_name);
  const usedAt = nowIso();
  const lock = await db
    .prepare(
      `UPDATE admin_invites SET used_at = ?
       WHERE id = ? AND used_at IS NULL AND revoked_at IS NULL AND expires_at > ?`,
    )
    .bind(usedAt, invite.id, usedAt)
    .run();
  if (resultChanges(lock) !== 1) {
    throw adminJson({ error: "invite_already_used" }, { status: 409 });
  }

  await db
    .prepare(
      `INSERT INTO admin_users
        (id, display_name, role, status, created_by_user_id, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', ?, ?, ?)`,
    )
    .bind(
      invite.pending_user_id,
      displayName,
      invite.role,
      invite.invited_by_user_id,
      usedAt,
      usedAt,
    )
    .run();
  await insertPasskeyCredential(db, {
    userId: invite.pending_user_id,
    verified,
    label: "invitation passkey",
  });
  await recordAdminAudit(db, {
    eventType: "admin.invite.enrolled",
    userId: invite.pending_user_id,
    credentialId: verified.credential.id,
    summary: "enrolled invited passkey pending owner approval",
    metadata: { invite_id: invite.id, role: invite.role },
  });
  await notifyAdminSecurityEvent(context, {
    db,
    userId: invite.pending_user_id,
    eventType: "invited_passkey_enrolled",
    summary: "an invited admin passkey was enrolled and awaits approval",
  });

  return applyAdminSetCookies(
    adminJson({ ok: true, state: "pending_owner_approval" }),
    [expiredInviteCookie()],
  );
}

function inviteToken(context: AdminAuthContext): string {
  return context.cookies.get(ADMIN_INVITE_COOKIE)?.value ?? "";
}

function expiredInviteCookie(): string {
  return [
    `${ADMIN_INVITE_COOKIE}=`,
    "Path=/",
    "Max-Age=0",
    "Secure",
    "HttpOnly",
    "SameSite=Lax",
  ].join("; ");
}

export async function approveAdminMember(
  context: AdminAuthContext,
): Promise<Response> {
  const principal = await requireAdminMutation(context, "member:approve");
  const db = requireAdminDb(context);
  const body = (await context.request.json().catch(() => null)) as {
    user_id?: unknown;
  } | null;
  if (!body || typeof body.user_id !== "string" || !body.user_id) {
    throw adminJson({ error: "user_id_required" }, { status: 400 });
  }
  const approvedAt = nowIso();
  const result = await db
    .prepare(
      `UPDATE admin_users
       SET status = 'active', approved_by_user_id = ?, approved_at = ?, updated_at = ?
       WHERE id = ? AND role != 'owner' AND status = 'pending'`,
    )
    .bind(principal.userId, approvedAt, approvedAt, body.user_id)
    .run();
  if (resultChanges(result) !== 1) {
    throw adminJson({ error: "member_not_pending" }, { status: 409 });
  }
  await db
    .prepare(
      `UPDATE admin_invites
       SET approved_at = ?, approved_by_user_id = ?
       WHERE pending_user_id = ? AND used_at IS NOT NULL AND approved_at IS NULL`,
    )
    .bind(approvedAt, principal.userId, body.user_id)
    .run();
  await recordAdminAudit(db, {
    eventType: "admin.member.approved",
    userId: principal.userId,
    sessionId: principal.sessionId,
    credentialId: principal.credentialId,
    summary: "approved one invited admin member",
    metadata: { approved_user_id: body.user_id },
  });
  return adminJson({ ok: true, state: "active" });
}

export function inviteState(
  invite: Pick<
    InviteRow,
    "expires_at" | "used_at" | "approved_at" | "revoked_at"
  >,
  now = Date.now(),
): "ready" | "pending_owner_approval" | "approved" | "expired" | "revoked" {
  if (invite.revoked_at) return "revoked";
  if (invite.approved_at) return "approved";
  if (invite.used_at) return "pending_owner_approval";
  if (Date.parse(invite.expires_at) <= now) return "expired";
  return "ready";
}

async function inviteByToken(
  db: AdminD1Database,
  token: string,
): Promise<InviteRow | null> {
  if (!token) return null;
  return db
    .prepare(`SELECT * FROM admin_invites WHERE token_hash = ? LIMIT 1`)
    .bind(await hashToken(token))
    .first<InviteRow>();
}

async function inviteById(
  db: AdminD1Database,
  inviteId: string,
): Promise<InviteRow | null> {
  return db
    .prepare(`SELECT * FROM admin_invites WHERE id = ? LIMIT 1`)
    .bind(inviteId)
    .first<InviteRow>();
}

function cleanDisplayName(value: unknown): string {
  if (typeof value !== "string") return "admin member";
  const cleaned = value.trim().replace(/\s+/g, " ").slice(0, 80);
  return cleaned || "admin member";
}

function parseChallengeMetadata(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function resultChanges(result: { meta?: unknown }): number {
  return Number(
    (result.meta as { changes?: number } | undefined)?.changes ?? 1,
  );
}
