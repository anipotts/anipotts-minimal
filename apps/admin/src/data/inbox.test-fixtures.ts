import type {
  AdminInboxItem,
  AdminInboxReadState,
  AdminInboxReferences,
} from "./inbox";
import {
  defineKnownReference,
  inspectorDestination,
  internalDestination,
  type KnownSemanticReference,
  type SemanticReferenceKind,
} from "./semantic-reference";

const checkedAt = "2026-07-31T12:00:00.000Z";

export function testInboxItem(
  values: Partial<AdminInboxItem> & Pick<AdminInboxItem, "id" | "entity_id">,
): AdminInboxItem {
  const item = {
    dedupe_key: values.dedupe_key ?? values.id,
    source: "test",
    owner: "chief/site",
    action_kind: "review",
    title: values.id,
    summary: "source-backed summary",
    status: "open",
    risk: "medium",
    category: "work",
    timeframe: "today",
    href: "/work",
    next_action: "take the next bounded action",
    proof: "proof:test",
    updated_at: checkedAt,
    ...values,
    id: values.id,
    entity_id: values.entity_id,
  } satisfies Omit<AdminInboxItem, "references"> & {
    references?: AdminInboxReferences;
  };

  return {
    ...item,
    references: values.references ?? testInboxReferences(item),
  };
}

export function testInboxReadState(
  items: AdminInboxItem[],
): AdminInboxReadState {
  return {
    generated_at: checkedAt,
    mode: "ready",
    counts: {
      total: items.length,
      high: items.filter((item) => item.risk === "high").length,
      medium: items.filter((item) => item.risk === "medium").length,
      low: items.filter((item) => item.risk === "low").length,
    },
    items,
    source: knownReference(
      "test-inbox:source",
      "source",
      "source state",
      "test projection",
      inspectorDestination("inspect source"),
    ),
  };
}

function testInboxReferences(
  item: Omit<AdminInboxItem, "references">,
): AdminInboxReferences {
  return {
    entity: knownReference(
      `${item.id}:entity`,
      "graph_entity",
      "entity",
      item.entity_id,
      inspectorDestination("inspect entity"),
    ),
    action: knownReference(
      `${item.id}:action`,
      "route",
      "route",
      "/work",
      internalDestination("/work", "open Work"),
    ),
    route: knownReference(
      `${item.id}:route`,
      "route",
      "route",
      "/work",
      internalDestination("/work", "open Work"),
    ),
    source: knownReference(
      `${item.id}:source`,
      "source",
      "source",
      item.source,
      inspectorDestination("inspect source"),
    ),
    owner: knownReference(
      `${item.id}:owner`,
      "task",
      "owner",
      item.owner,
      inspectorDestination("inspect owner"),
    ),
    proof: knownReference(
      `${item.id}:proof`,
      "proof",
      "proof",
      item.proof,
      inspectorDestination("inspect proof"),
    ),
    source_time: knownReference(
      `${item.id}:source-time`,
      "source_time",
      "source time",
      item.updated_at,
      inspectorDestination("inspect source time"),
    ),
    deadline: null,
  };
}

function knownReference<K extends SemanticReferenceKind>(
  id: string,
  kind: K,
  label: string,
  value: string,
  destination: ReturnType<
    typeof inspectorDestination | typeof internalDestination
  >,
): KnownSemanticReference<K> {
  return defineKnownReference({
    id,
    kind,
    label,
    value,
    summary: `Test ${label} reference.`,
    source_state: "verified",
    checked_at: checkedAt,
    authority: { kind: "internal", label: "test projection" },
    provenance: {
      source: "test",
      source_ref: `test:${id}`,
      method: "projection",
      evidence_refs: [`test:${id}`],
    },
    confidence: { level: "high", explanation: "Exact test value." },
    sensitivity: "internal",
    validity: { valid_from: checkedAt, valid_until: null },
    retrieval_policy: {
      mode: destination.type === "internal" ? "open_internal" : "inspect",
      refresh_href: null,
      explanation: `Use the declared test ${label} destination.`,
    },
    destination,
  });
}
