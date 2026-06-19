import { describe, expect, it, afterEach } from "vitest";
import { getAllSectionUrls, getSectionUrl, isDevelopment } from "./urls";

const originalEnv = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = originalEnv;
});

describe("getSectionUrl", () => {
  it("returns mapped sections", () => {
    expect(getSectionUrl("thoughts")).toBe("/thoughts");
    expect(getSectionUrl("connect")).toBe("/orchestrating");
    expect(getSectionUrl("links")).toBe("/orchestrating");
    expect(getSectionUrl("www")).toBe("/");
  });

  it("falls back to /{section}", () => {
    expect(getSectionUrl("unknown")).toBe("/unknown");
  });
});

describe("getAllSectionUrls", () => {
  it("returns a list of sections", () => {
    const sections = getAllSectionUrls();
    expect(sections.length).toBeGreaterThan(0);
    expect(sections).toEqual(
      expect.arrayContaining([{ name: "www", url: "/" }]),
    );
  });
});

describe("isDevelopment", () => {
  it("returns true when NODE_ENV is development", () => {
    process.env.NODE_ENV = "development";
    expect(isDevelopment()).toBe(true);
  });

  it("returns false when NODE_ENV is production", () => {
    process.env.NODE_ENV = "production";
    expect(isDevelopment()).toBe(false);
  });
});
