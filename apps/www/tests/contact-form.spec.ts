import { test, expect } from "@playwright/test";

test.describe("contact form on /connect", () => {
  test("renders intent selector buttons", async ({ page }) => {
    await page.goto("/connect");
    await expect(page.getByRole("button", { name: /collab/i })).toBeVisible();
  });

  test("shows all form fields on page load", async ({ page }) => {
    await page.goto("/connect");
    await expect(page.getByLabel("Message", { exact: true })).toBeVisible();
    await expect(page.getByLabel(/^name$/i)).toBeVisible();
    // Use exact label to avoid matching the newsletter "Email address" field
    await expect(page.getByLabel(/^email$/i)).toBeVisible();
  });

  test("selecting intent highlights the button", async ({ page }) => {
    await page.goto("/connect");
    const collabBtn = page.getByRole("button", { name: /collab/i });
    await collabBtn.click();
    await expect(collabBtn).toHaveAttribute("aria-pressed", "true");
  });
});
