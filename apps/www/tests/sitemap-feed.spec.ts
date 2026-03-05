import { test, expect } from "@playwright/test";

test.describe("sitemap and RSS feed", () => {
  test("sitemap.xml returns valid XML with expected URLs", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);

    const contentType = response.headers()["content-type"] ?? "";
    expect(contentType).toMatch(/xml/);

    const body = await response.text();
    expect(body).toContain('<?xml');
    expect(body).toContain("<urlset");
    expect(body).toContain("https://anipotts.com");
    expect(body).toContain("https://anipotts.com/work");
    expect(body).toContain("https://anipotts.com/thoughts");
    expect(body).toContain("https://anipotts.com/claude");
    expect(body).toContain("https://anipotts.com/connect");
  });

  test("feed.xml returns valid RSS XML", async ({ request }) => {
    const response = await request.get("/feed.xml");
    expect(response.status()).toBe(200);

    const contentType = response.headers()["content-type"] ?? "";
    expect(contentType).toMatch(/xml/);

    const body = await response.text();
    expect(body).toContain('<?xml');
    expect(body).toContain("<rss");
    expect(body).toContain("<channel>");
    expect(body).toContain("<title>ani potts</title>");
    expect(body).toContain("https://anipotts.com");
  });

  test("robots.txt is served", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toContain("User-agent");
    expect(body).toContain("Disallow: /admin");
    expect(body).toContain("Disallow: /api/");
    expect(body).toContain("Sitemap:");
  });
});
