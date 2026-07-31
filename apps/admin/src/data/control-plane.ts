import {
  CONTROL_PLANE_CONTRACT_VERSION,
  type ControlCommandRecord,
  type ControlCommandSubmission,
  type ControlPlaneSnapshot,
} from "@anipotts/types";

export type ControlPlaneReadState = {
  available: boolean;
  error: string | null;
  snapshot: ControlPlaneSnapshot;
};

type CommandRelayStub = {
  submitCommand(
    command: ControlCommandSubmission,
  ): Promise<ControlCommandRecord>;
  getSnapshot(limit?: number): Promise<ControlPlaneSnapshot>;
};

type CommandRelayNamespace = {
  getByName(name: string): CommandRelayStub;
};

const DEVICE_ID = "ap-mini" as const;

export async function readControlPlane(
  namespace: CommandRelayNamespace | undefined,
  limit = 4,
): Promise<ControlPlaneReadState> {
  if (!namespace) return unavailable("relay_binding_missing");
  try {
    return {
      available: true,
      error: null,
      snapshot: await namespace.getByName(DEVICE_ID).getSnapshot(limit),
    };
  } catch (error) {
    return unavailable(
      error instanceof Error ? error.message : "relay_snapshot_failed",
    );
  }
}

export async function submitControlPlaneProof(
  namespace: CommandRelayNamespace | undefined,
  input: {
    actorId: string;
    idempotencyKey: string;
    reason: string;
    now?: Date;
  },
): Promise<ControlCommandRecord> {
  if (!namespace) throw new Error("relay_binding_missing");
  const submission = buildControlCommandSubmission(input);
  return namespace.getByName(DEVICE_ID).submitCommand(submission);
}

export function buildControlCommandSubmission(input: {
  actorId: string;
  idempotencyKey: string;
  reason: string;
  now?: Date;
}): ControlCommandSubmission {
  const now = input.now ?? new Date();
  const recordedTime = now.toISOString();
  const reason = input.reason.trim();
  if (
    !input.actorId ||
    !input.idempotencyKey ||
    !reason ||
    reason.length > 500
  ) {
    throw new Error("invalid_control_command_request");
  }
  return {
    contract_version: CONTROL_PLANE_CONTRACT_VERSION,
    command_id: crypto.randomUUID(),
    idempotency_key: input.idempotencyKey,
    kind: "system.prove_round_trip",
    target: {
      device_id: DEVICE_ID,
      capability: "control.prove_round_trip",
    },
    authority: {
      actor_id: input.actorId,
      lane: "default_safe_lane",
      authenticated_by: "passkey-session",
    },
    reason,
    payload: {
      message: "prove one durable admin to ap-mini execution round trip",
    },
    valid_time: recordedTime,
    recorded_time: recordedTime,
    expires_at: new Date(now.getTime() + 5 * 60_000).toISOString(),
  };
}

function unavailable(error: string): ControlPlaneReadState {
  return {
    available: false,
    error,
    snapshot: {
      contract_version: CONTROL_PLANE_CONTRACT_VERSION,
      device_id: DEVICE_ID,
      device_connected: false,
      generated_at: new Date().toISOString(),
      commands: [],
    },
  };
}
