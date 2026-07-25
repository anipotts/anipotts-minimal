import { beforeEach, describe, expect, it, vi } from "vitest";

const jose = vi.hoisted(() => ({
  createRemoteJWKSet: vi.fn(() => vi.fn()),
  jwtVerify: vi.fn(),
}));

vi.mock("jose", () => jose);

import { verifyAccessIdentity } from "./passkey-auth";

function context(headers: HeadersInit = {}, env: Record<string, string> = {}) {
  return {
    request: new Request("https://admin.anipotts.com/api/mcp", { headers }),
    url: new URL("https://admin.anipotts.com/api/mcp"),
    locals: { runtime: { env } },
  } as never;
}

describe("verifyAccessIdentity", () => {
  beforeEach(() => {
    jose.createRemoteJWKSet.mockClear();
    jose.jwtVerify.mockReset();
  });

  it("rejects spoofable access identity headers without a jwt", async () => {
    const identity = await verifyAccessIdentity(
      context(
        {
          "cf-access-authenticated-user-email": "spoofed@example.com",
          "cf-access-client-id": "spoofed-client",
        },
        {
          ACCESS_TEAM_DOMAIN: "https://team.cloudflareaccess.com",
          ACCESS_POLICY_AUD: "audience",
        },
      ),
    );

    expect(identity).toEqual({ verified: false, hint: null });
    expect(jose.jwtVerify).not.toHaveBeenCalled();
  });

  it("rejects a jwt when access configuration is unavailable", async () => {
    const identity = await verifyAccessIdentity(
      context({ "cf-access-jwt-assertion": "signed-token" }),
    );

    expect(identity).toEqual({ verified: false, hint: null });
    expect(jose.jwtVerify).not.toHaveBeenCalled();
  });

  it("accepts only a verified jwt with an email identity", async () => {
    jose.jwtVerify.mockResolvedValue({
      payload: { email: "ani@example.com" },
    });

    const identity = await verifyAccessIdentity(
      context(
        { "cf-access-jwt-assertion": "signed-token" },
        {
          ACCESS_TEAM_DOMAIN: "https://team.cloudflareaccess.com/",
          ACCESS_POLICY_AUD: "audience",
        },
      ),
    );

    expect(jose.createRemoteJWKSet).toHaveBeenCalledWith(
      new URL("https://team.cloudflareaccess.com/cdn-cgi/access/certs"),
    );
    expect(jose.jwtVerify).toHaveBeenCalledWith(
      "signed-token",
      expect.any(Function),
      {
        issuer: "https://team.cloudflareaccess.com",
        audience: "audience",
      },
    );
    expect(identity).toEqual({ verified: true, hint: "an***@example.com" });
  });

  it("fails closed when jwt verification rejects", async () => {
    jose.jwtVerify.mockRejectedValue(new Error("invalid signature"));

    const identity = await verifyAccessIdentity(
      context(
        { "cf-access-jwt-assertion": "bad-token" },
        {
          ACCESS_TEAM_DOMAIN: "https://team.cloudflareaccess.com",
          ACCESS_POLICY_AUD: "audience",
        },
      ),
    );

    expect(identity).toEqual({ verified: false, hint: null });
  });

  it("reuses the remote key set for the same access issuer", async () => {
    jose.jwtVerify.mockResolvedValue({
      payload: { email: "ani@example.com" },
    });
    const accessContext = context(
      { "cf-access-jwt-assertion": "signed-token" },
      {
        ACCESS_TEAM_DOMAIN: "https://cached.cloudflareaccess.com",
        ACCESS_POLICY_AUD: "audience",
      },
    );

    await verifyAccessIdentity(accessContext);
    await verifyAccessIdentity(accessContext);

    expect(jose.createRemoteJWKSet).toHaveBeenCalledTimes(1);
    expect(jose.jwtVerify).toHaveBeenCalledTimes(2);
  });
});
