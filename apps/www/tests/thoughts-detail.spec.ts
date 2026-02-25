import { test, expect } from "@playwright/test";

test("thought detail renders markdown post", async ({ page }) => {
  await page.goto("/thoughts/search-will-be-dead-by-2030");
  await expect(
    page.getByRole("heading", { level: 1, name: /search will be dead by 2030/i }),
  ).toBeVisible();
  await expect(page.getByText(/Search is not dead as infrastructure/i)).toBeVisible();
});
