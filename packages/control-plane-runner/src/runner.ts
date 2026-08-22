import { randomUUID } from "node:crypto";
import type {
  ControlCommandRecord,
  RelayToDeviceEnvelope,
} from "@anipotts/types";
import {
  loadDeviceIdentity,
  signHandshake,
  type DeviceIdentity,
} from "./device-identity";
import { LocalJournal } from "./journal";

export type RunnerConfig = {
  relayUrl: string;
  journalPath: string;
  privateKeyPath: string;
  once: boolean;
};

type BunWebSocketConstructor = typeof WebSocket & {
  new (url: string, options: { headers: Record<string, string> }): WebSocket;
};

export class ControlPlaneRunner {
  private readonly journal: LocalJournal;
  private readonly identity: DeviceIdentity;

  constructor(readonly config: RunnerConfig) {
    this.journal = new LocalJournal(config.journalPath);
    this.identity = loadDeviceIdentity(config.privateKeyPath);
  }

  async run(): Promise<void> {
    if (this.config.once) {
      await this.runConnection();
      return;
    }

    let attempt = 0;
    while (true) {
      try {
        await this.runConnection();
        attempt = 0;
      } catch (error) {
        attempt += 1;
        console.error(
          JSON.stringify({
            level: "error",
            event: "control.runner.disconnected",
            attempt,
            detail: error instanceof Error ? error.message : "unknown error",
          }),
        );
      }
      await Bun.sleep(Math.min(30_000, 1_000 * 2 ** Math.min(attempt, 5)));
    }
  }

  close(): void {
    this.journal.close();
  }

  private async runConnection(): Promise<void> {
    const signed = await signHandshake(this.identity);
    const WebSocketClient = WebSocket as BunWebSocketConstructor;
    const websocket = new WebSocketClient(this.config.relayUrl, {
      headers: {
        "x-control-timestamp": signed.timestamp,
        "x-control-nonce": signed.nonce,
        "x-control-signature": signed.signature,
      },
    });

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const rejectOnce = (error: Error) => {
        if (settled) return;
        settled = true;
        reject(error);
      };

      websocket.addEventListener("open", () => {
        for (const envelope of this.journal.pendingOutbox()) {
          websocket.send(JSON.stringify(envelope));
        }
        for (const command of this.journal.pendingCommands()) {
          void this.executeCommand(websocket, command);
        }
      });

      websocket.addEventListener("message", (event) => {
        void this.handleMessage(websocket, String(event.data)).then((done) => {
          if (done && this.config.once && !settled) {
            settled = true;
            websocket.close(1000, "proof acknowledged");
            resolve();
          }
        }, rejectOnce);
      });

      websocket.addEventListener("error", () => {
        rejectOnce(new Error("relay websocket error"));
      });
      websocket.addEventListener("close", (event) => {
        if (!settled) {
          rejectOnce(
            new Error(`relay websocket closed (${event.code} ${event.reason})`),
          );
        }
      });
    });
  }

  private async handleMessage(
    websocket: WebSocket,
    raw: string,
  ): Promise<boolean> {
    const envelope = JSON.parse(raw) as RelayToDeviceEnvelope;
    if (envelope.type === "relay.acknowledged") {
      return this.journal.acknowledgeOutbox(
        envelope.device_event_id,
        envelope.accepted_at,
      );
    }

    const commands =
      envelope.type === "relay.snapshot"
        ? envelope.commands
        : envelope.type === "relay.command"
          ? [envelope.command]
          : [];
    for (const command of commands) {
      await this.executeCommand(websocket, command);
    }
    return false;
  }

  private async executeCommand(
    websocket: WebSocket,
    command: ControlCommandRecord,
  ): Promise<void> {
    if (
      command.kind !== "system.prove_round_trip" ||
      command.target.device_id !== "ap-mini" ||
      command.target.capability !== "control.prove_round_trip" ||
      command.authority.lane !== "default_safe_lane" ||
      command.authority.authenticated_by !== "passkey-session" ||
      Date.parse(command.expires_at) <= Date.now()
    ) {
      return;
    }
    const accepted = this.journal.acceptCommand(command);
    if (!accepted) {
      let hasPendingProof = false;
      for (const pending of this.journal.pendingOutbox()) {
        if (pending.command_id === command.command_id) {
          hasPendingProof = true;
          websocket.send(JSON.stringify(pending));
        }
      }
      if (
        hasPendingProof ||
        !this.journal
          .pendingCommands()
          .some((pending) => pending.command_id === command.command_id)
      ) {
        return;
      }
    }

    const executionId = randomUUID();
    const started = this.journal.startExecution(command, executionId);
    websocket.send(
      JSON.stringify({
        type: "device.execution.started",
        command_id: command.command_id,
        execution_id: executionId,
        device_event_id: started.event_id,
        started_at: started.recorded_time,
      }),
    );
    const completed = this.journal.completeRoundTrip(command, executionId);
    websocket.send(JSON.stringify(completed));
  }
}
