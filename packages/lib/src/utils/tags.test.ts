import { describe, expect, it } from "vitest";
import { parseTags } from "./tags";

describe("parseTags", () => {
  it("returns empty array for null", () => {
    expect(parseTags(null)).toEqual([]);
  });

  it("handles array values", () => {
    expect(parseTags([" a ", "", "b"])).toEqual(["a", "b"]);
  });

  it("handles comma separated string", () => {
    expect(parseTags("a, b, c")).toEqual(["a", "b", "c"]);
  });
});
