import { test, expect } from "@playwright/test";

test("/dev redirects to /claude", async ({ page }) => {
  await page.goto("/dev");
  await expect(page).toHaveURL(/\/claude/);
});
