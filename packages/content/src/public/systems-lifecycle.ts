import type { SystemsLifecycle } from "@anipotts/types";

const kinds = new Set([
  "stage",
  "human",
  "context",
  "records",
  "credential",
  "runtime",
  "archive",
  "feedback",
]);
const edgeKinds = new Set([
  "flow",
  "context",
  "human",
  "retry",
  "persist",
  "transport",
  "credential",
  "feedback",
  "archive",
]);
const routes = new Set(["direct", "left", "right", "outer", "support", "self"]);
const record = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));
const text = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 && value.length <= 2000;
const identifier = (value: unknown): value is string =>
  typeof value === "string" && /^[a-z][a-z0-9_]*$/.test(value);

export function validateSystemsLifecycle(value: unknown): {
  ok: boolean;
  error?: string;
} {
  const fail = (error: string) => ({
    ok: false,
    error: "Systems lifecycle: " + error,
  });
  if (!record(value)) return fail("expected an object");
  if (value.status !== "intended system")
    return fail("intended state must be explicit");
  if (
    !Array.isArray(value.domains) ||
    value.domains.join(",") !== "career,learning,wellbeing,personal"
  )
    return fail("expected four ordered life areas");
  if (
    !Array.isArray(value.workers) ||
    value.workers.length !== 2 ||
    value.workers.some(
      (worker) =>
        !record(worker) ||
        !identifier(worker.id) ||
        !text(worker.label) ||
        !["claude", "openai"].includes(String(worker.mark)),
    )
  )
    return fail("invalid workers");
  if (
    new Set(value.workers.map((worker) => worker.id)).size !==
    value.workers.length
  )
    return fail("duplicate worker");
  if (!record(value.copy)) return fail("missing presentation copy");
  for (const key of [
    "caption",
    "context_hint",
    "human_hint",
    "more_sources",
    "transport",
    "feedback_hint",
    "walkthrough_label",
    "back",
    "next",
    "reset",
  ])
    if (!text(value.copy[key])) return fail("missing copy " + key);
  for (const key of [
    "principle",
    "execution_label",
    "completion_rule",
    "pause_rule",
  ]) {
    if (!text(value[key])) return fail("missing " + key);
  }
  for (const key of [
    "stages",
    "support",
    "sources",
    "devices",
    "edges",
    "walkthrough",
  ]) {
    if (!Array.isArray(value[key]) || !value[key].length)
      return fail("missing " + key);
  }
  const stages = value.stages as unknown[];
  const support = value.support as unknown[];
  const nodes = [...stages, ...support];
  const ids = new Set<string>();
  for (const node of nodes) {
    if (
      !record(node) ||
      !identifier(node.id) ||
      !text(node.label) ||
      !text(node.detail) ||
      !kinds.has(String(node.kind))
    )
      return fail("invalid node");
    if (ids.has(node.id)) return fail("duplicate node " + node.id);
    ids.add(node.id);
  }
  if (
    stages.length !== 6 ||
    stages.some((node) => (node as Record<string, unknown>).kind !== "stage")
  )
    return fail("expected six ordered stages");
  if (
    stages.map((node) => (node as Record<string, unknown>).id).join(",") !==
    "request,understand,gather,act,verify,complete"
  )
    return fail("invalid lifecycle order");
  for (const id of [
    "context",
    "records",
    "credentials",
    "ani",
    "runtime",
    "archive",
    "feedback",
  ])
    if (!ids.has(id)) return fail("missing support endpoint " + id);
  const edgeIds = new Set<string>();
  for (const edge of value.edges as unknown[]) {
    if (
      !record(edge) ||
      !identifier(edge.id) ||
      typeof edge.label !== "string" ||
      !text(edge.detail) ||
      !edgeKinds.has(String(edge.kind)) ||
      !routes.has(String(edge.route))
    )
      return fail("invalid edge");
    if (edgeIds.has(edge.id)) return fail("duplicate edge " + edge.id);
    if (!ids.has(String(edge.source)) || !ids.has(String(edge.destination)))
      return fail("missing endpoint for " + edge.id);
    edgeIds.add(edge.id);
  }
  const edges = value.edges as Record<string, unknown>[];
  for (const [source, destination, kind] of [
    ["request", "understand", "flow"],
    ["understand", "gather", "flow"],
    ["gather", "act", "flow"],
    ["act", "verify", "flow"],
    ["verify", "complete", "persist"],
    ["gather", "context", "context"],
    ["context", "gather", "context"],
    ["verify", "act", "retry"],
    ["act", "gather", "context"],
    ["context", "ani", "human"],
    ["ani", "understand", "human"],
    ["ani", "act", "human"],
    ["complete", "complete", "retry"],
    ["complete", "ani", "human"],
    ["ani", "complete", "human"],
    ["complete", "records", "persist"],
    ["complete", "runtime", "persist"],
    ["complete", "feedback", "feedback"],
    ["feedback", "request", "feedback"],
    ["feedback", "context", "feedback"],
  ]) {
    if (
      !edges.some(
        (edge) =>
          edge.source === source &&
          edge.destination === destination &&
          edge.kind === kind,
      )
    )
      return fail(`missing ${kind} path from ${source} to ${destination}`);
  }
  for (const list of ["sources", "devices"]) {
    const seen = new Set<string>();
    for (const item of value[list] as unknown[]) {
      if (
        !record(item) ||
        typeof item.id !== "string" ||
        !text(item.label) ||
        !text(item.mark) ||
        seen.has(item.id)
      )
        return fail("invalid or duplicate " + list);
      if (
        list === "sources" &&
        !["records", "credentials", "more"].includes(String(item.group))
      )
        return fail("invalid source group");
      if (!/^(?:[a-z0-9-]+:[a-z0-9-]+|[a-z0-9-]+)$/.test(String(item.mark)))
        return fail("invalid source mark");
      seen.add(item.id);
    }
  }
  for (const step of value.walkthrough as unknown[]) {
    if (
      !record(step) ||
      !text(step.title) ||
      !text(step.detail) ||
      !Array.isArray(step.nodes) ||
      !Array.isArray(step.edges)
    )
      return fail("invalid walkthrough step");
    if (
      !step.nodes.length ||
      step.nodes.some((id) => !ids.has(String(id))) ||
      step.edges.some((id) => !edgeIds.has(String(id)))
    )
      return fail("invalid walkthrough reference");
  }
  return { ok: true };
}

export function normalizeSystemsLifecycle(
  value: unknown,
  fallback: SystemsLifecycle,
): SystemsLifecycle {
  // Missing legacy content receives the current canonical graph. Explicit invalid
  // graphs remain invalid so save validation cannot silently replace bad endpoints.
  if (value === undefined || value === null) return structuredClone(fallback);
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as SystemsLifecycle;
    } catch {
      return value as unknown as SystemsLifecycle;
    }
  }
  return structuredClone(value) as SystemsLifecycle;
}
