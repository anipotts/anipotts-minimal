export type OperatorRuntimeState = "active" | "idle" | "not_loaded" | "unknown";
export type OperatorState =
  | "working"
  | "review"
  | "waiting"
  | "blocked"
  | "idle_stale"
  | "completed"
  | "unknown";
export type OperatorLifecycleState = "open" | "completed" | "archived";
export type OperatorFreshness = "fresh" | "stale" | "unknown";
export type OperatorWorkLane =
  "foreground" | "background" | "waiting" | "recently_completed";

type OperatorWorkBase = {
  attention_ref: string | null;
  bounded_goal: string;
  bounded_summary: string;
  canonical_title: string;
  cwd: string;
  entity_refs: string[];
  freshness: OperatorFreshness;
  host: string;
  last_observed_at: string;
  lifecycle: OperatorLifecycleState;
  machine_role: string;
  native_ref: string | null;
  next_action: string;
  operator_state: OperatorState;
  primary_entity_ref: string;
  project_id: string;
  project_label: string;
  proof_owed: string;
  proof_refs: string[];
  provider: "codex" | "claude";
  reconciled_at: string;
  relevant_surface: string;
  repo: string | null;
  runtime_state: OperatorRuntimeState;
  source: string;
  source_ref: string;
  worktree: string | null;
};

export type OperatorProjectState = OperatorWorkBase & {
  object_type: "project_state";
};

export type OperatorTaskState = OperatorWorkBase & {
  object_type: "task_state";
  lineage_refs: string[];
  owner: string;
  task_id: string;
};

export type OperatorTaskLineage = {
  bounded_summary: string;
  destination_task_id: string;
  last_observed_at: string;
  lineage_id: string;
  object_type: "task_lineage";
  predecessor_task_id: string;
  proof_refs: string[];
  reconciled_at: string;
  relation: "handoff";
  source_ref: string;
};

export type OperatorSourceState = {
  canonical_title: string;
  freshness: OperatorFreshness;
  host: string;
  last_observed_at: string;
  lifecycle: OperatorLifecycleState;
  linked_task_id: null;
  native_ref: string;
  object_type: "source_state";
  project_id: null;
  proof_refs: string[];
  provider: "chatgpt";
  reconciled_at: string;
  searchable_history_disposition: "preserved_collapsed";
  source: string;
  source_id: string;
  source_ref: string;
};

export type OperatorWorkProjection = {
  schema_version: 1;
  projection_id: string;
  mode: "live" | "tracked_fixture" | "disconnected";
  generated_at: string;
  reconciled_at: string;
  live_replacement_gate: "closed_pending_parity_proof_and_ani_approval";
  freshness_policy: {
    computed_upstream: true;
    fresh_for_seconds: number;
    future_timestamp_policy: "reject";
  };
  project_states: OperatorProjectState[];
  task_states: OperatorTaskState[];
  task_lineage: OperatorTaskLineage[];
  source_states: OperatorSourceState[];
  safety: {
    contains_full_prompts: false;
    contains_private_payloads: false;
    contains_secrets: false;
    contains_tool_payloads: false;
    contains_transcripts: false;
  };
};

export function readOperatorWorkProjection(): OperatorWorkProjection {
  const observedAt = new Date().toISOString();
  return {
    schema_version: 1,
    projection_id: "admin.work-projection.disconnected.v1",
    mode: "disconnected",
    generated_at: observedAt,
    reconciled_at: observedAt,
    live_replacement_gate: "closed_pending_parity_proof_and_ani_approval",
    freshness_policy: {
      computed_upstream: true,
      fresh_for_seconds: 3600,
      future_timestamp_policy: "reject",
    },
    project_states: [],
    task_states: [],
    task_lineage: [],
    source_states: [],
    safety: {
      contains_full_prompts: false,
      contains_private_payloads: false,
      contains_secrets: false,
      contains_tool_payloads: false,
      contains_transcripts: false,
    },
  };
}

export function laneForOperatorTask(task: OperatorTaskState): OperatorWorkLane {
  if (task.operator_state === "completed") return "recently_completed";
  if (task.operator_state === "waiting" || task.operator_state === "blocked") {
    return "waiting";
  }
  return task.owner === "chief/site" ? "foreground" : "background";
}

export function groupOperatorTasks(
  projection: OperatorWorkProjection,
): Record<OperatorWorkLane, OperatorTaskState[]> {
  return {
    foreground: projection.task_states.filter(
      (task) => laneForOperatorTask(task) === "foreground",
    ),
    background: projection.task_states.filter(
      (task) => laneForOperatorTask(task) === "background",
    ),
    waiting: projection.task_states.filter(
      (task) => laneForOperatorTask(task) === "waiting",
    ),
    recently_completed: projection.task_states.filter(
      (task) => laneForOperatorTask(task) === "recently_completed",
    ),
  };
}

export function assertValidOperatorWorkProjection(
  projection: OperatorWorkProjection,
): void {
  if (
    projection.live_replacement_gate !==
    "closed_pending_parity_proof_and_ani_approval"
  ) {
    throw new Error("live replacement gate must remain closed");
  }

  const taskIds = new Set<string>();
  const attentionRefs = new Set<string>();
  for (const task of projection.task_states) {
    if (taskIds.has(task.task_id)) {
      throw new Error(`duplicate operator task ${task.task_id}`);
    }
    taskIds.add(task.task_id);
    if (task.attention_ref) {
      if (attentionRefs.has(task.attention_ref)) {
        throw new Error(
          `duplicate attention destination ${task.attention_ref}`,
        );
      }
      attentionRefs.add(task.attention_ref);
    }
  }

  for (const lineage of projection.task_lineage) {
    if (!taskIds.has(lineage.destination_task_id)) {
      throw new Error(`lineage ${lineage.lineage_id} has no destination task`);
    }
  }

  for (const source of projection.source_states) {
    if (
      source.linked_task_id !== null ||
      source.searchable_history_disposition !== "preserved_collapsed"
    ) {
      throw new Error(`loose source ${source.source_id} must stay collapsed`);
    }
  }
}
