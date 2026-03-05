import { test, expect } from "@playwright/test";

test.describe("security headers", () => {
  test("response includes security headers", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["strict-transport-security"]).toContain("max-age=");
    expect(headers["referrer-policy"]).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(headers["permissions-policy"]).toContain("geolocation=()");
    expect(headers["content-security-policy"]).toContain("default-src");
  });
});
