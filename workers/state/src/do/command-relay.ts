import { DurableObject } from "cloudflare:workers";
import {
  CONTROL_PLANE_CONTRACT_VERSION,
  type ControlCommandRecord,
  type ControlCommandState,
  type ControlCommandSubmission,
  type ControlOutcome,
  type ControlPlaneSnapshot,
  type ControlProof,
  type DeviceToRelayEnvelope,
  type RelayAcceptedEnvelope,
  type RelaySnapshotEnvelope,
  type RelayToDeviceEnvelope,
} from "@anipotts/types";
import type { Bindings } from "../types";

type CommandRow = {
  contract_version: number;
  command_id: string;
  idempotency_key: string;
  kind: string;
  target_device_id: string;
  target_capability: string;
  actor_id: string;
  authority_lane: string;
  authenticated_by: string;
  reason: string;
  payload_json: string;
  valid_time: string;
  recorded_time: string;
  expires_at: string;
  state: string;
  relay_recorded_at: string;
  updated_at: string;
  delivered_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  delivery_attempts: number;
  outcome_json: string | null;
  proof_json: string | null;
};

type RelayEventInput = {
  eventId: string;
  commandId: string;
  kind: string;
  actor: string;
  authority: string;
  reason: string;
  payload: unknown;
  recordedAt: string;
};

const DEVICE_ID = "ap-mini" as const;
const MAX_COMMANDS = 20;

export class CommandRelay extends DurableObject<Bindings> {
  constructor(ctx: DurableObjectState, env: Bindings) {
    super(ctx, env);
    this.ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS commands (
          contract_version INTEGER NOT NULL,
          command_id TEXT PRIMARY KEY,
          idempotency_key TEXT NOT NULL UNIQUE,
          kind TEXT NOT NULL,
          target_device_id TEXT NOT NULL,
          target_capability TEXT NOT NULL,
          actor_id TEXT NOT NULL,
          authority_lane TEXT NOT NULL,
          authenticated_by TEXT NOT NULL,
          reason TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          valid_time TEXT NOT NULL,
          recorded_time TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          state TEXT NOT NULL,
          relay_recorded_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          delivered_at TEXT,
          started_at TEXT,
          completed_at TEXT,
          delivery_attempts INTEGER NOT NULL DEFAULT 0,
          outcome_json TEXT,
          proof_json TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_commands_updated_at
          ON commands (updated_at DESC);
        CREATE TABLE IF NOT EXISTS relay_events (
          event_id TEXT PRIMARY KEY,
          command_id TEXT NOT NULL,
          kind TEXT NOT NULL,
          actor TEXT NOT NULL,
          authority TEXT NOT NULL,
          reason TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          recorded_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_relay_events_command
          ON relay_events (command_id, recorded_at);
        CREATE TABLE IF NOT EXISTS device_nonces (
          nonce TEXT PRIMARY KEY,
          device_id TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          consumed_at TEXT NOT NULL
        );
      `);
    });
  }

  async submitCommand(
    submission: ControlCommandSubmission,
  ): Promise<ControlCommandRecord> {
    validateSubmission(submission);
    this.expireCommands();

    const existing = this.findByIdempotencyKey(submission.idempotency_key);
    if (existing) return existing;

    const now = new Date().toISOString();
    this.ctx.storage.sql.exec(
      `INSERT INTO commands (
        contract_version, command_id, idempotency_key, kind,
        target_device_id, target_capability, actor_id, authority_lane,
        authenticated_by, reason, payload_json, valid_time, recorded_time,
        expires_at, state, relay_recorded_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', ?, ?)`,
      submission.contract_version,
      submission.command_id,
      submission.idempotency_key,
      submission.kind,
      submission.target.device_id,
      submission.target.capability,
      submission.authority.actor_id,
      submission.authority.lane,
      submission.authority.authenticated_by,
      submission.reason,
      JSON.stringify(submission.payload),
      submission.valid_time,
      submission.recorded_time,
      submission.expires_at,
      now,
      now,
    );
    this.appendRelayEvent({
      eventId: crypto.randomUUID(),
      commandId: submission.command_id,
      kind: "relay.command.queued",
      actor: submission.authority.actor_id,
      authority: submission.authority.lane,
      reason: submission.reason,
      payload: { kind: submission.kind, target: submission.target },
      recordedAt: now,
    });

    let record = this.requiredCommand(submission.command_id);
    if (this.ctx.getWebSockets().length > 0) {
      record = this.markDelivered(record);
      this.broadcast({ type: "relay.command", command: record });
    }
    return record;
  }

  async getSnapshot(limit = 8): Promise<ControlPlaneSnapshot> {
    this.expireCommands();
    const boundedLimit = Math.min(Math.max(Math.trunc(limit), 1), MAX_COMMANDS);
    const rows = this.ctx.storage.sql
      .exec<CommandRow>(
        "SELECT * FROM commands ORDER BY updated_at DESC LIMIT ?",
        boundedLimit,
      )
      .toArray();
    return {
      contract_version: CONTROL_PLANE_CONTRACT_VERSION,
      device_id: DEVICE_ID,
      device_connected: this.ctx.getWebSockets().length > 0,
      generated_at: new Date().toISOString(),
      commands: rows.map(rowToCommand),
    };
  }

  async consumeHandshakeNonce(
    nonce: string,
    deviceId: string,
  ): Promise<boolean> {
    if (deviceId !== DEVICE_ID || !/^[A-Za-z0-9_-]{22,128}$/.test(nonce)) {
      return false;
    }
    const now = new Date();
    this.ctx.storage.sql.exec(
      "DELETE FROM device_nonces WHERE expires_at <= ?",
      now.toISOString(),
    );
    const existing = this.ctx.storage.sql
      .exec<{
        nonce: string;
      }>("SELECT nonce FROM device_nonces WHERE nonce = ? LIMIT 1", nonce)
      .toArray()[0];
    if (existing) return false;

    this.ctx.storage.sql.exec(
      `INSERT INTO device_nonces (nonce, device_id, expires_at, consumed_at)
       VALUES (?, ?, ?, ?)`,
      nonce,
      deviceId,
      new Date(now.getTime() + 120_000).toISOString(),
      now.toISOString(),
    );
    return true;
  }

  async fetch(request: Request): Promise<Response> {
    if (
      request.headers.get("upgrade")?.toLowerCase() !== "websocket" ||
      request.headers.get("x-control-device-verified") !== DEVICE_ID
    ) {
      return new Response("not found", { status: 404 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({
      deviceId: DEVICE_ID,
      connectionId: crypto.randomUUID(),
      authenticatedAt: new Date().toISOString(),
    });

    const pending = this.pendingCommands().map((command) =>
      this.markDelivered(command),
    );
    const snapshot: RelaySnapshotEnvelope = {
      type: "relay.snapshot",
      commands: pending,
    };
    server.send(JSON.stringify(snapshot));
    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): void {
    if (typeof raw !== "string") {
      ws.close(1003, "text envelopes required");
      return;
    }

    let envelope: DeviceToRelayEnvelope;
    try {
      envelope = JSON.parse(raw) as DeviceToRelayEnvelope;
    } catch {
      ws.close(1007, "invalid envelope");
      return;
    }

    if (!isDeviceEnvelope(envelope)) {
      ws.close(1008, "unsupported envelope");
      return;
    }

    if (this.eventExists(envelope.device_event_id)) {
      this.sendAccepted(ws, envelope.command_id, envelope.device_event_id);
      return;
    }

    const command = this.findCommand(envelope.command_id);
    if (!command) {
      ws.close(1008, "unknown command");
      return;
    }

    if (envelope.type === "device.execution.started") {
      this.recordStarted(command, envelope);
      return;
    }

    if (envelope.type === "device.execution.succeeded") {
      this.recordSucceeded(command, envelope);
      this.sendAccepted(ws, envelope.command_id, envelope.device_event_id);
      return;
    }

    this.recordFailed(command, envelope);
    this.sendAccepted(ws, envelope.command_id, envelope.device_event_id);
  }

  webSocketClose(_ws: WebSocket, _code: number, _reason: string): void {
    // Hibernation API owns socket cleanup.
  }

  private pendingCommands(): ControlCommandRecord[] {
    this.expireCommands();
    return this.ctx.storage.sql
      .exec<CommandRow>(
        `SELECT * FROM commands
         WHERE state IN ('queued', 'delivered', 'running')
         ORDER BY recorded_time ASC LIMIT ?`,
        MAX_COMMANDS,
      )
      .toArray()
      .map(rowToCommand);
  }

  private markDelivered(command: ControlCommandRecord): ControlCommandRecord {
    if (command.state === "succeeded" || command.state === "failed") {
      return command;
    }
    const now = new Date().toISOString();
    this.ctx.storage.sql.exec(
      `UPDATE commands SET
         state = CASE WHEN state = 'queued' THEN 'delivered' ELSE state END,
         delivered_at = COALESCE(delivered_at, ?),
         updated_at = ?,
         delivery_attempts = delivery_attempts + 1
       WHERE command_id = ?`,
      now,
      now,
      command.command_id,
    );
    return this.requiredCommand(command.command_id);
  }

  private recordStarted(
    command: ControlCommandRecord,
    envelope: Extract<
      DeviceToRelayEnvelope,
      { type: "device.execution.started" }
    >,
  ): void {
    if (["succeeded", "failed", "expired"].includes(command.state)) return;
    this.ctx.storage.sql.exec(
      `UPDATE commands SET state = 'running', started_at = COALESCE(started_at, ?),
       updated_at = ? WHERE command_id = ?`,
      envelope.started_at,
      envelope.started_at,
      command.command_id,
    );
    this.appendRelayEvent({
      eventId: envelope.device_event_id,
      commandId: command.command_id,
      kind: envelope.type,
      actor: DEVICE_ID,
      authority: command.authority.lane,
      reason: command.reason,
      payload: { execution_id: envelope.execution_id },
      recordedAt: envelope.started_at,
    });
  }

  private recordSucceeded(
    command: ControlCommandRecord,
    envelope: Extract<
      DeviceToRelayEnvelope,
      { type: "device.execution.succeeded" }
    >,
  ): void {
    validateSuccessEnvelope(command, envelope.outcome, envelope.proof);
    this.ctx.storage.sql.exec(
      `UPDATE commands SET state = 'succeeded', completed_at = ?, updated_at = ?,
       outcome_json = ?, proof_json = ? WHERE command_id = ?`,
      envelope.outcome.completed_at,
      envelope.outcome.completed_at,
      JSON.stringify(envelope.outcome),
      JSON.stringify(envelope.proof),
      command.command_id,
    );
    this.appendRelayEvent({
      eventId: envelope.device_event_id,
      commandId: command.command_id,
      kind: envelope.type,
      actor: DEVICE_ID,
      authority: command.authority.lane,
      reason: command.reason,
      payload: { outcome: envelope.outcome, proof: envelope.proof },
      recordedAt: envelope.outcome.completed_at,
    });
  }

  private recordFailed(
    command: ControlCommandRecord,
    envelope: Extract<
      DeviceToRelayEnvelope,
      { type: "device.execution.failed" }
    >,
  ): void {
    this.ctx.storage.sql.exec(
      `UPDATE commands SET state = 'failed', completed_at = ?, updated_at = ?,
       outcome_json = ? WHERE command_id = ?`,
      envelope.failed_at,
      envelope.failed_at,
      JSON.stringify({
        summary: `execution failed: ${envelope.error_code}`,
        completed_at: envelope.failed_at,
      }),
      command.command_id,
    );
    this.appendRelayEvent({
      eventId: envelope.device_event_id,
      commandId: command.command_id,
      kind: envelope.type,
      actor: DEVICE_ID,
      authority: command.authority.lane,
      reason: command.reason,
      payload: { error_code: envelope.error_code },
      recordedAt: envelope.failed_at,
    });
  }

  private sendAccepted(
    ws: WebSocket,
    commandId: string,
    deviceEventId: string,
  ): void {
    const response: RelayAcceptedEnvelope = {
      type: "relay.acknowledged",
      command_id: commandId,
      device_event_id: deviceEventId,
      accepted_at: new Date().toISOString(),
    };
    ws.send(JSON.stringify(response));
  }

  private expireCommands(): void {
    const now = new Date().toISOString();
    this.ctx.storage.sql.exec(
      `UPDATE commands SET state = 'expired', updated_at = ?
       WHERE state IN ('queued', 'delivered') AND expires_at <= ?`,
      now,
      now,
    );
  }

  private findByIdempotencyKey(key: string): ControlCommandRecord | null {
    const row = this.ctx.storage.sql
      .exec<CommandRow>(
        "SELECT * FROM commands WHERE idempotency_key = ? LIMIT 1",
        key,
      )
      .toArray()[0];
    return row ? rowToCommand(row) : null;
  }

  private findCommand(commandId: string): ControlCommandRecord | null {
    const row = this.ctx.storage.sql
      .exec<CommandRow>(
        "SELECT * FROM commands WHERE command_id = ? LIMIT 1",
        commandId,
      )
      .toArray()[0];
    return row ? rowToCommand(row) : null;
  }

  private requiredCommand(commandId: string): ControlCommandRecord {
    const command = this.findCommand(commandId);
    if (!command) throw new Error("command insert failed");
    return command;
  }

  private eventExists(eventId: string): boolean {
    return Boolean(
      this.ctx.storage.sql
        .exec<{
          event_id: string;
        }>(
          "SELECT event_id FROM relay_events WHERE event_id = ? LIMIT 1",
          eventId,
        )
        .toArray()[0],
    );
  }

  private appendRelayEvent(event: RelayEventInput): void {
    this.ctx.storage.sql.exec(
      `INSERT OR IGNORE INTO relay_events (
        event_id, command_id, kind, actor, authority, reason, payload_json,
        recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      event.eventId,
      event.commandId,
      event.kind,
      event.actor,
      event.authority,
      event.reason,
      JSON.stringify(event.payload),
      event.recordedAt,
    );
  }

  private broadcast(envelope: RelayToDeviceEnvelope): void {
    const serialized = JSON.stringify(envelope);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(serialized);
      } catch {
        // Hibernation API removes closed sockets.
      }
    }
  }
}

function validateSubmission(submission: ControlCommandSubmission): void {
  if (
    submission.contract_version !== CONTROL_PLANE_CONTRACT_VERSION ||
    submission.kind !== "system.prove_round_trip" ||
    submission.target.device_id !== DEVICE_ID ||
    submission.target.capability !== "control.prove_round_trip" ||
    submission.authority.lane !== "default_safe_lane" ||
    submission.authority.authenticated_by !== "passkey-session" ||
    !submission.authority.actor_id ||
    !submission.reason.trim() ||
    submission.reason.length > 500 ||
    !submission.payload.message.trim() ||
    submission.payload.message.length > 500 ||
    !submission.command_id ||
    !submission.idempotency_key ||
    !isIsoDate(submission.valid_time) ||
    !isIsoDate(submission.recorded_time) ||
    !isIsoDate(submission.expires_at)
  ) {
    throw new Error("invalid control command submission");
  }
  if (
    Date.parse(submission.expires_at) <= Date.parse(submission.recorded_time)
  ) {
    throw new Error("control command must expire after it is recorded");
  }
}

function validateSuccessEnvelope(
  command: ControlCommandRecord,
  outcome: ControlOutcome,
  proof: ControlProof,
): void {
  if (
    proof.command_id !== command.command_id ||
    proof.executor !== DEVICE_ID ||
    proof.outcome !== "round_trip_verified" ||
    !proof.proof_id ||
    !proof.execution_id ||
    !proof.journal_event_id ||
    !/^[a-f0-9]{64}$/.test(proof.journal_head_hash) ||
    proof.evidence_ref !== `local-journal:event:${proof.journal_event_id}` ||
    !outcome.summary.trim() ||
    !isIsoDate(outcome.completed_at) ||
    proof.completed_at !== outcome.completed_at
  ) {
    throw new Error("invalid device success proof");
  }
}

function isDeviceEnvelope(value: DeviceToRelayEnvelope): boolean {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof value.command_id === "string" &&
    typeof value.execution_id === "string" &&
    typeof value.device_event_id === "string" &&
    [
      "device.execution.started",
      "device.execution.succeeded",
      "device.execution.failed",
    ].includes(value.type),
  );
}

function rowToCommand(row: CommandRow): ControlCommandRecord {
  return {
    contract_version: CONTROL_PLANE_CONTRACT_VERSION,
    command_id: row.command_id,
    idempotency_key: row.idempotency_key,
    kind: "system.prove_round_trip",
    target: {
      device_id: DEVICE_ID,
      capability: "control.prove_round_trip",
    },
    authority: {
      actor_id: row.actor_id,
      lane: "default_safe_lane",
      authenticated_by: "passkey-session",
    },
    reason: row.reason,
    payload: JSON.parse(row.payload_json) as { message: string },
    valid_time: row.valid_time,
    recorded_time: row.recorded_time,
    expires_at: row.expires_at,
    state: row.state as ControlCommandState,
    relay_recorded_at: row.relay_recorded_at,
    updated_at: row.updated_at,
    delivered_at: row.delivered_at,
    started_at: row.started_at,
    completed_at: row.completed_at,
    delivery_attempts: row.delivery_attempts,
    outcome: row.outcome_json
      ? (JSON.parse(row.outcome_json) as ControlOutcome)
      : null,
    proof: row.proof_json ? (JSON.parse(row.proof_json) as ControlProof) : null,
  };
}

function isIsoDate(value: string): boolean {
  return Boolean(value && Number.isFinite(Date.parse(value)));
}
