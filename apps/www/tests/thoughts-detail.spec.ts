import { test, expect } from "@playwright/test";

test("thought detail shows offline state when db missing", async ({ page }) => {
  await page.goto("/thoughts/test");
  await expect(page.getByText("System Offline (Dev Mode)")).toBeVisible();
});
