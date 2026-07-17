import { beforeEach, describe, expect, it } from "vitest";
import { hashAdminPasswordWeb } from "@anipotts/lib/admin";
import {
  changePassword,
  hasActiveNativeSession,
  loginWithPassword,
  logoutNativeSession,
  requireMachineToken,
  revokeNativeSession,
} from "./native-auth";

class AuthDb {
  password!: { password_hash: string; must_change: number; updated_at: string };
  attempt: Record<string, unknown> | null = null;
  sessions: Array<Record<string, unknown>> = [];
  audit: Array<Record<string, unknown>> = [];
  prepare(query: string) {
    const db = this;
    let values: unknown[] = [];
    return {
      bind(...bound: unknown[]) {
        values = bound;
        return this;
      },
      async first<T>() {
        if (query.includes("admin_password_credentials"))
          return db.password as T;
        if (query.includes("admin_auth_attempts")) return db.attempt as T;
        if (query.includes("admin_auth_sessions"))
          return (db.sessions.find((row) => row.token_hash === values[0]) ??
            null) as T;
        if (query.includes("COUNT")) return { count: 0 } as T;
        return null as T;
      },
      async all<T>() {
        return { results: [] as T[] };
      },
      async run() {
        if (query.includes("INSERT INTO admin_auth_attempts")) {
          db.attempt = {
            actor_key: values[0],
            failure_count: values[1],
            window_started_at: values[2],
            locked_until: values[3],
            updated_at: values[4],
          };
        } else if (query.includes("DELETE FROM admin_auth_attempts")) {
          db.attempt = null;
        } else if (query.includes("INSERT INTO admin_auth_sessions")) {
          db.sessions.push({
            id: values[0],
            token_hash: values[1],
            user_id: values[2],
            auth_method: "password",
            created_at: values[3],
            expires_at: values[4],
            last_seen_at: values[5],
            revoked_at: null,
          });
        } else if (query.includes("last_seen_at =")) {
          const row = db.sessions.find((item) => item.id === values[1]);
          if (row) row.last_seen_at = values[0];
        } else if (query.includes("WHERE token_hash")) {
          const row = db.sessions.find((item) => item.token_hash === values[1]);
          if (row) row.revoked_at = values[0];
        } else if (query.includes("WHERE id =")) {
          const row = db.sessions.find(
            (item) => item.id === values[1] && !item.revoked_at,
          );
          if (!row) return { meta: { changes: 0 } };
          row.revoked_at = values[0];
          return { meta: { changes: 1 } };
        } else if (query.includes("SET password_hash")) {
          db.password = {
            password_hash: values[0] as string,
            must_change: 0,
            updated_at: values[1] as string,
          };
        } else if (
          query.includes("SET revoked_at") &&
          query.includes("WHERE revoked_at IS NULL")
        ) {
          for (const row of db.sessions)
            if (!row.revoked_at) row.revoked_at = values[0];
        } else if (query.includes("INSERT INTO admin_auth_audit")) {
          db.audit.push({
            event_type: values[1],
            auth_method: values[2],
            credential_ref: values[3],
            summary: values[4],
          });
        }
        return { meta: { changes: 1 } };
      },
    };
  }
  async batch() {
    return [];
  }
}

class CookieJar {
  values = new Map<string, string>();
  get(name: string) {
    const value = this.values.get(name);
    return value ? { value } : undefined;
  }
  set(name: string, value: string) {
    this.values.set(name, value);
  }
  delete(name: string) {
    this.values.delete(name);
  }
}

let db: AuthDb;
let cookies: CookieJar;
beforeEach(async () => {
  db = new AuthDb();
  db.password = {
    password_hash: await hashAdminPasswordWeb("temporary-password"),
    must_change: 1,
    updated_at: new Date().toISOString(),
  };
  cookies = new CookieJar();
});

function context(body: Record<string, unknown> = {}, jar = cookies) {
  return {
    request: new Request("https://admin.anipotts.com/api/admin/auth/login", {
      method: "POST",
      headers: {
        origin: "https://admin.anipotts.com",
        "content-type": "application/json",
        "x-admin-csrf": "same-origin",
        "user-agent": "test-agent",
      },
      body: JSON.stringify(body),
    }),
    url: new URL("https://admin.anipotts.com/api/admin/auth/login"),
    locals: { runtime: { env: { DB: db } } },
    cookies: jar,
  } as never;
}

describe("stateful native authentication", () => {
  it("accumulates failures, locks on five, returns 429, then resets an elapsed window", async () => {
    for (let count = 1; count <= 5; count += 1) {
      expect(
        (await loginWithPassword(context({ password: "wrong-value" }))).status,
      ).toBe(401);
      expect(db.attempt?.failure_count).toBe(count);
    }
    expect(db.attempt?.locked_until).toBeTruthy();
    expect(
      (await loginWithPassword(context({ password: "wrong-value" }))).status,
    ).toBe(429);
    db.attempt = {
      ...db.attempt,
      failure_count: 5,
      window_started_at: "2020-01-01T00:00:00.000Z",
      locked_until: null,
    };
    expect(
      (await loginWithPassword(context({ password: "wrong-value" }))).status,
    ).toBe(401);
    expect(db.attempt?.failure_count).toBe(1);
    expect(JSON.stringify(db.audit)).not.toContain("wrong-value");
    expect(JSON.stringify(db.audit)).not.toContain("test-agent");
  });

  it("clears failures on login and enforces session lookup, expiry, logout, and targeted revoke", async () => {
    db.attempt = {
      failure_count: 1,
      window_started_at: new Date().toISOString(),
      locked_until: null,
    };
    expect(
      (await loginWithPassword(context({ password: "temporary-password" })))
        .status,
    ).toBe(200);
    expect(db.attempt).toBeNull();
    expect(await hasActiveNativeSession(context())).toBe(true);
    expect(db.sessions[0]?.last_seen_at).toBeTruthy();
    db.sessions[0]!.expires_at = "2020-01-01T00:00:00.000Z";
    expect(await hasActiveNativeSession(context())).toBe(false);
    db.sessions[0]!.expires_at = "2099-01-01T00:00:00.000Z";
    expect(
      (await revokeNativeSession(context(), db.sessions[0]!.id as string))
        .status,
    ).toBe(200);
    expect(await hasActiveNativeSession(context())).toBe(false);
    await loginWithPassword(context({ password: "temporary-password" }));
    expect((await logoutNativeSession(context())).status).toBe(200);
    expect(cookies.get("admin_session")).toBeUndefined();
  });

  it("revokes prior sessions on replacement and creates a new valid login", async () => {
    await loginWithPassword(context({ password: "temporary-password" }));
    expect(
      (
        await changePassword(
          context({
            current_password: "temporary-password",
            password: "replacement-password",
          }),
        )
      ).status,
    ).toBe(200);
    expect(db.password.must_change).toBe(0);
    expect(db.sessions.every((row) => Boolean(row.revoked_at))).toBe(true);
    expect(
      (await loginWithPassword(context({ password: "replacement-password" })))
        .status,
    ).toBe(200);
    expect(await hasActiveNativeSession(context())).toBe(true);
  });
});

describe("machine-token service boundary", () => {
  const base = {
    id: "token-safe",
    name: "projection writer",
    scopes: JSON.stringify(["projections:write"]),
    expires_at: null,
    revoked_at: null,
  };
  it.each([
    ["wrong scope", { ...base, scopes: JSON.stringify(["mcp:read"]) }],
    ["expired", { ...base, expires_at: "2020-01-01T00:00:00.000Z" }],
    ["revoked", { ...base, revoked_at: "2020-01-01T00:00:00.000Z" }],
  ])("denies %s projection mutation", async (_label, row) => {
    db.prepare = () =>
      ({
        bind() {
          return this;
        },
        async first() {
          return row;
        },
        async run() {
          return { meta: { changes: 1 } };
        },
        async all() {
          return { results: [] };
        },
      }) as never;
    const response = await requireMachineToken(context(), "projections:write");
    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(401);
  });
});
