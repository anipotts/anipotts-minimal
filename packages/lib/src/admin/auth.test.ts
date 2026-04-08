import crypto from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  verifyAdminPassword,
  verifyAdminTotp,
  createSessionToken,
  verifySessionToken,
  ADMIN_COOKIE,
  ADMIN_COOKIE_OPTIONS,
} from "./auth";

describe("verifyAdminPassword", () => {
  it("returns success for correct password", () => {
    const result = verifyAdminPassword("mypassword", "mypassword");
    expect(result).toEqual({ success: true });
  });

  it("returns error for incorrect password", () => {
    const result = verifyAdminPassword("wrong", "mypassword");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid password");
  });

  it("returns error when admin password is undefined", () => {
    const result = verifyAdminPassword("anything", undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Admin password not configured on server");
  });

  it("returns error for empty string vs non-empty", () => {
    const result = verifyAdminPassword("", "secret");
    expect(result.success).toBe(false);
  });

  it("handles passwords with special characters", () => {
    const pw = "p@$$w0rd!#%^&*()";
    const result = verifyAdminPassword(pw, pw);
    expect(result).toEqual({ success: true });
  });

  it("is case-sensitive", () => {
    const result = verifyAdminPassword("Password", "password");
    expect(result.success).toBe(false);
  });
});

describe("verifyAdminTotp", () => {
  it("returns error when secret is undefined", () => {
    const result = verifyAdminTotp("123456", undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Admin TOTP secret not configured on server");
  });

  it("rejects non-6-digit TOTP", () => {
    const result = verifyAdminTotp("12345", "JBSWY3DPEHPK3PXP");
    expect(result.success).toBe(false);
    expect(result.error).toBe("TOTP must be exactly 6 digits");
  });

  it("rejects TOTP with letters", () => {
    const result = verifyAdminTotp("abc123", "JBSWY3DPEHPK3PXP");
    expect(result.success).toBe(false);
    expect(result.error).toBe("TOTP must be exactly 6 digits");
  });

  it("strips whitespace from TOTP before validation", () => {
    // "12 34 56" should become "123456" which is valid format
    const result = verifyAdminTotp("12 34 56", "JBSWY3DPEHPK3PXP");
    // Should not fail with "must be 6 digits" since whitespace is stripped
    expect(result.error).not.toBe("TOTP must be exactly 6 digits");
  });
});

describe("createSessionToken / verifySessionToken", () => {
  const secret = "test-secret-key";

  it("creates a token in timestamp.hmac format", () => {
    const token = createSessionToken(secret);
    const parts = token.split(".");
    expect(parts).toHaveLength(2);
    expect(Number(parts[0])).toBeGreaterThan(0);
    expect(parts[1]).toMatch(/^[a-f0-9]+$/);
  });

  it("round-trips: created token verifies successfully", () => {
    const token = createSessionToken(secret);
    expect(verifySessionToken(token, secret)).toBe(true);
  });

  it("rejects token with wrong secret", () => {
    const token = createSessionToken(secret);
    expect(verifySessionToken(token, "wrong-secret")).toBe(false);
  });

  it("rejects tampered timestamp", () => {
    const token = createSessionToken(secret);
    const [, hmac] = token.split(".");
    const tampered = `${Date.now() - 1000}.${hmac}`;
    expect(verifySessionToken(tampered, secret)).toBe(false);
  });

  it("rejects tampered hmac", () => {
    const token = createSessionToken(secret);
    const [ts] = token.split(".");
    const tampered = `${ts}.${"0".repeat(64)}`;
    expect(verifySessionToken(tampered, secret)).toBe(false);
  });

  it("rejects malformed tokens", () => {
    expect(verifySessionToken("", secret)).toBe(false);
    expect(verifySessionToken("noperiod", secret)).toBe(false);
    expect(verifySessionToken("a.b.c", secret)).toBe(false);
  });

  it("rejects expired token (8+ hours old)", () => {
    const now = Date.now();
    // Restore Date.now for verification
    vi.restoreAllMocks();

    // Manually create an expired token
    const ts = (now - 28800 * 1000 - 1).toString();
    const hmac = crypto.createHmac("sha256", secret).update(ts).digest("hex");
    const expiredToken = `${ts}.${hmac}`;

    expect(verifySessionToken(expiredToken, secret)).toBe(false);
  });
});

describe("constants", () => {
  it("exports ADMIN_COOKIE name", () => {
    expect(ADMIN_COOKIE).toBe("admin_session");
  });

  it("exports secure cookie options", () => {
    expect(ADMIN_COOKIE_OPTIONS.httpOnly).toBe(true);
    expect(ADMIN_COOKIE_OPTIONS.secure).toBe(true);
    expect(ADMIN_COOKIE_OPTIONS.sameSite).toBe("lax");
    expect(ADMIN_COOKIE_OPTIONS.maxAge).toBe(28800);
  });
});
