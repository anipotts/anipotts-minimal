import { describe, expect, it } from "vitest";
import { requireMachineToken } from "./native-auth";

function context(row: Record<string, unknown>) {
  const statement = {
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
  };
  return {
    request: new Request(
      "https://admin.anipotts.com/api/admin/projections/refresh",
      {
        headers: { authorization: `Bearer ${"a".repeat(43)}` },
      },
    ),
    locals: { runtime: { env: { DB: { prepare: () => statement } } } },
  } as never;
}

const base = {
  id: "token-safe",
  name: "projection writer",
  scopes: JSON.stringify(["projections:write"]),
  expires_at: null,
  revoked_at: null,
};

describe("machine-token service boundary", () => {
  it.each([
    ["wrong scope", { ...base, scopes: JSON.stringify(["mcp:read"]) }],
    ["expired", { ...base, expires_at: "2020-01-01T00:00:00.000Z" }],
    ["revoked", { ...base, revoked_at: "2020-01-01T00:00:00.000Z" }],
  ])("denies %s projection mutation", async (_label, row) => {
    const response = await requireMachineToken(
      context(row),
      "projections:write",
    );
    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(401);
  });
});
