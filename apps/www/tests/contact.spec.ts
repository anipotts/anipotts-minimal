import { test, expect } from "@playwright/test";

test("contact form submits successfully", async ({ page }) => {
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
    .getByLabel("Message", { exact: true })
    .fill(
      "Need help building a Claude Code workflow with review gates for a production repo.",
    );

  await page.getByLabel(/^name$/i).fill("Test User");
  await page.getByLabel(/^email$/i).fill("test@example.com");

  await page.getByRole("button", { name: /^send$/i }).click();
  await expect(page.getByRole("button", { name: /^sent$/i })).toBeVisible();
});
