import { describe, expect, it } from "vitest";
import { createHmac, pbkdf2Sync } from "node:crypto";
import {
  hasActivePasswordSession,
  loginWithPassword,
  PASSWORD_SESSION_COOKIE,
  passwordAuthConfigured,
} from "./password-auth";

// Independent fixtures preserve compatibility with the existing owner password format.
function hashAdminPassword(password: string): string {
  const salt = "password-auth-test";
  const hash = pbkdf2Sync(password, salt, 210000, 32, "sha256").toString("hex");
  return `pbkdf2_sha256$210000$${salt}$${hash}`;
}

function createSessionToken(secret: string): string {
  const timestamp = Date.now().toString();
  const signature = createHmac("sha256", secret)
    .update(timestamp)
    .digest("hex");
  return `${timestamp}.${signature}`;
}

function context({
  hash,
  password,
  origin = "http://localhost:4311",
  cookie,
}: {
  hash?: string;
  password?: string;
  origin?: string | null;
  cookie?: string;
} = {}) {
  const headers = new Headers({ "content-type": "application/json" });
  if (origin) headers.set("origin", origin);
  const url = new URL("http://localhost:4311/api/admin/password/login");
  return {
    request: new Request(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ password }),
    }),
    url,
    locals: {
      runtime: {
        env: {
          ADMIN_PASSWORD_HASH: hash,
        },
      },
    },
    cookies: {
      get(name: string) {
        return name === PASSWORD_SESSION_COOKIE && cookie
          ? { value: cookie }
          : undefined;
      },
    },
  } as never;
}

describe("password auth", () => {
  it("requires a hash-formatted owner password", () => {
    expect(passwordAuthConfigured(context())).toBe(false);
    expect(
      passwordAuthConfigured(context({ hash: "plain-text-is-not-accepted" })),
    ).toBe(false);
  });

  it("accepts only a signed, unexpired password session", async () => {
    const hash = hashAdminPassword("a sufficiently long owner password");
    expect(
      await hasActivePasswordSession(
        context({ hash, cookie: createSessionToken(hash) }),
      ),
    ).toBe(true);
    expect(
      await hasActivePasswordSession(context({ hash, cookie: "invalid" })),
    ).toBe(false);
  });

  it("rejects login without an exact same-origin request", async () => {
    const hash = hashAdminPassword("a sufficiently long owner password");
    const response = await loginWithPassword(
      context({
        hash,
        password: "a sufficiently long owner password",
        origin: "https://example.com",
      }),
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("creates a private owner session after password verification", async () => {
    const password = "a sufficiently long owner password";
    const hash = hashAdminPassword(password);
    const response = await loginWithPassword(context({ hash, password }));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("set-cookie")).toContain(
      `${PASSWORD_SESSION_COOKIE}=`,
    );
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=Lax");
    expect(response.headers.get("set-cookie")).not.toContain(password);
  });

  it("returns one generic error for an invalid password", async () => {
    const hash = hashAdminPassword("a sufficiently long owner password");
    const response = await loginWithPassword(
      context({ hash, password: "incorrect" }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "invalid_credentials" });
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
