import { test, expect } from "@playwright/test";

test.describe("public pages load correctly", () => {
  test("home page renders hero and key sections", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: /hi, i'm ani\./i }),
    ).toBeVisible();
  });

  test("work page renders catalog with filters", async ({ page }) => {
    const response = await page.goto("/work");
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /selected systems and products/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /^all$/i })).toBeVisible();
    await expect(page.locator("article").first()).toBeVisible();
  });

  test("thoughts page renders published entries", async ({ page }) => {
    const response = await page.goto("/thoughts");
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /writing, systems, and product notes/i,
      }),
    ).toBeVisible();
  });

  test("connect page renders contact form", async ({ page }) => {
    const response = await page.goto("/connect");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("claude page renders sections", async ({ page }) => {
    const response = await page.goto("/claude");
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /claude code systems that ship/i,
      }),
    ).toBeVisible();
    await expect(page.getByText(/sessions/i).first()).toBeVisible();
    await expect(page.getByText(/plugins/i).first()).toBeVisible();
  });
});
