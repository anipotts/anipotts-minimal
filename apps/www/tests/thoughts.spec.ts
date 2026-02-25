import { test, expect } from "@playwright/test";

test("thoughts list renders published entries", async ({ page }) => {
  await page.goto("/thoughts");
  await expect(
    page.getByRole("heading", { level: 1, name: /writing, systems, and product notes/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /search will be dead by 2030/i })).toBeVisible();
});
