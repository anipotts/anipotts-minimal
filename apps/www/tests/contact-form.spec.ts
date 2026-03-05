import { test, expect } from "@playwright/test";

test.describe("contact form on /connect", () => {
  test("renders intent selector buttons", async ({ page }) => {
    await page.goto("/connect");
    await expect(page.getByRole("button", { name: /collab/i })).toBeVisible();
  });

  test("shows message field after selecting intent", async ({ page }) => {
    await page.goto("/connect");
    await page.getByRole("button", { name: /collab/i }).click();
    await expect(
      page.getByLabel(/what are you trying to build/i),
    ).toBeVisible();
  });

  test("shows name and email fields on continue", async ({ page }) => {
    await page.goto("/connect");
    await page.getByRole("button", { name: /collab/i }).click();
    await page
      .getByLabel(/what are you trying to build/i)
      .fill("Test message for form validation");
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByLabel(/your name/i)).toBeVisible();
    await expect(page.getByLabel(/your email/i)).toBeVisible();
  });
});
