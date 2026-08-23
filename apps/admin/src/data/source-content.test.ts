import { describe, expect, it } from "vitest";
import { sourceContentRecords } from "./source-content";

describe("sourceContentRecords", () => {
  it("indexes canonical public projects and writing", () => {
    expect(sourceContentRecords.length).toBeGreaterThan(0);
    expect(sourceContentRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          surface: "projects",
          slug: "quantercise",
        }),
        expect.objectContaining({
          surface: "writing",
          slug: "awareness-is-alpha",
        }),
      ]),
    );
  });
});
