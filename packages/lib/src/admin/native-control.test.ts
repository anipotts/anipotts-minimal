import { describe, expect, it } from "vitest";
import {
  assertSanitizedAdminActionMetadata,
  assertSameOriginMutation,
  canAuthorizeAdminPasswordReplacement,
  canTransitionAdminAction,
  createOpaqueAdminToken,
  decryptAdminPayload,
  encryptAdminPayload,
  hashAdminPasswordWeb,
  hashOpaqueAdminToken,
  hasAdminMachineScope,
  importAdminEncryptionKey,
  isActionExpired,
  isAdminIdempotencyConflict,
  isAdminProjectionStale,
  isAdminRateLimited,
  isAdminSessionActive,
  verifyAdminPasswordWeb,
} from "./native-control";

describe("native admin control", () => {
  it("hashes passwords without retaining plaintext", async () => {
    const hash = await hashAdminPasswordWeb("a unique admin password");
    expect(hash).not.toContain("a unique admin password");
    expect(await verifyAdminPasswordWeb("a unique admin password", hash)).toBe(
      true,
    );
    expect(await verifyAdminPasswordWeb("wrong password", hash)).toBe(false);
  });

  it("hashes opaque tokens deterministically", async () => {
    const token = createOpaqueAdminToken();
    expect(token.length).toBeGreaterThan(32);
    expect(await hashOpaqueAdminToken(token)).toBe(
      await hashOpaqueAdminToken(token),
    );
  });

  it("encrypts action payloads with AES-GCM", async () => {
    const key = await importAdminEncryptionKey(createOpaqueAdminToken());
    const encrypted = await encryptAdminPayload(
      { recipient: "safe-test@example.com", content: "proof" },
      key,
      1,
    );
    expect(encrypted.ciphertext).not.toContain("safe-test@example.com");
    await expect(decryptAdminPayload(encrypted, key)).resolves.toEqual({
      recipient: "safe-test@example.com",
      content: "proof",
    });
  });

  it("keeps private confirmation fields out of action metadata", () => {
    expect(() =>
      assertSanitizedAdminActionMetadata({
        provider: "gmail",
        operation: "reply",
        summary: "reply to the confirmed recruiter thread",
      }),
    ).not.toThrow();
    expect(() =>
      assertSanitizedAdminActionMetadata({
        recipient: "safe-test@example.com",
      }),
    ).toThrow("private");
    expect(() =>
      assertSanitizedAdminActionMetadata({
        summary: "send to safe-test@example.com",
      }),
    ).toThrow("email");
  });

  it("allows one-way terminal action transitions", () => {
    expect(canTransitionAdminAction("proposed", "approved")).toBe(true);
    expect(canTransitionAdminAction("approved", "claimed")).toBe(true);
    expect(canTransitionAdminAction("claimed", "succeeded")).toBe(true);
    expect(canTransitionAdminAction("succeeded", "claimed")).toBe(false);
    expect(canTransitionAdminAction("claimed", "claimed")).toBe(false);
  });

  it("recognizes duplicate idempotency writes", () => {
    expect(
      isAdminIdempotencyConflict(new Error("UNIQUE constraint failed")),
    ).toBe(true);
    expect(isAdminIdempotencyConflict(new Error("database unavailable"))).toBe(
      false,
    );
  });

  it("treats invalid and elapsed expiries as expired", () => {
    const now = new Date("2026-07-16T12:00:00.000Z");
    expect(isActionExpired("2026-07-16T11:59:59.000Z", now)).toBe(true);
    expect(isActionExpired("not-a-date", now)).toBe(true);
    expect(isActionExpired("2026-07-17T12:00:00.000Z", now)).toBe(false);
  });

  it("requires same-origin JSON mutations with an explicit CSRF header", () => {
    const valid = new Request("https://admin.anipotts.com/api/admin/actions", {
      method: "POST",
      headers: {
        origin: "https://admin.anipotts.com",
        "content-type": "application/json",
        "x-admin-csrf": "same-origin",
      },
    });
    expect(() => assertSameOriginMutation(valid)).not.toThrow();

    const crossOrigin = new Request(
      "https://admin.anipotts.com/api/admin/actions",
      {
        method: "POST",
        headers: {
          origin: "https://evil.example",
          "content-type": "application/json",
          "x-admin-csrf": "same-origin",
        },
      },
    );
    expect(() => assertSameOriginMutation(crossOrigin)).toThrow("origin");
  });

  it("enforces the authentication failure lock window", () => {
    const now = new Date("2026-07-16T12:00:00.000Z");
    expect(isAdminRateLimited("2026-07-16T12:01:00.000Z", now)).toBe(true);
    expect(isAdminRateLimited("2026-07-16T11:59:00.000Z", now)).toBe(false);
    expect(isAdminRateLimited(null, now)).toBe(false);
  });

  it("rejects revoked and expired sessions", () => {
    const now = new Date("2026-07-16T12:00:00.000Z");
    expect(
      isAdminSessionActive({ expiresAt: "2026-07-17T12:00:00.000Z" }, now),
    ).toBe(true);
    expect(
      isAdminSessionActive(
        {
          expiresAt: "2026-07-17T12:00:00.000Z",
          revokedAt: "2026-07-16T11:00:00.000Z",
        },
        now,
      ),
    ).toBe(false);
    expect(
      isAdminSessionActive({ expiresAt: "2026-07-16T11:00:00.000Z" }, now),
    ).toBe(false);
  });

  it("allows password replacement through a passkey or verified password", () => {
    expect(
      canAuthorizeAdminPasswordReplacement({
        hasNativeSession: false,
        hasPasskeySession: true,
        currentPasswordVerified: false,
      }),
    ).toBe(true);
    expect(
      canAuthorizeAdminPasswordReplacement({
        hasNativeSession: true,
        hasPasskeySession: false,
        currentPasswordVerified: true,
      }),
    ).toBe(true);
    expect(
      canAuthorizeAdminPasswordReplacement({
        hasNativeSession: true,
        hasPasskeySession: false,
        currentPasswordVerified: false,
      }),
    ).toBe(false);
  });

  it("keeps machine token scopes independent", () => {
    expect(hasAdminMachineScope(["mcp:read"], "mcp:read")).toBe(true);
    expect(hasAdminMachineScope(["mcp:read"], "actions:claim")).toBe(false);
  });

  it("marks a projection stale when any source is incomplete", () => {
    expect(
      isAdminProjectionStale([{ status: "fresh" }, { status: "unavailable" }]),
    ).toBe(true);
    expect(
      isAdminProjectionStale([{ status: "fresh" }, { status: "fresh" }]),
    ).toBe(false);
  });
});
