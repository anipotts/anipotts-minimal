import { test, expect } from "@playwright/test";

test("home page renders hero", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: /hi, i'm ani\./i }),
  ).toBeVisible();
});
