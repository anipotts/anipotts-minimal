import { test, expect } from "@playwright/test";

test.describe("redirects resolve to correct destinations", () => {
  const permanentRedirects = [
    { from: "/lab", to: "/work" },
    { from: "/lab/some-project", to: "/work" },
    { from: "/links", to: "/connect" },
    { from: "/links/something", to: "/connect" },
    { from: "/dev", to: "/claude" },
    { from: "/dev/something", to: "/claude" },
    { from: "/updates", to: "/claude#proof" },
    { from: "/updates/something", to: "/claude#proof" },
    { from: "/metrics", to: "/claude#playbooks" },
    { from: "/metrics/something", to: "/claude#playbooks" },
    { from: "/status", to: "/claude#work-together" },
    { from: "/status/something", to: "/claude#work-together" },
    { from: "/docs", to: "/" },
    { from: "/docs/something", to: "/" },
  ];

  for (const { from, to } of permanentRedirects) {
    test(`${from} redirects to ${to}`, async ({ page }) => {
      await page.goto(from);
      const url = new URL(page.url());
      const destination = url.pathname + url.hash;
      expect(destination).toBe(to);
    });
  }
});
