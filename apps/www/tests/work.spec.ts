import { test, expect } from "@playwright/test";

test("work page renders list", async ({ page }) => {
  await page.goto("/work");
  await expect(page.getByRole("heading", { level: 1, name: /work/i })).toBeVisible();
  await expect(page.locator("h3").first()).toBeVisible();
});
