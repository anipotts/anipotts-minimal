export const ADMIN_DOMAINS = [
  "career",
  "content",
  "life",
  "fleet",
  "system",
] as const;

export type AdminDomain = (typeof ADMIN_DOMAINS)[number];

export const ADMIN_MACHINE_TOKEN_SCOPES = [
  "mcp:read",
  "projections:write",
  "actions:claim",
  "actions:proof",
] as const;

export type AdminMachineTokenScope =
  (typeof ADMIN_MACHINE_TOKEN_SCOPES)[number];

export const ADMIN_ACTION_STATES = [
  "proposed",
  "approved",
  "claimed",
  "succeeded",
  "failed",
  "expired",
  "cancelled",
] as const;

export type AdminActionState = (typeof ADMIN_ACTION_STATES)[number];

export type AdminActionRecord = {
  action_id: string;
  domain: AdminDomain;
  action_type: string;
  status: AdminActionState;
  idempotency_key: string;
  exact_scope: Record<string, unknown>;
  preview: Record<string, unknown>;
  proof_requirement: string;
  expires_at: string;
};

const ACTION_TRANSITIONS: Record<AdminActionState, AdminActionState[]> = {
  proposed: ["approved", "cancelled", "expired"],
  approved: ["claimed", "cancelled", "expired"],
  claimed: ["succeeded", "failed", "expired"],
  succeeded: [],
  failed: [],
  expired: [],
  cancelled: [],
};

const PBKDF2_ITERATIONS = 210_000;
const encoder = new TextEncoder();

export function isAdminDomain(value: unknown): value is AdminDomain {
  return ADMIN_DOMAINS.includes(value as AdminDomain);
}

export function isAdminMachineTokenScope(
  value: unknown,
): value is AdminMachineTokenScope {
  return ADMIN_MACHINE_TOKEN_SCOPES.includes(value as AdminMachineTokenScope);
}

export function hasAdminMachineScope(
  scopes: readonly AdminMachineTokenScope[],
  required: AdminMachineTokenScope,
): boolean {
  return scopes.includes(required);
}

export function canUseAdminMachineToken(
  token: {
    scopes: readonly AdminMachineTokenScope[];
    expiresAt?: string | null;
    revokedAt?: string | null;
  },
  required: AdminMachineTokenScope,
  now = new Date(),
): boolean {
  if (token.revokedAt) return false;
  if (token.expiresAt) {
    const expiresAt = Date.parse(token.expiresAt);
    if (!Number.isFinite(expiresAt) || expiresAt <= now.getTime()) return false;
  }
  return hasAdminMachineScope(token.scopes, required);
}

export function isAdminRateLimited(
  lockedUntil: string | null | undefined,
  now = new Date(),
): boolean {
  if (!lockedUntil) return false;
  const lockedUntilMs = Date.parse(lockedUntil);
  return Number.isFinite(lockedUntilMs) && lockedUntilMs > now.getTime();
}

export function isAdminSessionActive(
  session: { expiresAt: string; revokedAt?: string | null },
  now = new Date(),
): boolean {
  if (session.revokedAt) return false;
  const expiresAtMs = Date.parse(session.expiresAt);
  return Number.isFinite(expiresAtMs) && expiresAtMs > now.getTime();
}

export function canAuthorizeAdminPasswordReplacement(input: {
  hasNativeSession: boolean;
  hasPasskeySession: boolean;
  currentPasswordVerified: boolean;
}): boolean {
  return (
    input.hasPasskeySession ||
    (input.hasNativeSession && input.currentPasswordVerified)
  );
}

export function isAdminProjectionStale(
  sources: readonly { status?: unknown }[],
): boolean {
  return sources.some((source) => source.status !== "fresh");
}

export function isAdminIdempotencyConflict(error: unknown): boolean {
  return String(error).toLowerCase().includes("unique");
}

export function assertSanitizedAdminActionMetadata(value: unknown): void {
  const forbiddenKeys = [
    "attachment",
    "bcc",
    "body",
    "calendar_note",
    "cc",
    "content",
    "credential",
    "event_id",
    "message",
    "provider_id",
    "range",
    "recipient",
    "session",
    "spreadsheet_id",
    "subject",
    "to",
    "token",
    "values",
  ];
  const visit = (current: unknown): void => {
    if (typeof current === "string") {
      if (/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/.test(current)) {
        throw new Error("action metadata cannot contain an email address");
      }
      return;
    }
    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }
    if (!current || typeof current !== "object") return;
    for (const [key, item] of Object.entries(current)) {
      const normalized = key.toLowerCase();
      if (
        forbiddenKeys.some(
          (forbidden) =>
            normalized === forbidden ||
            normalized.startsWith(`${forbidden}_`) ||
            normalized.endsWith(`_${forbidden}`),
        )
      ) {
        throw new Error(`action metadata field is private: ${key}`);
      }
      visit(item);
    }
  };
  visit(value);
}

export function canTransitionAdminAction(
  from: AdminActionState,
  to: AdminActionState,
): boolean {
  return ACTION_TRANSITIONS[from].includes(to);
}

export function assertAdminActionTransition(
  from: AdminActionState,
  to: AdminActionState,
): void {
  if (!canTransitionAdminAction(from, to)) {
    throw new Error(`invalid admin action transition: ${from} -> ${to}`);
  }
}

export function isActionExpired(expiresAt: string, now = new Date()): boolean {
  const expiry = Date.parse(expiresAt);
  return !Number.isFinite(expiry) || expiry <= now.getTime();
}

export function assertSameOriginMutation(request: Request): void {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  const contentType = request.headers.get("content-type") ?? "";
  const csrf = request.headers.get("x-admin-csrf");

  if (origin !== url.origin) throw new Error("invalid mutation origin");
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new Error("mutation requires application/json");
  }
  if (csrf !== "same-origin") throw new Error("missing mutation csrf header");
}

export async function hashAdminPasswordWeb(
  password: string,
  salt: Uint8Array<ArrayBuffer> = crypto.getRandomValues(new Uint8Array(16)),
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS },
    key,
    256,
  );
  return `pbkdf2_sha256$${PBKDF2_ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(new Uint8Array(bits))}`;
}

export async function verifyAdminPasswordWeb(
  password: string,
  stored: string,
): Promise<boolean> {
  const [algorithm, iterationsText, saltText, expectedText] = stored.split("$");
  if (algorithm !== "pbkdf2_sha256") return false;
  const iterations = Number(iterationsText);
  if (iterations !== PBKDF2_ITERATIONS || !saltText || !expectedText) {
    return false;
  }

  const actual = await hashAdminPasswordWeb(password, fromBase64Url(saltText));
  const actualBytes = encoder.encode(actual);
  const expectedBytes = encoder.encode(stored);
  if (actualBytes.length !== expectedBytes.length) return false;
  let mismatch = 0;
  for (let index = 0; index < actualBytes.length; index += 1) {
    mismatch |= actualBytes[index]! ^ expectedBytes[index]!;
  }
  return mismatch === 0;
}

export function createOpaqueAdminToken(bytes = 32): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function hashOpaqueAdminToken(token: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return toBase64Url(new Uint8Array(hash));
}

export function constantTimeEqualAdminDigest(
  actual: string,
  expected: string,
): boolean {
  const actualBytes = encoder.encode(actual);
  const expectedBytes = encoder.encode(expected);
  if (actualBytes.length !== expectedBytes.length) return false;
  let mismatch = 0;
  for (let index = 0; index < actualBytes.length; index += 1) {
    mismatch |= actualBytes[index]! ^ expectedBytes[index]!;
  }
  return mismatch === 0;
}

export async function importAdminEncryptionKey(
  base64UrlKey: string,
): Promise<CryptoKey> {
  const raw = fromBase64Url(base64UrlKey);
  if (raw.byteLength !== 32)
    throw new Error("admin encryption key must be 32 bytes");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export type AdminEncryptionKeyring = {
  currentVersion: number;
  keys: ReadonlyMap<number, CryptoKey>;
};

export async function parseAdminEncryptionKeyring(input: {
  currentVersion?: string;
  keysJson?: string;
  legacyKey?: string;
}): Promise<AdminEncryptionKeyring> {
  const currentVersion = parseKeyVersion(input.currentVersion ?? "1");
  const encodedKeys = new Map<number, string>();

  if (input.keysJson) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(input.keysJson);
    } catch {
      throw new Error("admin encryption keyring is malformed");
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("admin encryption keyring is malformed");
    }
    for (const [versionText, encoded] of Object.entries(parsed)) {
      const version = parseKeyVersion(versionText);
      if (typeof encoded !== "string" || !encoded) {
        throw new Error("admin encryption keyring is malformed");
      }
      encodedKeys.set(version, encoded);
    }
  } else if (input.legacyKey) {
    if (currentVersion !== 1) {
      throw new Error("legacy admin encryption key only supports version 1");
    }
    encodedKeys.set(1, input.legacyKey);
  } else {
    throw new Error("admin encryption keyring is missing");
  }

  if (!encodedKeys.has(currentVersion)) {
    throw new Error("current admin encryption key version is unavailable");
  }
  const keys = new Map<number, CryptoKey>();
  for (const [version, encoded] of encodedKeys) {
    keys.set(version, await importAdminEncryptionKey(encoded));
  }
  return { currentVersion, keys };
}

export function resolveAdminEncryptionKey(
  keyring: AdminEncryptionKeyring,
  version: number,
): CryptoKey {
  const normalized = parseKeyVersion(String(version));
  const key = keyring.keys.get(normalized);
  if (!key) throw new Error("admin encryption key version is unavailable");
  return key;
}

function parseKeyVersion(value: string): number {
  if (!/^[1-9][0-9]*$/.test(value)) {
    throw new Error("admin encryption key version is malformed");
  }
  const version = Number(value);
  if (!Number.isSafeInteger(version)) {
    throw new Error("admin encryption key version is malformed");
  }
  return version;
}

export async function encryptAdminPayload(
  payload: unknown,
  key: CryptoKey,
  keyVersion: number,
): Promise<{ ciphertext: string; iv: string; key_version: number }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = encoder.encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext,
  );
  return {
    ciphertext: toBase64Url(new Uint8Array(ciphertext)),
    iv: toBase64Url(iv),
    key_version: keyVersion,
  };
}

export async function hashAdminActionPayload(
  payload: unknown,
): Promise<string> {
  const canonical = JSON.stringify(canonicalizeAdminActionPayload(payload));
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(canonical),
  );
  return toBase64Url(new Uint8Array(digest));
}

function canonicalizeAdminActionPayload(value: unknown): unknown {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("admin action payload contains a non-finite number");
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(canonicalizeAdminActionPayload);
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, item]) => [key, canonicalizeAdminActionPayload(item)]),
    );
  }
  throw new Error("admin action payload is not JSON serializable");
}

export async function decryptAdminPayload<T>(
  encrypted: { ciphertext: string; iv: string },
  key: CryptoKey,
): Promise<T> {
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64Url(encrypted.iv) },
    key,
    fromBase64Url(encrypted.ciphertext),
  );
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}

function toBase64Url(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
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
