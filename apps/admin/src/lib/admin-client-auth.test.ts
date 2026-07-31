import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AdminClientAuthError,
  adminMutationFetch,
  adminStepUpPath,
  getAdminCsrfToken,
} from "./admin-client-auth";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("admin client auth", () => {
  it("reads the session-bound csrf token without caching", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        authenticated: true,
        principal: principal(),
        csrf_token: "csrf-token",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getAdminCsrfToken()).resolves.toBe("csrf-token");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/auth/session",
      expect.objectContaining({
        cache: "no-store",
        credentials: "same-origin",
      }),
    );
  });

  it("adds x-admin-csrf to same-origin mutations", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          authenticated: true,
          principal: principal(),
          csrf_token: "csrf-token",
        }),
      )
      .mockResolvedValueOnce(Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await adminMutationFetch("/api/admin/content/editor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    expect(response.ok).toBe(true);
    const mutationInit = fetchMock.mock.calls[1]?.[1] as RequestInit;
    const headers = new Headers(mutationInit.headers);
    expect(headers.get("x-admin-csrf")).toBe("csrf-token");
    expect(headers.get("content-type")).toBe("application/json");
    expect(mutationInit.credentials).toBe("same-origin");
  });

  it("fails closed when no authenticated session can supply csrf", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ authenticated: false }, { status: 401 }),
        ),
    );
    await expect(getAdminCsrfToken()).rejects.toEqual(
      expect.objectContaining<Partial<AdminClientAuthError>>({
        status: 401,
        code: "admin_session_required",
      }),
    );
  });

  it("builds a sanitized same-origin step-up destination", () => {
    expect(adminStepUpPath("/content/edit/home?draft=1")).toBe(
      "/auth?stepup=1&next=%2Fcontent%2Fedit%2Fhome%3Fdraft%3D1",
    );
  });
});

function principal() {
  return {
    userId: "ani",
    role: "owner",
    sessionId: "session-1",
    authMethod: "passkey",
    stepUpAt: "2026-07-31T16:00:00.000Z",
    restriction: null,
    displayName: "Ani",
    credentialId: "credential-1",
  };
}
