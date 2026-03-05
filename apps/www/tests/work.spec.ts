import { test, expect } from "@playwright/test";

test("work page renders catalog", async ({ page }) => {
  await page.goto("/work");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /selected systems and products/i,
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /^all$/i })).toBeVisible();
  await expect(page.locator("article").first()).toBeVisible();
});
