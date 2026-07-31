import { describe, expect, it, vi } from "vitest";
import {
  ADMIN_SESSION_COOKIE,
  sessionCsrfToken,
  type AdminD1Database,
  type AdminD1PreparedStatement,
  type AdminPrincipal,
} from "./admin-auth";
import { revokeMcpToken, rotateMcpToken } from "./admin-machine-tokens";

const principal: AdminPrincipal = {
  userId: "ani",
  role: "owner",
  sessionId: "session-1",
  authMethod: "passkey",
  stepUpAt: new Date().toISOString(),
  restriction: null,
  displayName: "Ani",
  credentialId: "credential-1",
};

const previousToken = {
  id: "token-old",
  user_id: principal.userId,
  name: "codex read",
  token_hash: "old-hash",
  token_hint: "old-hint",
  scopes: JSON.stringify(["mcp:read"]),
  created_at: "2026-07-31T12:00:00.000Z",
  expires_at: "2026-10-29T12:00:00.000Z",
  last_used_at: null,
  revoked_at: null,
};

describe("admin machine token mutation", () => {
  it("rotates through one conditional D1 batch", async () => {
    const fake = fakeDatabase([
      { meta: { changes: 1 } },
      { meta: { changes: 1 } },
    ]);
    const context = await mutationContext(
      fake.db,
      "/api/admin/machine-tokens/rotate",
      {
        token_id: previousToken.id,
      },
    );

    const response = await rotateMcpToken(context as never);
    const data = (await response.json()) as {
      token: string;
      token_id: string;
      name: string;
    };

    expect(response.status).toBe(200);
    expect(data.token).toMatch(/^apmcp_[A-Za-z0-9_-]{43}$/);
    expect(data.token_id).not.toBe(previousToken.id);
    expect(data.name).toBe(previousToken.name);
    expect(fake.batch).toHaveBeenCalledOnce();

    const insert = fake.statements.find((statement) =>
      statement.query.includes("INSERT INTO admin_machine_tokens"),
    );
    const revoke = fake.statements.find((statement) =>
      statement.query.includes("SET rotated_at = ?"),
    );
    expect(insert?.query).toContain("FROM admin_machine_tokens");
    expect(insert?.query).toContain("revoked_at IS NULL");
    expect(insert?.values.at(-2)).toBe(previousToken.id);
    expect(revoke?.values.at(-1)).toBe(previousToken.id);
  });

  it("fails closed and revokes the replacement after a rotation race", async () => {
    const fake = fakeDatabase([
      { meta: { changes: 0 } },
      { meta: { changes: 0 } },
    ]);
    const context = await mutationContext(
      fake.db,
      "/api/admin/machine-tokens/rotate",
      {
        token_id: previousToken.id,
      },
    );

    const error = await rotateMcpToken(context as never).catch(
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(Response);
    expect((error as Response).status).toBe(409);
    expect(await (error as Response).json()).toEqual({
      error: "machine_token_rotation_raced",
    });

    const cleanup = fake.statements.find(
      (statement) =>
        statement.query.includes(
          "SET revoked_at = ?, revoked_by_session_id = ?",
        ) && !statement.query.includes("user_id = ?"),
    );
    expect(cleanup).toBeDefined();
    expect(cleanup?.values.at(-1)).not.toBe(previousToken.id);
  });

  it("revokes one active named token and audits the action", async () => {
    const fake = fakeDatabase([]);
    const context = await mutationContext(
      fake.db,
      "/api/admin/machine-tokens/revoke",
      {
        token_id: previousToken.id,
      },
    );

    const response = await revokeMcpToken(context as never);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });

    const revoke = fake.statements.find((statement) =>
      statement.query.includes("WHERE id = ? AND user_id = ?"),
    );
    const audit = fake.statements.find((statement) =>
      statement.query.includes("INSERT INTO admin_passkey_audit"),
    );
    expect(revoke?.values.at(-2)).toBe(previousToken.id);
    expect(revoke?.values.at(-1)).toBe(principal.userId);
    expect(audit?.values).toContain("admin.machine_token.revoked");
  });
});

type StatementRecord = {
  query: string;
  values: unknown[];
};

function fakeDatabase(batchResults: Array<{ meta: { changes: number } }>): {
  db: AdminD1Database;
  batch: ReturnType<typeof vi.fn>;
  statements: StatementRecord[];
} {
  const statements: StatementRecord[] = [];
  const batch = vi.fn(async () => batchResults);
  const db: AdminD1Database = {
    prepare(query: string): AdminD1PreparedStatement {
      const record: StatementRecord = { query, values: [] };
      statements.push(record);
      const statement: AdminD1PreparedStatement = {
        bind(...values: unknown[]) {
          record.values = values;
          return statement;
        },
        async first<T>() {
          return (
            query.includes("SELECT * FROM admin_machine_tokens")
              ? previousToken
              : null
          ) as T | null;
        },
        async run() {
          return { meta: { changes: 1 } };
        },
        async all<T>() {
          return { results: [] as T[], meta: { changes: 0 } };
        },
      };
      return statement;
    },
    batch,
  };
  return { db, batch, statements };
}

async function mutationContext(
  db: AdminD1Database,
  path: string,
  body: Record<string, unknown>,
) {
  const token = "opaque-session-token";
  const url = new URL(path, "https://admin.anipotts.com");
  const cookies = {
    get(name: string) {
      return name === ADMIN_SESSION_COOKIE ? { value: token } : undefined;
    },
  };
  const base = {
    request: new Request(url),
    url,
    locals: {
      adminPrincipal: principal,
      runtime: { env: { DB: db } },
    },
    cookies,
  };
  const csrf = await sessionCsrfToken(base as never);
  return {
    ...base,
    request: new Request(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: url.origin,
        "x-admin-csrf": csrf ?? "",
      },
      body: JSON.stringify(body),
    }),
  };
}
