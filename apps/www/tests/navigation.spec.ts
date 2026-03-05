import { test, expect } from "@playwright/test";

test.describe("navigation between pages", () => {
  test("nav links navigate to correct pages", async ({ page }) => {
    await page.goto("/");

    const nav = page.locator("nav");

    await nav.getByRole("link", { name: /work/i }).click();
    await expect(page).toHaveURL(/\/work/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /selected systems and products/i,
      }),
    ).toBeVisible();

    await nav.getByRole("link", { name: /thoughts/i }).click();
    await expect(page).toHaveURL(/\/thoughts/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /writing, systems, and product notes/i,
      }),
    ).toBeVisible();

    await nav.getByRole("link", { name: /connect/i }).click();
    await expect(page).toHaveURL(/\/connect/);

    await nav.getByRole("link", { name: /claude/i }).click();
    await expect(page).toHaveURL(/\/claude/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /claude code systems that ship/i,
      }),
    ).toBeVisible();
  });
});
