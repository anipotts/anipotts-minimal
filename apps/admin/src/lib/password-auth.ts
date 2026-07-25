import type { APIContext } from "astro";

export const PASSWORD_SESSION_COOKIE = "admin_session";

const PASSWORD_HASH_PREFIX = "pbkdf2_sha256$";
const PASSWORD_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const localAttempts = new Map<string, number[]>();

type PasswordContext = Pick<
  APIContext,
  "cookies" | "locals" | "request" | "url"
>;

type D1Database = {
  prepare(query: string): {
    bind(...values: unknown[]): {
      first<T = unknown>(): Promise<T | null>;
      run(): Promise<unknown>;
    };
  };
};

export function passwordAuthConfigured(context: PasswordContext): boolean {
  return Boolean(passwordHash(context)?.startsWith(PASSWORD_HASH_PREFIX));
}

export async function hasActivePasswordSession(
  context: PasswordContext,
): Promise<boolean> {
  const hash = passwordHash(context);
  const token = context.cookies.get(PASSWORD_SESSION_COOKIE)?.value;
  if (!hash?.startsWith(PASSWORD_HASH_PREFIX) || !token) return false;
  return verifySessionToken(token, hash);
}

export async function loginWithPassword(
  context: PasswordContext,
): Promise<Response> {
  if (!sameOrigin(context.request, context.url)) {
    return privateJson({ error: "invalid_request" }, { status: 403 });
  }

  const hash = passwordHash(context);
  if (!hash?.startsWith(PASSWORD_HASH_PREFIX)) {
    return privateJson({ error: "password_unavailable" }, { status: 503 });
  }

  const limiterKey = requestLimiterKey(context.request);
  if (await isRateLimited(context, limiterKey)) {
    return privateJson({ error: "try_again_later" }, { status: 429 });
  }

  const body = await readPasswordBody(context.request);
  const verified = body !== null && (await verifyPassword(body.password, hash));
  await recordAttempt(context, verified, limiterKey);
  if (!verified) {
    return privateJson({ error: "invalid_credentials" }, { status: 401 });
  }

  return privateJson(
    { ok: true },
    {
      headers: {
        "set-cookie": sessionCookie(
          context.url,
          PASSWORD_SESSION_COOKIE,
          await createSessionToken(hash),
        ),
      },
    },
  );
}

export function logoutPassword(context: PasswordContext): Response {
  return privateJson(
    { ok: true },
    {
      headers: {
        "set-cookie": sessionCookie(
          context.url,
          PASSWORD_SESSION_COOKIE,
          "",
          0,
        ),
      },
    },
  );
}

function passwordHash(context: PasswordContext): string | undefined {
  return context.locals.runtime?.env.ADMIN_PASSWORD_HASH;
}

async function readPasswordBody(
  request: Request,
): Promise<{ password: string } | null> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return null;
  }
  try {
    const body = (await request.json()) as { password?: unknown };
    if (
      typeof body.password !== "string" ||
      body.password.length < 1 ||
      body.password.length > 200
    ) {
      return null;
    }
    return { password: body.password };
  } catch {
    return null;
  }
}

function sameOrigin(request: Request, url: URL): boolean {
  return request.headers.get("origin") === url.origin;
}

async function isRateLimited(
  context: PasswordContext,
  key: string,
): Promise<boolean> {
  const db = context.locals.runtime?.env.DB as D1Database | undefined;
  const since = new Date(Date.now() - ATTEMPT_WINDOW_MS).toISOString();
  if (db) {
    try {
      const row = await db
        .prepare(
          `SELECT COUNT(*) AS count
           FROM admin_passkey_audit
           WHERE event_type = 'password.authentication.denied'
             AND credential_id = ?
             AND created_at > ?`,
        )
        .bind(key, since)
        .first<{ count: number }>();
      return Number(row?.count ?? 0) >= MAX_ATTEMPTS;
    } catch {
      if (!import.meta.env.DEV) return true;
    }
  } else if (!import.meta.env.DEV) {
    return true;
  }

  const cutoff = Date.now() - ATTEMPT_WINDOW_MS;
  const recent = (localAttempts.get(key) ?? []).filter(
    (timestamp) => timestamp > cutoff,
  );
  localAttempts.set(key, recent);
  return recent.length >= MAX_ATTEMPTS;
}

async function recordAttempt(
  context: PasswordContext,
  verified: boolean,
  key: string,
): Promise<void> {
  const db = context.locals.runtime?.env.DB as D1Database | undefined;
  const eventType = verified
    ? "password.session.created"
    : "password.authentication.denied";
  if (db) {
    try {
      await db
        .prepare(
          `INSERT INTO admin_passkey_audit
            (id, event_type, credential_id, summary, created_at)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          eventType,
          key,
          verified
            ? "created owner password session"
            : "denied owner password authentication",
          new Date().toISOString(),
        )
        .run();
      return;
    } catch {
      if (!import.meta.env.DEV) return;
    }
  }
  if (!verified) {
    const attempts = localAttempts.get(key) ?? [];
    attempts.push(Date.now());
    localAttempts.set(key, attempts);
  } else {
    localAttempts.delete(key);
  }
}

function requestLimiterKey(request: Request): string {
  const source =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local";
  let hash = 2166136261;
  for (const character of source) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `password:${(hash >>> 0).toString(16)}`;
}

function sessionCookie(
  url: URL,
  name: string,
  value: string,
  maxAge = PASSWORD_SESSION_MAX_AGE_SECONDS,
): string {
  const attributes = [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (!isDevLoopback(url)) attributes.splice(3, 0, "Secure");
  return attributes.join("; ");
}

function isDevLoopback(url: URL): boolean {
  return (
    import.meta.env.DEV &&
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  );
}

async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [prefix, iterationsRaw, salt, expectedHex] = stored.split("$");
  const iterations = Number(iterationsRaw);
  if (
    prefix !== "pbkdf2_sha256" ||
    !Number.isInteger(iterations) ||
    iterations < 100000 ||
    !salt ||
    !expectedHex ||
    !/^[0-9a-f]{64}$/i.test(expectedHex)
  ) {
    return false;
  }
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: new TextEncoder().encode(salt),
      iterations,
    },
    key,
    256,
  );
  return equalBytes(new Uint8Array(bits), hexToBytes(expectedHex));
}

async function createSessionToken(secret: string): Promise<string> {
  const timestamp = Date.now().toString();
  return `${timestamp}.${await signTimestamp(timestamp, secret)}`;
}

async function verifySessionToken(
  token: string,
  secret: string,
): Promise<boolean> {
  const [timestamp, signature, extra] = token.split(".");
  if (!timestamp || !signature || extra) return false;
  const createdAt = Number(timestamp);
  if (
    !Number.isFinite(createdAt) ||
    createdAt > Date.now() ||
    Date.now() - createdAt >= PASSWORD_SESSION_MAX_AGE_SECONDS * 1000
  ) {
    return false;
  }
  const expected = await signTimestamp(timestamp, secret);
  return equalBytes(hexToBytes(signature), hexToBytes(expected));
}

async function signTimestamp(
  timestamp: string,
  secret: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(timestamp),
  );
  return bytesToHex(new Uint8Array(signature));
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left[index]! ^ right[index]!;
  }
  return mismatch === 0;
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) {
    return new Uint8Array();
  }
  return Uint8Array.from(
    hex.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
  );
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

function privateJson(data: unknown, init: ResponseInit = {}): Response {
  return Response.json(data, {
    ...init,
    headers: {
      "cache-control": "private, no-store",
      pragma: "no-cache",
      "referrer-policy": "no-referrer",
      ...(init.headers ?? {}),
    },
  });
}
