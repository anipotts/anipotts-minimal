import { Database } from "bun:sqlite";
import { createHash, randomUUID } from "node:crypto";
import { chmodSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type {
  ControlCommandRecord,
  DeviceSucceededEnvelope,
} from "@anipotts/types";

export type LocalJournalEvent = {
  event_id: string;
  command_id: string;
  kind: string;
  actor: string;
  authority: string;
  reason: string;
  payload: unknown;
  valid_time: string;
  recorded_time: string;
  previous_hash: string;
  event_hash: string;
};

type JournalEventInput = Omit<
  LocalJournalEvent,
  "event_id" | "previous_hash" | "event_hash"
> & {
  event_id?: string;
};

type StoredCommand = {
  command_id: string;
  state: string;
  command_json: string;
  updated_at: string;
};

type OutboxRow = {
  event_id: string;
  command_id: string;
  envelope_json: string;
  created_at: string;
  acknowledged_at: string | null;
};

const GENESIS_HASH = "0".repeat(64);

export class LocalJournal {
  readonly db: Database;

  constructor(readonly path: string) {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new Database(path, { create: true, strict: true });
    chmodSync(path, 0o600);
    this.db.run("PRAGMA journal_mode = WAL");
    this.db.run("PRAGMA synchronous = FULL");
    this.db.run("PRAGMA foreign_keys = ON");
    this.db.run(`
      CREATE TABLE IF NOT EXISTS journal_events (
        sequence INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL UNIQUE,
        command_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        actor TEXT NOT NULL,
        authority TEXT NOT NULL,
        reason TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        valid_time TEXT NOT NULL,
        recorded_time TEXT NOT NULL,
        previous_hash TEXT NOT NULL,
        event_hash TEXT NOT NULL UNIQUE
      );
      CREATE INDEX IF NOT EXISTS idx_journal_command
        ON journal_events (command_id, sequence);
      CREATE TABLE IF NOT EXISTS commands (
        command_id TEXT PRIMARY KEY,
        state TEXT NOT NULL,
        command_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS outbox (
        event_id TEXT PRIMARY KEY,
        command_id TEXT NOT NULL,
        envelope_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        acknowledged_at TEXT
      );
    `);
  }

  close(): void {
    this.db.close();
  }

  acceptCommand(command: ControlCommandRecord): boolean {
    const existing = this.db
      .query<StoredCommand, [string]>(
        "SELECT * FROM commands WHERE command_id = ? LIMIT 1",
      )
      .get(command.command_id);
    if (existing) return false;

    const transaction = this.db.transaction(() => {
      this.appendEventInternal({
        command_id: command.command_id,
        kind: "command.received",
        actor: command.authority.actor_id,
        authority: command.authority.lane,
        reason: command.reason,
        payload: {
          kind: command.kind,
          target: command.target,
          relay_recorded_at: command.relay_recorded_at,
        },
        valid_time: command.valid_time,
        recorded_time: new Date().toISOString(),
      });
      this.db
        .query(
          `INSERT INTO commands (command_id, state, command_json, updated_at)
           VALUES (?, 'queued', ?, ?)`,
        )
        .run(
          command.command_id,
          JSON.stringify(command),
          new Date().toISOString(),
        );
    });
    transaction.immediate();
    return true;
  }

  pendingCommands(): ControlCommandRecord[] {
    return this.db
      .query<StoredCommand, []>(
        "SELECT * FROM commands WHERE state IN ('queued', 'running') ORDER BY updated_at",
      )
      .all()
      .map((row) => JSON.parse(row.command_json) as ControlCommandRecord);
  }

  startExecution(
    command: ControlCommandRecord,
    executionId: string,
  ): LocalJournalEvent {
    const now = new Date().toISOString();
    const transaction = this.db.transaction(() => {
      const event = this.appendEventInternal({
        command_id: command.command_id,
        kind: "execution.started",
        actor: "ap-mini",
        authority: command.authority.lane,
        reason: command.reason,
        payload: {
          execution_id: executionId,
          capability: command.target.capability,
        },
        valid_time: now,
        recorded_time: now,
      });
      this.db
        .query(
          "UPDATE commands SET state = 'running', updated_at = ? WHERE command_id = ?",
        )
        .run(now, command.command_id);
      return event;
    });
    return transaction.immediate();
  }

  completeRoundTrip(
    command: ControlCommandRecord,
    executionId: string,
  ): DeviceSucceededEnvelope {
    if (command.kind !== "system.prove_round_trip") {
      throw new Error(`unsupported command kind: ${command.kind}`);
    }
    const completedAt = new Date().toISOString();
    const transaction = this.db.transaction(() => {
      const completion = this.appendEventInternal({
        command_id: command.command_id,
        kind: "execution.succeeded",
        actor: "ap-mini",
        authority: command.authority.lane,
        reason: command.reason,
        payload: {
          execution_id: executionId,
          outcome: "round_trip_verified",
          message_digest: sha256(command.payload.message),
        },
        valid_time: completedAt,
        recorded_time: completedAt,
      });
      const deviceEventId = randomUUID();
      const envelope: DeviceSucceededEnvelope = {
        type: "device.execution.succeeded",
        command_id: command.command_id,
        execution_id: executionId,
        device_event_id: deviceEventId,
        outcome: {
          summary: "ap-mini durably journaled and completed the proof command",
          completed_at: completedAt,
        },
        proof: {
          proof_id: randomUUID(),
          command_id: command.command_id,
          execution_id: executionId,
          executor: "ap-mini",
          outcome: "round_trip_verified",
          journal_event_id: completion.event_id,
          journal_head_hash: completion.event_hash,
          evidence_ref: `local-journal:event:${completion.event_id}`,
          completed_at: completedAt,
        },
      };
      this.db
        .query(
          "UPDATE commands SET state = 'succeeded', updated_at = ? WHERE command_id = ?",
        )
        .run(completedAt, command.command_id);
      this.db
        .query(
          `INSERT INTO outbox (
            event_id, command_id, envelope_json, created_at, acknowledged_at
          ) VALUES (?, ?, ?, ?, NULL)`,
        )
        .run(
          deviceEventId,
          command.command_id,
          JSON.stringify(envelope),
          completedAt,
        );
      return envelope;
    });
    return transaction.immediate();
  }

  pendingOutbox(): DeviceSucceededEnvelope[] {
    return this.db
      .query<OutboxRow, []>(
        "SELECT * FROM outbox WHERE acknowledged_at IS NULL ORDER BY created_at",
      )
      .all()
      .map((row) => JSON.parse(row.envelope_json) as DeviceSucceededEnvelope);
  }

  acknowledgeOutbox(eventId: string, acknowledgedAt: string): boolean {
    const result = this.db
      .query(
        `UPDATE outbox SET acknowledged_at = ?
         WHERE event_id = ? AND acknowledged_at IS NULL`,
      )
      .run(acknowledgedAt, eventId);
    return result.changes > 0;
  }

  events(): LocalJournalEvent[] {
    return this.db
      .query<Omit<LocalJournalEvent, "payload"> & { payload_json: string }, []>(
        "SELECT * FROM journal_events ORDER BY sequence",
      )
      .all()
      .map((row) => ({
        event_id: row.event_id,
        command_id: row.command_id,
        kind: row.kind,
        actor: row.actor,
        authority: row.authority,
        reason: row.reason,
        payload: JSON.parse(row.payload_json) as unknown,
        valid_time: row.valid_time,
        recorded_time: row.recorded_time,
        previous_hash: row.previous_hash,
        event_hash: row.event_hash,
      }));
  }

  verifyChain(): { valid: boolean; events: number; head: string } {
    let previousHash = GENESIS_HASH;
    const events = this.events();
    for (const event of events) {
      const expected = hashEvent({ ...event, event_hash: undefined });
      if (
        event.previous_hash !== previousHash ||
        event.event_hash !== expected
      ) {
        return { valid: false, events: events.length, head: previousHash };
      }
      previousHash = event.event_hash;
    }
    return { valid: true, events: events.length, head: previousHash };
  }

  private appendEventInternal(input: JournalEventInput): LocalJournalEvent {
    const previous = this.db
      .query<{ event_hash: string }, []>(
        "SELECT event_hash FROM journal_events ORDER BY sequence DESC LIMIT 1",
      )
      .get();
    const eventWithoutHash = {
      event_id: input.event_id ?? randomUUID(),
      command_id: input.command_id,
      kind: input.kind,
      actor: input.actor,
      authority: input.authority,
      reason: input.reason,
      payload: input.payload,
      valid_time: input.valid_time,
      recorded_time: input.recorded_time,
      previous_hash: previous?.event_hash ?? GENESIS_HASH,
    };
    const event: LocalJournalEvent = {
      ...eventWithoutHash,
      event_hash: hashEvent(eventWithoutHash),
    };
    this.db
      .query(
        `INSERT INTO journal_events (
          event_id, command_id, kind, actor, authority, reason, payload_json,
          valid_time, recorded_time, previous_hash, event_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        event.event_id,
        event.command_id,
        event.kind,
        event.actor,
        event.authority,
        event.reason,
        canonicalJson(event.payload),
        event.valid_time,
        event.recorded_time,
        event.previous_hash,
        event.event_hash,
      );
    return event;
  }
}

function hashEvent(
  event: Omit<LocalJournalEvent, "event_hash"> & { event_hash?: undefined },
): string {
  const { event_hash: _eventHash, ...payload } = event;
  return sha256(canonicalJson(payload));
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, sortValue(entry)]),
    );
  }
  return value;
}
