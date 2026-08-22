import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { ControlCommandRecord } from "@anipotts/types";
import { LocalJournal } from "../src/journal";

let directory: string | null = null;

afterEach(() => {
  if (directory) rmSync(directory, { recursive: true, force: true });
  directory = null;
});

describe("LocalJournal", () => {
  it("accepts and executes one command with a valid hash chain", () => {
    directory = mkdtempSync(join(tmpdir(), "control-journal-"));
    const journal = new LocalJournal(join(directory, "journal.sqlite"));
    const command = fixtureCommand();

    expect(journal.acceptCommand(command)).toBe(true);
    expect(journal.acceptCommand(command)).toBe(false);
    const started = journal.startExecution(command, "execution-1");
    const completed = journal.completeRoundTrip(command, "execution-1");

    expect(started.kind).toBe("execution.started");
    expect(completed.proof.executor).toBe("ap-mini");
    expect(completed.proof.journal_head_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(journal.pendingOutbox()).toHaveLength(1);
    expect(journal.verifyChain()).toEqual({
      valid: true,
      events: 3,
      head: completed.proof.journal_head_hash,
    });
    expect(
      journal.acknowledgeOutbox(
        completed.device_event_id,
        new Date().toISOString(),
      ),
    ).toBe(true);
    expect(journal.pendingOutbox()).toHaveLength(0);
    journal.close();
  });
});

function fixtureCommand(): ControlCommandRecord {
  const now = new Date().toISOString();
  return {
    contract_version: 1,
    command_id: "command-1",
    idempotency_key: "idempotency-1",
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
    reason: "verify the round trip",
    payload: { message: "prove the local durable execution" },
    valid_time: now,
    recorded_time: now,
    expires_at: new Date(Date.now() + 300_000).toISOString(),
    state: "queued",
    relay_recorded_at: now,
    updated_at: now,
    delivered_at: null,
    started_at: null,
    completed_at: null,
    delivery_attempts: 0,
    outcome: null,
    proof: null,
  };
}
