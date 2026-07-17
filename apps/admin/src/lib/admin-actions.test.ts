import { describe, expect, it } from "vitest";
import { proposeAdminAction } from "./admin-actions";

describe("admin action service boundary", () => {
  it("rejects a projection-adjacent mutation before database access", async () => {
    let databaseAccessed = false;
    const context = {
      request: new Request("https://admin.anipotts.com/api/admin/actions", {
        method: "POST",
        headers: {
          origin: "https://outside.invalid",
          "content-type": "application/json",
        },
        body: JSON.stringify({ domain: "career" }),
      }),
      locals: {
        runtime: {
          env: {
            get DB() {
              databaseAccessed = true;
              return undefined;
            },
          },
        },
      },
    } as never;

    await expect(proposeAdminAction(context)).rejects.toThrow("origin");
    expect(databaseAccessed).toBe(false);
  });
});
