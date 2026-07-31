import type { AdminInboxItem, AdminInboxReadState } from "./inbox";
import type {
  OperatorTaskState,
  OperatorWorkProjection,
} from "./operator-work";

export const OPERATIONAL_PROJECTIONS = [
  "ready",
  "running",
  "waiting",
  "blocked",
  "needs-ani",
  "recently-completed",
] as const;

export type OperationalProjection = (typeof OPERATIONAL_PROJECTIONS)[number];
export type ActivationGraphLayer =
  | "world"
  | "obligation"
  | "execution"
  | "trajectory";

export type ActivationLane = {
  key: OperationalProjection;
  label: string;
  count: number;
  href: string;
  basis: string;
  source_state: "current" | "stale" | "partial";
};

export type ActivationGraphNode = {
  id: string;
  layer: ActivationGraphLayer;
  label: string;
  title: string;
  detail: string;
  href: string | null;
  source: string;
};

export type ActivationGraphConnection = {
  from: string;
  to: string;
  relation: "projects" | "assigned_to" | "owes_verification";
};

export type ActivationGraphProjection = {
  generated_at: string;
  mode: "ready" | "partial";
  work_source_state: "current" | "stale";
  work_last_verified_at: string;
  foreground: AdminInboxItem | null;
  foreground_reason: string;
  lanes: ActivationLane[];
  nodes: ActivationGraphNode[];
  connections: ActivationGraphConnection[];
};

export function buildActivationGraph(
  inbox: AdminInboxReadState,
  work: OperatorWorkProjection,
  now = new Date(),
): ActivationGraphProjection {
  const foreground = inbox.items[0] ?? null;
  const linkedTask = foreground
    ? findLinkedTask(work.task_states, foreground)
    : undefined;
  const workSourceState = isWorkProjectionCurrent(work, now)
    ? "current"
    : "stale";

  return {
    generated_at: inbox.generated_at,
    mode: inbox.mode,
    work_source_state: workSourceState,
    work_last_verified_at: work.generated_at,
    foreground,
    foreground_reason: foreground
      ? `${foreground.risk} priority · ${foreground.timeframe} · ${foreground.next_action}`
      : "No current attention item is available from the connected sources.",
    lanes: buildActivationLanes(inbox.items, work.task_states, workSourceState),
    nodes: foreground ? buildGraphNodes(foreground, linkedTask) : [],
    connections: foreground
      ? [
          {
            from: `world:${foreground.entity_id}`,
            to: `obligation:${foreground.id}`,
            relation: "projects",
          },
          {
            from: `obligation:${foreground.id}`,
            to: `execution:${linkedTask?.task_id ?? foreground.owner}`,
            relation: "assigned_to",
          },
          {
            from: `execution:${linkedTask?.task_id ?? foreground.owner}`,
            to: `trajectory:${foreground.id}`,
            relation: "owes_verification",
          },
        ]
      : [],
  };
}

export function itemMatchesOperationalProjection(
  item: AdminInboxItem,
  projection: OperationalProjection,
): boolean {
  if (projection === "blocked") return isBlocked(item);
  if (projection === "waiting") return isWaiting(item);
  if (projection === "needs-ani") return needsAni(item);
  if (projection === "ready") {
    return !isBlocked(item) && !isWaiting(item) && !needsAni(item);
  }
  return false;
}

function buildActivationLanes(
  items: AdminInboxItem[],
  tasks: OperatorTaskState[],
  workSourceState: "current" | "stale",
): ActivationLane[] {
  const inboxSourceState = "current" as const;
  const workLaneSourceState = workSourceState;

  return [
    {
      key: "ready",
      label: "ready",
      count: items.filter((item) =>
        itemMatchesOperationalProjection(item, "ready"),
      ).length,
      href: "/?view=ready",
      basis:
        "actionable without a waiting, blocking, or personal-authority signal",
      source_state: inboxSourceState,
    },
    {
      key: "running",
      label: "running",
      count: tasks.filter(
        (task) =>
          task.lifecycle === "open" &&
          (task.operator_state === "working" ||
            task.operator_state === "review"),
      ).length,
      href: "/work?view=now",
      basis: "operator work projection",
      source_state: workLaneSourceState,
    },
    {
      key: "waiting",
      label: "waiting",
      count:
        items.filter((item) =>
          itemMatchesOperationalProjection(item, "waiting"),
        ).length +
        tasks.filter(
          (task) =>
            task.lifecycle === "open" && task.operator_state === "waiting",
        ).length,
      href: "/?view=waiting",
      basis: "time, response, or another condition must change",
      source_state:
        workLaneSourceState === "stale" ? "stale" : inboxSourceState,
    },
    {
      key: "blocked",
      label: "blocked",
      count:
        items.filter((item) =>
          itemMatchesOperationalProjection(item, "blocked"),
        ).length +
        tasks.filter(
          (task) =>
            task.lifecycle === "open" && task.operator_state === "blocked",
        ).length,
      href: "/?view=blocked",
      basis: "an actionable constraint or resolver is identified",
      source_state:
        workLaneSourceState === "stale" ? "stale" : inboxSourceState,
    },
    {
      key: "needs-ani",
      label: "needs ani",
      count: items.filter((item) =>
        itemMatchesOperationalProjection(item, "needs-ani"),
      ).length,
      href: "/?view=needs-ani",
      basis: "Ani's authority, decision, or presence is explicitly signaled",
      source_state: inboxSourceState,
    },
    {
      key: "recently-completed",
      label: "recently completed",
      count: tasks.filter(
        (task) =>
          task.lifecycle === "completed" || task.operator_state === "completed",
      ).length,
      href: "/work?view=history",
      basis: "operator work projection",
      source_state: workLaneSourceState,
    },
  ];
}

function buildGraphNodes(
  item: AdminInboxItem,
  linkedTask?: OperatorTaskState,
): ActivationGraphNode[] {
  return [
    {
      id: `world:${item.entity_id}`,
      layer: "world",
      label: "entity",
      title: item.title,
      detail: item.summary,
      href: item.href,
      source: item.source,
    },
    {
      id: `obligation:${item.id}`,
      layer: "obligation",
      label: item.timeframe,
      title: item.next_action,
      detail: `${item.status} · ${item.risk} priority`,
      href: item.href,
      source: item.dedupe_key,
    },
    {
      id: `execution:${linkedTask?.task_id ?? item.owner}`,
      layer: "execution",
      label: linkedTask ? linkedTask.operator_state : item.action_kind,
      title: linkedTask?.canonical_title ?? item.owner,
      detail:
        linkedTask?.bounded_goal ??
        `Resolver recorded as ${item.owner}; required-party detail is not yet modeled.`,
      href: linkedTask ? "/work?view=now" : item.href,
      source: linkedTask?.source_ref ?? item.source,
    },
    {
      id: `trajectory:${item.id}`,
      layer: "trajectory",
      label: "verification",
      title: linkedTask?.proof_owed ?? "Proof pointer retained",
      detail: `Trajectory is not normalized yet. Evidence pointer: ${item.proof}`,
      href: linkedTask ? "/work?view=now" : item.href,
      source: linkedTask?.proof_refs.join(", ") || item.proof,
    },
  ];
}

function findLinkedTask(
  tasks: OperatorTaskState[],
  item: AdminInboxItem,
): OperatorTaskState | undefined {
  return tasks.find(
    (task) =>
      task.attention_ref === item.id ||
      task.primary_entity_ref === item.entity_id ||
      task.entity_refs.includes(item.entity_id),
  );
}

function isBlocked(item: AdminInboxItem): boolean {
  return item.status.toLowerCase().includes("blocked");
}

function isWaiting(item: AdminInboxItem): boolean {
  return (
    item.timeframe.toLowerCase().includes("waiting") ||
    item.status.toLowerCase().includes("waiting")
  );
}

function needsAni(item: AdminInboxItem): boolean {
  const status = item.status.toLowerCase().replaceAll("_", " ");
  const owner = item.owner.toLowerCase();
  return (
    item.action_kind === "approve" ||
    item.action_kind === "decide" ||
    owner === "ani" ||
    owner === "anirudh" ||
    status.includes("needs ani")
  );
}

function isWorkProjectionCurrent(
  work: OperatorWorkProjection,
  now: Date,
): boolean {
  const generatedAt = Date.parse(work.generated_at);
  if (!Number.isFinite(generatedAt)) return false;
  const ageSeconds = (now.getTime() - generatedAt) / 1000;
  return (
    ageSeconds >= 0 && ageSeconds <= work.freshness_policy.fresh_for_seconds
  );
}
