import { test, expect } from "@playwright/test";

// Middleware redirects localhost/admin to admin.localhost, which doesn't
// resolve in CI.  Setting the Host header to admin.localhost lets the
// middleware treat the request as the admin subdomain (rewrite, not redirect)
// while still connecting to localhost:3000.
test.use({
  extraHTTPHeaders: { Host: "admin.localhost:3000" },
});

test.describe("admin authentication", () => {
  test("admin page shows login form when not authenticated", async ({
    page,
  }) => {
    // Navigate to "/" because the admin.localhost Host header causes middleware
    // to rewrite every path under /admin/* — root is rewritten to /admin.
    await page.goto("/");
    await expect(page.locator("form")).toBeVisible();
    // The login button says "enter", not "log in"/"sign in"
    await expect(page.getByRole("button", { name: /enter/i })).toBeVisible();
  });

  test("admin page does not expose dashboard content without auth", async ({
    page,
  }) => {
    await page.goto("/");
    // Login form should be visible, not the dashboard
    await expect(page.locator("form")).toBeVisible();
    // Sidebar nav should not be visible when not authenticated
    await expect(page.locator("nav >> text=Pipeline")).not.toBeVisible();
  });
});
