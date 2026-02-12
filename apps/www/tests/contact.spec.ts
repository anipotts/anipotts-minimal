import { test, expect } from "@playwright/test";

test("contact form submits", async ({ page }) => {
  await page.route("**/api/send", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "test" }),
    });
  });

  await page.goto("/connect");

  await page.getByPlaceholder("Your Name").fill("Test User");
  await page.getByPlaceholder("Your Email").fill("test@example.com");
  await page.getByPlaceholder("Your Message").fill("Hello there");

  await page.getByRole("button", { name: /send message/i }).click();
  await expect(page.getByText("Message Sent")).toBeVisible();
});
