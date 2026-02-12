import { describe, expect, it } from "vitest";
import { slugify } from "./index";

describe("slugify", () => {
  it("converts text to a URL-friendly slug", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  it("trims leading and trailing separators", () => {
    expect(slugify("--Hello--")).toBe("hello");
  });
});
