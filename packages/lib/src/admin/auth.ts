/**
 * Shared admin authentication helpers.
 * Each Next.js app wraps these in its own "use server" actions.ts
 * to handle cookies (which are framework-specific).
 */

import crypto from "node:crypto";
import { authenticator } from "otplib";

/** Cookie name used across all admin sessions */
export const ADMIN_COOKIE = "admin_session";
export const ADMIN_CSRF_COOKIE = "admin_csrf";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const ADMIN_PASSWORD_HASH_PREFIX = "pbkdf2_sha256";
const ADMIN_PASSWORD_HASH_ITERATIONS = 210000;

/** Cookie options for admin session */
export const ADMIN_COOKIE_OPTIONS: {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  maxAge: number;
} = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
};

export const ADMIN_CSRF_COOKIE_OPTIONS: {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  maxAge: number;
} = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
};

export function createAdminCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashAdminPassword(password: string, salt?: string): string {
  const resolvedSalt = salt ?? crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(
      password,
      resolvedSalt,
      ADMIN_PASSWORD_HASH_ITERATIONS,
      32,
      "sha256",
    )
    .toString("hex");
  return [
    ADMIN_PASSWORD_HASH_PREFIX,
    ADMIN_PASSWORD_HASH_ITERATIONS.toString(),
    resolvedSalt,
    hash,
  ].join("$");
}

function verifyAdminPasswordHash(password: string, stored: string): boolean {
  const [prefix, iterationsRaw, salt, expected] = stored.split("$");
  if (
    prefix !== ADMIN_PASSWORD_HASH_PREFIX ||
    !iterationsRaw ||
    !salt ||
    !expected
  ) {
    return false;
  }
  const iterations = Number(iterationsRaw);
  if (!Number.isInteger(iterations) || iterations < 100000) return false;
  const actual = crypto
    .pbkdf2Sync(password, salt, iterations, 32, "sha256")
    .toString("hex");
  const actualBuf = Buffer.from(actual, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (actualBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

export function validateAdminPasswordCandidate(password: string): {
  success: boolean;
  error?: string;
} {
  if (password.length < 12) {
    return { success: false, error: "Password must be at least 12 characters" };
  }
  if (password.length > 200) {
    return { success: false, error: "Password is too long" };
  }
  return { success: true };
}

/**
 * Verify a password against the provided admin password.
 * The caller (server action) should pass process.env.ADMIN_PASSWORD
 * to ensure proper Next.js env loading in monorepo setups.
 */
export function verifyAdminPassword(
  password: string,
  adminPassword: string | undefined,
): {
  success: boolean;
  error?: string;
} {
  if (!adminPassword) {
    return { success: false, error: "Admin password not configured on server" };
  }
  if (adminPassword.startsWith(`${ADMIN_PASSWORD_HASH_PREFIX}$`)) {
    return verifyAdminPasswordHash(password, adminPassword)
      ? { success: true }
      : { success: false, error: "Invalid password" };
  }
  // Hash both values so timingSafeEqual always compares equal-length buffers,
  // avoiding a timing leak on password length differences.
  const passwordHash = crypto.createHash("sha256").update(password).digest();
  const adminHash = crypto.createHash("sha256").update(adminPassword).digest();
  if (crypto.timingSafeEqual(passwordHash, adminHash)) {
    return { success: true };
  }
  return { success: false, error: "Invalid password" };
}

/**
 * Verify a TOTP against the provided secret.
 * The caller should pass process.env.ADMIN_TOTP_SECRET.
 */
export function verifyAdminTotp(
  totp: string,
  secret: string | undefined,
): {
  success: boolean;
  error?: string;
} {
  if (!secret) {
    return {
      success: false,
      error: "Admin TOTP secret not configured on server",
    };
  }
  const token = totp.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(token)) {
    return { success: false, error: "TOTP must be exactly 6 digits" };
  }
  const isValid = authenticator.check(token, secret);
  if (isValid) {
    return { success: true };
  }
  return { success: false, error: "Invalid TOTP" };
}

/**
 * Create an HMAC-signed session token embedding the current timestamp.
 * Format: `<timestamp>.<hmac-hex>`
 */
export function createSessionToken(secret: string): string {
  const ts = Date.now().toString();
  const hmac = crypto.createHmac("sha256", secret).update(ts).digest("hex");
  return `${ts}.${hmac}`;
}

/**
 * Verify an HMAC-signed session token.
 * Returns true only if the signature is valid and the token is not expired.
 */
export function verifySessionToken(
  token: string,
  secret: string,
  maxAgeSeconds = ADMIN_SESSION_MAX_AGE_SECONDS,
): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [ts, hmac] = parts;
  if (!ts || !hmac) return false;

  const expected = crypto.createHmac("sha256", secret).update(ts).digest("hex");
  const hmacBuf = Buffer.from(hmac, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (hmacBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(hmacBuf, expectedBuf)) return false;

  if (Date.now() - parseInt(ts) >= maxAgeSeconds * 1000) return false;

  return true;
}
