export const CONTROL_PLANE_CONTRACT_VERSION = 1 as const;

export const CONTROL_COMMAND_KINDS = ["system.prove_round_trip"] as const;

export type ControlCommandKind = (typeof CONTROL_COMMAND_KINDS)[number];
export type ControlCommandState =
  "queued" | "delivered" | "running" | "succeeded" | "failed" | "expired";

export type ControlAuthority = {
  actor_id: string;
  lane: "default_safe_lane";
  authenticated_by: "passkey-session";
};

export type ControlCommandTarget = {
  device_id: "ap-mini";
  capability: "control.prove_round_trip";
};

export type ControlCommandSubmission = {
  contract_version: typeof CONTROL_PLANE_CONTRACT_VERSION;
  command_id: string;
  idempotency_key: string;
  kind: ControlCommandKind;
  target: ControlCommandTarget;
  authority: ControlAuthority;
  reason: string;
  payload: {
    message: string;
  };
  valid_time: string;
  recorded_time: string;
  expires_at: string;
};

export type ControlProof = {
  proof_id: string;
  command_id: string;
  execution_id: string;
  executor: "ap-mini";
  outcome: "round_trip_verified";
  journal_event_id: string;
  journal_head_hash: string;
  evidence_ref: string;
  completed_at: string;
};

export type ControlOutcome = {
  summary: string;
  completed_at: string;
};

export type ControlCommandRecord = ControlCommandSubmission & {
  state: ControlCommandState;
  relay_recorded_at: string;
  updated_at: string;
  delivered_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  delivery_attempts: number;
  outcome: ControlOutcome | null;
  proof: ControlProof | null;
};

export type ControlPlaneSnapshot = {
  contract_version: typeof CONTROL_PLANE_CONTRACT_VERSION;
  device_id: "ap-mini";
  device_connected: boolean;
  generated_at: string;
  commands: ControlCommandRecord[];
};

export type RelayCommandEnvelope = {
  type: "relay.command";
  command: ControlCommandRecord;
};

export type RelaySnapshotEnvelope = {
  type: "relay.snapshot";
  commands: ControlCommandRecord[];
};

export type RelayAcceptedEnvelope = {
  type: "relay.acknowledged";
  command_id: string;
  device_event_id: string;
  accepted_at: string;
};

export type DeviceStartedEnvelope = {
  type: "device.execution.started";
  command_id: string;
  execution_id: string;
  device_event_id: string;
  started_at: string;
};

export type DeviceSucceededEnvelope = {
  type: "device.execution.succeeded";
  command_id: string;
  execution_id: string;
  device_event_id: string;
  outcome: ControlOutcome;
  proof: ControlProof;
};

export type DeviceFailedEnvelope = {
  type: "device.execution.failed";
  command_id: string;
  execution_id: string;
  device_event_id: string;
  failed_at: string;
  error_code: string;
};

export type RelayToDeviceEnvelope =
  RelayCommandEnvelope | RelaySnapshotEnvelope | RelayAcceptedEnvelope;

export type DeviceToRelayEnvelope =
  DeviceStartedEnvelope | DeviceSucceededEnvelope | DeviceFailedEnvelope;
