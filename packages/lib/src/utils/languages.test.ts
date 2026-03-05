import { describe, expect, it } from "vitest";
import { getLanguageColor, LANGUAGE_COLORS } from "./languages";

describe("getLanguageColor", () => {
  it("returns correct color for TypeScript", () => {
    expect(getLanguageColor("TypeScript")).toBe("#3178c6");
  });

  it("returns correct color for Python", () => {
    expect(getLanguageColor("Python")).toBe("#3572A5");
  });

  it("returns 'Other' color for unknown language", () => {
    expect(getLanguageColor("Brainfuck")).toBe(LANGUAGE_COLORS["Other"]);
  });

  it("returns 'Other' color for empty string", () => {
    expect(getLanguageColor("")).toBe(LANGUAGE_COLORS["Other"]);
  });

  it("is case-sensitive", () => {
    expect(getLanguageColor("typescript")).toBe(LANGUAGE_COLORS["Other"]);
  });
});

describe("LANGUAGE_COLORS", () => {
  it("has an 'Other' fallback entry", () => {
    expect(LANGUAGE_COLORS["Other"]).toBe("#6b7280");
  });

  it("all values are valid hex color strings", () => {
    for (const [, color] of Object.entries(LANGUAGE_COLORS)) {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
