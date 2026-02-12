import { describe, expect, it, vi, afterEach } from "vitest";
import { formatShortRelativeTime, formatNumber } from "./formatters";

const baseTime = new Date("2024-01-01T00:00:00Z");

describe("formatShortRelativeTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns never for null", () => {
    expect(formatShortRelativeTime(null)).toBe("never");
  });

  it("returns just now for under a minute", () => {
    vi.useFakeTimers();
    vi.setSystemTime(baseTime);
    const iso = new Date(baseTime.getTime() - 30 * 1000).toISOString();
    expect(formatShortRelativeTime(iso)).toBe("just now");
  });

  it("returns minutes for under an hour", () => {
    vi.useFakeTimers();
    vi.setSystemTime(baseTime);
    const iso = new Date(baseTime.getTime() - 5 * 60 * 1000).toISOString();
    expect(formatShortRelativeTime(iso)).toBe("5m ago");
  });

  it("returns hours for under a day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(baseTime);
    const iso = new Date(baseTime.getTime() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatShortRelativeTime(iso)).toBe("2h ago");
  });

  it("returns days for more than a day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(baseTime);
    const iso = new Date(baseTime.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatShortRelativeTime(iso)).toBe("3d ago");
  });
});

describe("formatNumber", () => {
  it("formats numbers with commas", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });
});
