import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("cloudflare:email", () => ({
  EmailMessage: class {
    constructor(
      public from: string,
      public to: string,
      public raw: string,
    ) {}
  },
}));

import { sendViaBinding } from "./send";
import type { SendEmailBinding } from "./types";

const baseMsg = {
  from: "Test <noreply@anipotts.com>",
  to: "hello@anipotts.com",
  subject: "Hi",
  text: "body",
};

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("sendViaBinding", () => {
  it("succeeds on first attempt", async () => {
    const binding: SendEmailBinding = {
      send: vi.fn().mockResolvedValue(undefined),
    };
    const result = await sendViaBinding(binding, baseMsg);
    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(1);
    expect(result.correlationId).toBeTruthy();
    expect(binding.send).toHaveBeenCalledTimes(1);
  });

  it("retries and recovers", async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error("transient"))
      .mockResolvedValueOnce(undefined);
    const result = await sendViaBinding({ send }, baseMsg, {
      maxAttempts: 3,
      backoffBaseMs: 1,
    });
    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(2);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("returns error after exhausting retries", async () => {
    const send = vi.fn().mockRejectedValue(new Error("nope"));
    const result = await sendViaBinding({ send }, baseMsg, {
      maxAttempts: 3,
      backoffBaseMs: 1,
    });
    expect(result.ok).toBe(false);
    expect(result.attempts).toBe(3);
    expect(result.error).toBe("nope");
    expect(send).toHaveBeenCalledTimes(3);
  });

  it("uses provided correlationId", async () => {
    const binding: SendEmailBinding = {
      send: vi.fn().mockResolvedValue(undefined),
    };
    const result = await sendViaBinding(binding, baseMsg, {
      correlationId: "fixed-id",
    });
    expect(result.correlationId).toBe("fixed-id");
  });
});
