import { describe, expect, it, beforeEach, vi } from "vitest";

describe("feature-flags", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("flags default to false when env vars are not set", async () => {
    delete process.env.NEXT_PUBLIC_FEATURE_FAVORITE_NUMBER;
    delete process.env.NEXT_PUBLIC_FEATURE_FILE_BROWSER;
    delete process.env.NEXT_PUBLIC_FEATURE_SYSTEM_MONITOR;

    const mod = await import("./index");
    expect(mod.featureFlags.favoriteNumber).toBe(false);
    expect(mod.featureFlags.fileBrowser).toBe(false);
    expect(mod.featureFlags.systemMonitor).toBe(false);
  });

  it("flags are true when env vars equal 'true'", async () => {
    process.env.NEXT_PUBLIC_FEATURE_FAVORITE_NUMBER = "true";
    process.env.NEXT_PUBLIC_FEATURE_FILE_BROWSER = "true";
    process.env.NEXT_PUBLIC_FEATURE_SYSTEM_MONITOR = "true";

    const mod = await import("./index");
    expect(mod.featureFlags.favoriteNumber).toBe(true);
    expect(mod.featureFlags.fileBrowser).toBe(true);
    expect(mod.featureFlags.systemMonitor).toBe(true);
  });

  it("flags are false for non-'true' values", async () => {
    process.env.NEXT_PUBLIC_FEATURE_FAVORITE_NUMBER = "1";
    process.env.NEXT_PUBLIC_FEATURE_FILE_BROWSER = "yes";
    process.env.NEXT_PUBLIC_FEATURE_SYSTEM_MONITOR = "TRUE";

    const mod = await import("./index");
    expect(mod.featureFlags.favoriteNumber).toBe(false);
    expect(mod.featureFlags.fileBrowser).toBe(false);
    expect(mod.featureFlags.systemMonitor).toBe(false);
  });

  it("isFeatureEnabled returns the flag value", async () => {
    process.env.NEXT_PUBLIC_FEATURE_FAVORITE_NUMBER = "true";
    delete process.env.NEXT_PUBLIC_FEATURE_FILE_BROWSER;

    const mod = await import("./index");
    expect(mod.isFeatureEnabled("favoriteNumber")).toBe(true);
    expect(mod.isFeatureEnabled("fileBrowser")).toBe(false);
  });
});
