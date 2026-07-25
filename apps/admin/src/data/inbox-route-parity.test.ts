import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Inbox route parity", () => {
  it("renders the same attention component at / and /inbox", async () => {
    const [root, inbox] = await Promise.all([
      readFile(new URL("../pages/index.astro", import.meta.url), "utf8"),
      readFile(new URL("../pages/inbox.astro", import.meta.url), "utf8"),
    ]);

    expect(root).toBe(inbox);
    expect(root).toContain("<AdminHome />");
  });
});
