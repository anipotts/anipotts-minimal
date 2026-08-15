import { describe, expect, it, vi } from "vitest";
import {
  buildControlCommandSubmission,
  readControlPlane,
} from "./control-plane";

describe("control-plane admin contract", () => {
  it("builds only the bounded round-trip command", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "command-1" });
    const submission = buildControlCommandSubmission({
      actorId: "ani",
      idempotencyKey: "request-1",
      reason: "verify the round trip",
      now: new Date("2026-07-31T12:00:00.000Z"),
    });
    expect(submission).toMatchObject({
      command_id: "command-1",
      kind: "system.prove_round_trip",
      target: {
        device_id: "ap-mini",
        capability: "control.prove_round_trip",
      },
      authority: {
        actor_id: "ani",
        lane: "default_safe_lane",
        authenticated_by: "passkey-session",
      },
    });
    expect(submission.expires_at).toBe("2026-07-31T12:05:00.000Z");
    vi.unstubAllGlobals();
  });

  it("fails closed when the relay binding is unavailable", async () => {
    const state = await readControlPlane(undefined);
    expect(state.available).toBe(false);
    expect(state.snapshot.device_connected).toBe(false);
    expect(state.snapshot.commands).toEqual([]);
  });

  it("does not expose relay implementation errors", async () => {
    const state = await readControlPlane({
      getByName: () => ({
        submitCommand: vi.fn(),
        getSnapshot: vi
          .fn()
          .mockRejectedValue(
            new Error("Cannot access Durable Object RPC between dev sessions"),
          ),
      }),
    });

    expect(state.available).toBe(false);
    expect(state.error).toBe("relay_snapshot_failed");
  });
});
