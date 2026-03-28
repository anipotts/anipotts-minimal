/**
 * Shared admin authentication helpers.
 * Each Next.js app wraps these in its own "use server" actions.ts
 * to handle cookies (which are framework-specific).
 */

import crypto from "node:crypto";
import { authenticator } from "otplib";

/** Cookie name used across all admin sessions */
export const ADMIN_COOKIE = "admin_session";

/** Cookie options for admin session */
export const ADMIN_COOKIE_OPTIONS: {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  maxAge: number;
} = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  maxAge: 28800,
};

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
 * Returns true only if the signature is valid and the token is less than 8 hours old.
 */
export function verifySessionToken(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [ts, hmac] = parts;
  if (!ts || !hmac) return false;

  const expected = crypto.createHmac("sha256", secret).update(ts).digest("hex");
  const hmacBuf = Buffer.from(hmac, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (hmacBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(hmacBuf, expectedBuf)) return false;

  // Check timestamp is not older than 8 hours (28800 seconds)
  if (Date.now() - parseInt(ts) >= 28800 * 1000) return false;

  return true;
}
