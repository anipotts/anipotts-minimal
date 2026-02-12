import { test, expect } from "@playwright/test";

test("thoughts list shows fallback when db missing", async ({ page }) => {
  await page.goto("/thoughts");
  await expect(
    page.getByText("Database unavailable. Content will appear when the connection is restored.")
  ).toBeVisible();
});
