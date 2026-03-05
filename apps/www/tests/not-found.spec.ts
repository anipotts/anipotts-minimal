import { test, expect } from "@playwright/test";

test("non-existent URL returns 404 page", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist-xyz");
  expect(response?.status()).toBe(404);
});
