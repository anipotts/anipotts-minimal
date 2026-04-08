import { test, expect } from "@playwright/test";

test.describe("admin authentication", () => {
  test("admin page shows login form when not authenticated", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page.locator("form")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /log\s*in|sign\s*in|submit/i }),
    ).toBeVisible();
  });

  test("admin page does not expose dashboard content without auth", async ({
    page,
  }) => {
    await page.goto("/admin");
    // Login form should be visible, not the dashboard
    await expect(page.locator("form")).toBeVisible();
    // Sidebar nav should not be visible when not authenticated
    await expect(page.locator("nav >> text=Pipeline")).not.toBeVisible();
  });
});
