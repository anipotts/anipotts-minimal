export const OPERATOR_WORK_SOURCE_COMMIT =
  "ce1211baf9854abda4a4a7e9cf31b8e1326a079b";
export const OPERATOR_WORK_FIXTURE_SHA256 =
  "98966a8fecca68144e5d9f631cd37adb8ad2bc53cf5d6601c2165ff425c9cfb7";
export const OPERATOR_WORK_SCHEMA_SHA256 =
  "6bb184711cf67b1309b31179578cd2a0df67bcec6367a67570d6859791dc4ab5";

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
  projection_id: "admin.work-projection.fixture.v1";
  mode: "tracked_fixture";
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

const sharedObservation = {
  reconciled_at: "2026-07-25T15:45:00Z",
  source: "official_native_task_observation",
  source_ref: "codex:list_threads:schema-v4",
} as const;

export const operatorWorkFixture: OperatorWorkProjection = {
  schema_version: 1,
  projection_id: "admin.work-projection.fixture.v1",
  mode: "tracked_fixture",
  generated_at: "2026-07-25T15:45:00Z",
  reconciled_at: "2026-07-25T15:45:00Z",
  live_replacement_gate: "closed_pending_parity_proof_and_ani_approval",
  freshness_policy: {
    computed_upstream: true,
    fresh_for_seconds: 3600,
    future_timestamp_policy: "reject",
  },
  project_states: [
    {
      attention_ref: null,
      bounded_goal:
        "Build the read-only admin operator console without inventing backend truth.",
      bounded_summary:
        "The site project owns Astro UI and remains fixture-backed until the shared projection passes parity review.",
      canonical_title: "anipotts.com",
      cwd: "/Users/anipotts/Code/projects/anipotts-com",
      entity_refs: ["entity.project.site", "entity.surface.admin-work"],
      freshness: "fresh",
      host: "local",
      last_observed_at: "2026-07-25T15:43:41Z",
      lifecycle: "open",
      machine_role: "ap-pro-editor",
      native_ref: null,
      next_action:
        "Integrate the hash-pinned Infra fixture through the existing project-admin read seam.",
      object_type: "project_state",
      operator_state: "working",
      primary_entity_ref: "entity.project.site",
      project_id: "project.codex.site.local",
      project_label: "site",
      proof_owed:
        "Desktop and mobile proof for Inbox and Work after contract integration.",
      proof_refs: [
        "codex:list_projects:schema-v3",
        "codex:list_threads:schema-v4",
      ],
      provider: "codex",
      reconciled_at: "2026-07-25T15:45:00Z",
      relevant_surface: "admin.anipotts.com/work",
      repo: "anipotts/anipotts.com",
      runtime_state: "active",
      source: "official_native_project_observation",
      source_ref: "codex:list_projects:schema-v3",
      worktree: "/Users/anipotts/Code/worktrees/anipotts-com-operator-console",
    },
    {
      attention_ref: null,
      bounded_goal:
        "Complete the bounded Brand implementation while consuming only approved scoped preferences.",
      bounded_summary:
        "The Brand task is active on mini and depends on the vendor-neutral Infra contract, not unrestricted preference values.",
      canonical_title: "Brand",
      cwd: "/Users/anipotts/Brand",
      entity_refs: ["entity.project.brand", "entity.preference.consumer.brand"],
      freshness: "fresh",
      host: "mini",
      last_observed_at: "2026-07-25T15:43:43Z",
      lifecycle: "open",
      machine_role: "ap-mini-runtime",
      native_ref: null,
      next_action:
        "Consume the verified scoped contract after the Infra hash packet is available.",
      object_type: "project_state",
      operator_state: "working",
      primary_entity_ref: "entity.project.brand",
      project_id: "project.codex.brand.mini",
      project_label: "brand",
      proof_owed:
        "Hash-pinned integration proof for the accepted Brand consumer boundary.",
      proof_refs: [
        "codex:list_projects:schema-v3",
        "codex:list_threads:schema-v4",
      ],
      provider: "codex",
      reconciled_at: "2026-07-25T15:45:00Z",
      relevant_surface: "codex:project:brand",
      repo: "anipotts/Brand",
      runtime_state: "active",
      source: "official_native_project_observation",
      source_ref: "codex:list_projects:schema-v3",
      worktree: null,
    },
    {
      attention_ref: "inbox_fleet_jobs_task_ssh_rebind",
      bounded_goal:
        "Sequence exact human approvals while domain owners produce technical proof.",
      bounded_summary:
        "Fleet/gates remains the approval sequencer and references the canonical Inbox item for the next human action.",
      canonical_title: "fleet/gates",
      cwd: "/Users/anipotts/Documents/Codex/worktrees/fleet-gates",
      entity_refs: [
        "entity.workflow.fleet-gates",
        "entity.task.jobs-ssh-rebind",
      ],
      freshness: "fresh",
      host: "local",
      last_observed_at: "2026-07-25T15:43:38Z",
      lifecycle: "open",
      machine_role: "ap-pro-editor",
      native_ref: null,
      next_action:
        "Wait for the read-only SSH task rebind packet before presenting one exact native UI action.",
      object_type: "project_state",
      operator_state: "waiting",
      primary_entity_ref: "entity.task.jobs-ssh-rebind",
      project_id: "project.codex.fleet-gates.local",
      project_label: "fleet-gates",
      proof_owed:
        "Post-action native continuity proof if Ani approves and performs the rebind.",
      proof_refs: [
        "codex:list_threads:schema-v4",
        "admin-inbox:inbox_fleet_jobs_task_ssh_rebind",
      ],
      provider: "codex",
      reconciled_at: "2026-07-25T15:45:00Z",
      relevant_surface: "admin.anipotts.com/inbox",
      repo: null,
      runtime_state: "active",
      source: "official_native_task_observation",
      source_ref: "codex:list_threads:schema-v4",
      worktree: "/Users/anipotts/Documents/Codex/worktrees/fleet-gates",
    },
  ],
  task_states: [
    {
      attention_ref: null,
      bounded_goal:
        "Build the fixture-backed Work interface against the accepted Infra contract.",
      bounded_summary:
        "Active Astro implementation with backend truth explicitly owned by Infra and live replacement still closed.",
      canonical_title: "chief/site",
      cwd: "/Users/anipotts/Code/projects/anipotts-com",
      entity_refs: ["entity.project.site", "entity.surface.admin-work"],
      freshness: "fresh",
      host: "local",
      last_observed_at: "2026-07-25T15:43:41Z",
      lifecycle: "open",
      lineage_refs: ["lineage.fleet-boss-to-chief-site-work-console"],
      machine_role: "ap-pro-editor",
      native_ref: "codex:thread:019f7fb8-69b7-7791-8e67-87c87acfae02",
      next_action:
        "Read the hash-pinned projection and prove the existing adapter returns the same sanitized rows.",
      object_type: "task_state",
      operator_state: "working",
      owner: "chief/site",
      primary_entity_ref: "entity.project.site",
      project_id: "project.codex.site.local",
      project_label: "site",
      proof_owed:
        "Desktop and mobile Inbox plus Work evidence after integration.",
      proof_refs: ["codex:list_threads:schema-v4"],
      provider: "codex",
      relevant_surface: "admin.anipotts.com/work",
      repo: "anipotts/anipotts.com",
      runtime_state: "active",
      task_id: "019f7fb8-69b7-7791-8e67-87c87acfae02",
      worktree: "/Users/anipotts/Code/worktrees/anipotts-com-operator-console",
      ...sharedObservation,
    },
    {
      attention_ref: null,
      bounded_goal:
        "Finish the scoped Brand implementation using the approved preference interface.",
      bounded_summary:
        "Active remote Brand task with restricted preference values excluded from its consumer view.",
      canonical_title: "chief/brand",
      cwd: "/Users/anipotts/Brand",
      entity_refs: ["entity.project.brand", "entity.preference.consumer.brand"],
      freshness: "fresh",
      host: "mini",
      last_observed_at: "2026-07-25T15:43:43Z",
      lifecycle: "open",
      lineage_refs: [],
      machine_role: "ap-mini-runtime",
      native_ref: "codex:thread:019f95c5-be35-7991-811c-371611daa94b",
      next_action:
        "Verify the Brand consumer against the final Infra contract hash.",
      object_type: "task_state",
      operator_state: "working",
      owner: "chief/brand",
      primary_entity_ref: "entity.project.brand",
      project_id: "project.codex.brand.mini",
      project_label: "brand",
      proof_owed:
        "Consumer proof pinned to the final Infra commit and contract hash.",
      proof_refs: ["codex:list_threads:schema-v4"],
      provider: "codex",
      relevant_surface: "codex:task:chief-brand",
      repo: "anipotts/Brand",
      runtime_state: "active",
      task_id: "019f95c5-be35-7991-811c-371611daa94b",
      worktree: null,
      ...sharedObservation,
    },
    {
      attention_ref: "inbox_fleet_jobs_task_ssh_rebind",
      bounded_goal:
        "Sequence current fleet approvals from domain-owner proof without taking technical ownership.",
      bounded_summary:
        "Active gate task waiting for chief/infra to return a bounded read-only SSH task rebind packet.",
      canonical_title: "fleet/gates",
      cwd: "/Users/anipotts/Documents/Codex/worktrees/fleet-gates",
      entity_refs: [
        "entity.workflow.fleet-gates",
        "entity.task.jobs-ssh-rebind",
      ],
      freshness: "fresh",
      host: "local",
      last_observed_at: "2026-07-25T15:43:38Z",
      lifecycle: "open",
      lineage_refs: [],
      machine_role: "ap-pro-editor",
      native_ref: "codex:thread:019f99d2-90a1-7761-8582-17b7037c748b",
      next_action:
        "Present Ani one exact native UI decision after the technical packet is verified.",
      object_type: "task_state",
      operator_state: "waiting",
      owner: "fleet/gates",
      primary_entity_ref: "entity.task.jobs-ssh-rebind",
      project_id: "project.codex.fleet-gates.local",
      project_label: "fleet-gates",
      proof_owed:
        "Post-action task host, cwd, lineage, and heartbeat continuity proof.",
      proof_refs: [
        "codex:list_threads:schema-v4",
        "admin-inbox:inbox_fleet_jobs_task_ssh_rebind",
      ],
      provider: "codex",
      relevant_surface: "admin.anipotts.com/inbox",
      repo: null,
      runtime_state: "active",
      task_id: "019f99d2-90a1-7761-8582-17b7037c748b",
      worktree: "/Users/anipotts/Documents/Codex/worktrees/fleet-gates",
      ...sharedObservation,
    },
  ],
  task_lineage: [
    {
      bounded_summary:
        "Fleet/boss delegated Astro interface ownership to chief/site while chief/infra retained the sanitized source contract.",
      destination_task_id: "019f7fb8-69b7-7791-8e67-87c87acfae02",
      last_observed_at: "2026-07-25T15:43:41Z",
      lineage_id: "lineage.fleet-boss-to-chief-site-work-console",
      object_type: "task_lineage",
      predecessor_task_id: "019ed10b-518a-7d80-814b-cb52f7453646",
      proof_refs: ["codex:thread:019f7fb8-69b7-7791-8e67-87c87acfae02"],
      reconciled_at: "2026-07-25T15:45:00Z",
      relation: "handoff",
      source_ref: "codex:delegation:019ed10b-518a-7d80-814b-cb52f7453646",
    },
  ],
  source_states: [
    {
      canonical_title: "Loop Engineering Taxonomy",
      freshness: "stale",
      host: "cloud",
      last_observed_at: "2026-07-25T14:01:14Z",
      lifecycle: "open",
      linked_task_id: null,
      native_ref: "chatgpt:conversation:6a64c16b",
      object_type: "source_state",
      project_id: null,
      proof_refs: ["chatgpt:list_conversations:bounded-metadata"],
      provider: "chatgpt",
      reconciled_at: "2026-07-25T15:45:00Z",
      searchable_history_disposition: "preserved_collapsed",
      source: "official_native_source_observation",
      source_id: "source.chatgpt.6a64c16b",
      source_ref: "chatgpt:list_conversations",
    },
  ],
  safety: {
    contains_full_prompts: false,
    contains_private_payloads: false,
    contains_secrets: false,
    contains_tool_payloads: false,
    contains_transcripts: false,
  },
};

export function readOperatorWorkProjection(): OperatorWorkProjection {
  return structuredClone(operatorWorkFixture);
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
