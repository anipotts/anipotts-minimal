import { test, expect } from "@playwright/test";

test("command composer contact flow submits", async ({ page }) => {
  await page.route("**/api/send", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "test" }),
    });
  });

  await page.goto("/connect");

  await page.getByRole("button", { name: /collab/i }).click();
  await page
    .getByLabel(/what are you trying to build\?/i)
    .fill("Need help building a Claude Code workflow with review gates for a production repo.");

  await page.getByRole("button", { name: /continue/i }).click();

  await page.getByLabel(/your name/i).fill("Test User");
  await page.getByLabel(/your email/i).fill("test@example.com");

  await page.getByRole("button", { name: /dispatch message/i }).click();
  await expect(page.getByText(/message sent/i)).toBeVisible();
});
