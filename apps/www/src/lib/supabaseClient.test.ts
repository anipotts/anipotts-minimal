import { describe, expect, it, afterEach, vi } from "vitest";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.resetModules();
});

describe("supabaseClient", () => {
  it("returns null client when env is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const mod = await import("./supabaseClient");
    expect(mod.isSupabaseConfigured).toBe(false);
    expect(mod.supabase).toBe(null);
  });

  it("returns client when env is set", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    const mod = await import("./supabaseClient");
    expect(mod.isSupabaseConfigured).toBe(true);
    expect(mod.supabase).not.toBe(null);
  });
});
