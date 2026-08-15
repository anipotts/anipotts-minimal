import {
  adminJson,
  hashToken,
  nowIso,
  randomToken,
  recordAdminAudit,
  requireAdminDb,
  requireAdminMutation,
  type AdminAuthContext,
  type AdminD1Database,
} from "./admin-auth";

export const MCP_TOKEN_SECONDS = 90 * 24 * 60 * 60;
export const MCP_READ_SCOPE = "mcp:read";

type MachineTokenRow = {
  id: string;
  user_id: string;
  name: string;
  token_hash: string;
  token_hint: string;
  scopes: string;
  created_at: string;
  expires_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export async function requireMcpReadToken(
  context: Pick<AdminAuthContext, "request" | "locals">,
): Promise<{ tokenId: string; userId: string; name: string }> {
  const db = context.locals.runtime?.env.DB as AdminD1Database | undefined;
  const bearer = bearerToken(context.request.headers.get("authorization"));
  if (!db || !bearer) throw mcpUnauthorized();

  const row = await db
    .prepare(
      `SELECT * FROM admin_machine_tokens
       WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ?
       LIMIT 1`,
    )
    .bind(await hashToken(bearer), nowIso())
    .first<MachineTokenRow>();
  if (!row || !parseScopes(row.scopes).includes(MCP_READ_SCOPE)) {
    throw mcpUnauthorized();
  }

  await db
    .prepare(
      `UPDATE admin_machine_tokens
       SET last_used_at = ?, last_used_ip_hash = ?
       WHERE id = ? AND revoked_at IS NULL`,
    )
    .bind(nowIso(), await requestIpHash(context.request), row.id)
    .run();
  return { tokenId: row.id, userId: row.user_id, name: row.name };
}

export async function createMcpToken(
  context: AdminAuthContext,
): Promise<Response> {
  const principal = await requireAdminMutation(context, "identity:manage");
  const body = (await context.request.json().catch(() => null)) as {
    name?: unknown;
  } | null;
  const name = cleanTokenName(body?.name);
  if (!name) {
    throw adminJson({ error: "machine_token_name_required" }, { status: 400 });
  }
  const db = requireAdminDb(context);
  const created = await insertMcpToken(db, {
    userId: principal.userId,
    sessionId: principal.sessionId,
    name,
  });
  await recordAdminAudit(db, {
    eventType: "admin.machine_token.created",
    userId: principal.userId,
    sessionId: principal.sessionId,
    credentialId: principal.credentialId,
    summary: `created named MCP read token ${name}`,
    metadata: { token_id: created.id, expires_at: created.expiresAt },
  });
  return adminJson({
    token: created.token,
    token_id: created.id,
    name,
    scopes: [MCP_READ_SCOPE],
    expires_at: created.expiresAt,
  });
}

export async function rotateMcpToken(
  context: AdminAuthContext,
): Promise<Response> {
  const principal = await requireAdminMutation(context, "identity:manage");
  const db = requireAdminDb(context);
  const body = (await context.request.json().catch(() => null)) as {
    token_id?: unknown;
  } | null;
  if (!body || typeof body.token_id !== "string" || !body.token_id) {
    throw adminJson({ error: "machine_token_id_required" }, { status: 400 });
  }
  const previous = await db
    .prepare(
      `SELECT * FROM admin_machine_tokens
       WHERE id = ? AND user_id = ? AND revoked_at IS NULL LIMIT 1`,
    )
    .bind(body.token_id, principal.userId)
    .first<MachineTokenRow>();
  if (!previous) {
    throw adminJson({ error: "machine_token_not_found" }, { status: 404 });
  }
  if (!db.batch) {
    throw adminJson({ error: "machine_token_batch_required" }, { status: 503 });
  }
  const created = await generateMcpToken();
  const rotatedAt = nowIso();
  const results = await db.batch([
    db
      .prepare(
        `INSERT INTO admin_machine_tokens
          (id, user_id, name, token_hash, token_hint, scopes,
           created_by_session_id, created_at, expires_at)
         SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?
         FROM admin_machine_tokens
         WHERE id = ? AND user_id = ? AND revoked_at IS NULL`,
      )
      .bind(
        created.id,
        principal.userId,
        previous.name,
        created.tokenHash,
        created.token.slice(-8),
        JSON.stringify([MCP_READ_SCOPE]),
        principal.sessionId,
        created.createdAt,
        created.expiresAt,
        previous.id,
        principal.userId,
      ),
    db
      .prepare(
        `UPDATE admin_machine_tokens
       SET rotated_at = ?, rotated_to_token_id = ?, revoked_at = ?,
           revoked_by_session_id = ?
       WHERE id = ? AND revoked_at IS NULL`,
      )
      .bind(rotatedAt, created.id, rotatedAt, principal.sessionId, previous.id),
  ]);
  if (results.some((result) => resultChanges(result) !== 1)) {
    await db
      .prepare(
        `UPDATE admin_machine_tokens
         SET revoked_at = ?, revoked_by_session_id = ?
         WHERE id = ? AND revoked_at IS NULL`,
      )
      .bind(nowIso(), principal.sessionId, created.id)
      .run();
    throw adminJson({ error: "machine_token_rotation_raced" }, { status: 409 });
  }
  await recordAdminAudit(db, {
    eventType: "admin.machine_token.rotated",
    userId: principal.userId,
    sessionId: principal.sessionId,
    credentialId: principal.credentialId,
    summary: `rotated named MCP read token ${previous.name}`,
    metadata: { old_token_id: previous.id, new_token_id: created.id },
  });
  return adminJson({
    token: created.token,
    token_id: created.id,
    name: previous.name,
    scopes: [MCP_READ_SCOPE],
    expires_at: created.expiresAt,
  });
}

export async function revokeMcpToken(
  context: AdminAuthContext,
): Promise<Response> {
  const principal = await requireAdminMutation(context, "identity:manage");
  const db = requireAdminDb(context);
  const body = (await context.request.json().catch(() => null)) as {
    token_id?: unknown;
  } | null;
  if (!body || typeof body.token_id !== "string" || !body.token_id) {
    throw adminJson({ error: "machine_token_id_required" }, { status: 400 });
  }
  const revokedAt = nowIso();
  const result = await db
    .prepare(
      `UPDATE admin_machine_tokens
       SET revoked_at = ?, revoked_by_session_id = ?
       WHERE id = ? AND user_id = ? AND revoked_at IS NULL`,
    )
    .bind(revokedAt, principal.sessionId, body.token_id, principal.userId)
    .run();
  if (resultChanges(result) !== 1) {
    throw adminJson({ error: "machine_token_not_found" }, { status: 404 });
  }
  await recordAdminAudit(db, {
    eventType: "admin.machine_token.revoked",
    userId: principal.userId,
    sessionId: principal.sessionId,
    credentialId: principal.credentialId,
    summary: "revoked one named MCP read token",
    metadata: { token_id: body.token_id },
  });
  return adminJson({ ok: true });
}

export function bearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer ([A-Za-z0-9_-]{32,256})$/.exec(header);
  return match?.[1] ?? null;
}

function mcpUnauthorized(): Response {
  return adminJson(
    { error: "mcp_bearer_token_required", required_scope: MCP_READ_SCOPE },
    {
      status: 401,
      headers: { "www-authenticate": 'Bearer scope="mcp:read"' },
    },
  );
}

async function insertMcpToken(
  db: AdminD1Database,
  input: { userId: string; sessionId: string; name: string },
): Promise<{ token: string; id: string; expiresAt: string }> {
  const created = await generateMcpToken();
  await db
    .prepare(
      `INSERT INTO admin_machine_tokens
        (id, user_id, name, token_hash, token_hint, scopes,
         created_by_session_id, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      created.id,
      input.userId,
      input.name,
      created.tokenHash,
      created.token.slice(-8),
      JSON.stringify([MCP_READ_SCOPE]),
      input.sessionId,
      created.createdAt,
      created.expiresAt,
    )
    .run();
  return created;
}

async function generateMcpToken(): Promise<{
  token: string;
  tokenHash: string;
  id: string;
  createdAt: string;
  expiresAt: string;
}> {
  const token = `apmcp_${randomToken(32)}`;
  const id = crypto.randomUUID();
  const createdAt = nowIso();
  const expiresAt = new Date(
    Date.now() + MCP_TOKEN_SECONDS * 1000,
  ).toISOString();
  return { token, tokenHash: await hashToken(token), id, createdAt, expiresAt };
}

function cleanTokenName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/\s+/g, " ").slice(0, 80);
  return cleaned || null;
}

function parseScopes(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((scope): scope is string => typeof scope === "string")
      : [];
  } catch {
    return [];
  }
}

async function requestIpHash(request: Request): Promise<string> {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  return hashToken(`mcp-ip:${ip}`);
}

function resultChanges(result: { meta?: unknown }): number {
  return Number(
    (result.meta as { changes?: number } | undefined)?.changes ?? 0,
  );
}
