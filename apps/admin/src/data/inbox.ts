import {
  newsletterDrafts,
  readContentOperationStore,
  readPageContentInventoryStore,
  readProofEntries,
  type ContentInventoryD1Database,
  type ContentOperationD1Database,
  type ProofD1Database,
  type RiskLevel,
} from "@anipotts/content/admin";
import {
  loadAdminControlSnapshot,
  type AdminControlDatabase,
  type AdminInboxItem as AdminControlInboxItem,
} from "@anipotts/lib/admin-control";
import { carouselPosts, carouselSeries, carouselSummary } from "./carousels";
import { loadRuntimeOverlayResponse } from "./runtime";
import {
  defineKnownReference,
  defineMissingReference,
  inspectorDestination,
  internalDestination,
  isSafeInternalHref,
  semanticReferenceId,
  type SemanticProvenanceMethod,
  type SemanticReference,
  type SemanticSensitivity,
  type SemanticSourceState,
} from "./semantic-reference";

type BoundAdminControlDatabase = Exclude<
  AdminControlDatabase,
  null | undefined
>;

type AdminInboxDb = ContentInventoryD1Database &
  ContentOperationD1Database &
  ProofD1Database &
  BoundAdminControlDatabase;

export type AdminInboxCategory =
  | "work"
  | "content"
  | "life"
  | "fleet"
  | "system";
export type AdminInboxTimeframe =
  | "now"
  | "today"
  | "this week"
  | "waiting / gated";

export type AdminInboxItem = {
  id: string;
  entity_id: string;
  dedupe_key: string;
  source: string;
  owner: string;
  action_kind: string;
  title: string;
  summary: string;
  status: string;
  risk: RiskLevel;
  category: AdminInboxCategory;
  timeframe: AdminInboxTimeframe;
  href: string;
  next_action: string;
  copy_text?: string;
  proof: string;
  updated_at: string;
  references: AdminInboxReferences;
};

export type AdminInboxReferences = {
  entity: SemanticReference<"graph_entity">;
  action: SemanticReference<"route">;
  route: SemanticReference<"route">;
  source: SemanticReference<"source">;
  owner: SemanticReference<"person" | "task" | "organization">;
  proof: SemanticReference<"proof">;
  source_time: SemanticReference<"source_time">;
  deadline: SemanticReference<"deadline"> | null;
};

export type AdminInboxReadState = {
  generated_at: string;
  mode: "ready" | "partial";
  counts: {
    total: number;
    high: number;
    medium: number;
    low: number;
  };
  items: AdminInboxItem[];
  source: SemanticReference<"source">;
};

type AdminInboxItemFields = Omit<AdminInboxItem, "references">;

type InboxReferenceContext = {
  source_state: Exclude<SemanticSourceState, "absent">;
  source_method: SemanticProvenanceMethod;
  source_ref: string;
  evidence_refs: string[];
  checked_at: string | null;
  observed_at: string | null;
  time_state: SemanticSourceState;
  deadline_at?: string | null;
  sensitivity?: SemanticSensitivity;
  owner_kind?: "person" | "task" | "organization";
};

const CLOSED_STATUSES = new Set([
  "archived",
  "closed",
  "completed",
  "resolved",
  "verified",
]);
const STATIC_SOURCE_OBSERVED_AT = "1970-01-01T00:00:00.000Z";

export async function readAdminInbox(
  db: AdminInboxDb | null | undefined,
): Promise<AdminInboxReadState> {
  const now = new Date().toISOString();
  const [control, proof, operations, pageContent, runtime] = await Promise.all([
    loadAdminControlSnapshot(db),
    readProofEntries(db),
    readContentOperationStore(db),
    readPageContentInventoryStore(db),
    loadRuntimeOverlayResponse(),
  ]);

  const controlReferenceState: "verified" | "stale" | "unknown" =
    control.errors.length > 0
      ? "unknown"
      : control.source_mode === "d1"
        ? "verified"
        : "stale";
  const controlReferenceMethod: SemanticProvenanceMethod =
    control.source_mode === "d1" ? "projection" : "fixture";
  const runtimeReferenceState: "verified" | "stale" =
    runtime.available && runtime.generated_at ? "verified" : "stale";

  const items: AdminInboxItem[] = [
    ...control.projections.inbox_items
      .filter((item) => isOpenProjectionItem(item))
      .map((item) =>
        inboxItemFromProjection(item, now, {
          source_state: controlReferenceState,
          source_method: controlReferenceMethod,
          source_ref: item.event_refs[0] ?? item.dedupe_key,
          evidence_refs: item.event_refs,
          checked_at:
            controlReferenceState === "verified"
              ? control.generated_at
              : item.last_seen_at,
          observed_at: item.last_seen_at,
          time_state: item.last_seen_at
            ? controlReferenceState === "verified"
              ? "verified"
              : "stale"
            : control.source_mode === "d1"
              ? "absent"
              : "unchecked",
          deadline_at: item.expires_at,
          sensitivity: "internal",
          owner_kind: "task",
        }),
      ),
    ...proof
      .filter(
        (entry) =>
          entry.status !== "verified" &&
          !entry.title.toLowerCase().includes("d1 read failed") &&
          !entry.summary.toLowerCase().includes("d1_error"),
      )
      .map((entry) =>
        createInboxItem(
          {
            id: entry.id,
            entity_id: entityIdFor(`proof:${entry.id}`),
            dedupe_key: `proof:${entry.id}`,
            source: entry.kind === "auth" ? "auth" : "deploy",
            owner: "chief/site",
            action_kind: "verify",
            title: entry.title,
            summary: entry.summary,
            status: normalizeStatus(entry.status),
            risk: entry.status === "blocked" ? "high" : "medium",
            category: "fleet",
            timeframe: entry.status === "blocked" ? "waiting / gated" : "now",
            href: entry.kind === "auth" ? "/proof" : "/deploys",
            next_action: entry.next_safe_action,
            copy_text: entry.next_safe_action,
            proof: entry.evidence_uri,
            updated_at: STATIC_SOURCE_OBSERVED_AT,
          },
          {
            source_state: "stale",
            source_method: "fixture",
            source_ref: `proof:${entry.id}`,
            evidence_refs: [entry.evidence_uri],
            checked_at: null,
            observed_at: null,
            time_state: "unchecked",
            sensitivity: "internal",
            owner_kind: "task",
          },
        ),
      ),
    ...operations.operations
      .filter((operation) =>
        ["draft", "previewed", "needs_ani", "blocked"].includes(
          operation.status,
        ),
      )
      .map<AdminInboxItem>((operation) => {
        const nextAction =
          operation.status === "blocked"
            ? operation.authority_state
            : "open preview, then publish only a selected published-visibility draft";

        return createInboxItem(
          {
            id: operation.operation_id,
            entity_id: entityIdFor(
              `content-operation:${operation.operation_id}`,
            ),
            dedupe_key: `content-operation:${operation.operation_id}`,
            source: "content",
            owner: operation.created_by,
            action_kind: operation.status === "blocked" ? "approve" : "review",
            title: operation.field_path,
            summary: operation.reviewer_note ?? operation.proposed_value,
            status: normalizeStatus(operation.status),
            risk: operation.risk_level,
            category: "content",
            timeframe:
              operation.status === "blocked" ? "waiting / gated" : "today",
            href: operation.preview_targets[0] ?? "/content/drafts",
            next_action: nextAction,
            copy_text: nextAction,
            proof: operation.proof_ids.join(", ") || operation.source_ref,
            updated_at: operation.updated_at,
          },
          {
            source_state: "verified",
            source_method: "projection",
            source_ref: operation.source_ref,
            evidence_refs:
              operation.proof_ids.length > 0
                ? operation.proof_ids
                : [operation.source_ref],
            checked_at: operation.updated_at,
            observed_at: operation.updated_at,
            time_state: "verified",
            deadline_at: operation.expires_at,
            sensitivity: "internal",
            owner_kind: "task",
          },
        );
      }),
    ...runtime.overlays
      .filter(
        (overlay) =>
          (overlay.ahead ?? 0) > 0 ||
          (overlay.behind ?? 0) > 0 ||
          (overlay.dirty_tracked_count ?? 0) > 0 ||
          (overlay.untracked_count ?? 0) > 0 ||
          !overlay.git_available,
      )
      .map((overlay) =>
        createInboxItem(
          {
            id: overlay.repo_state_id,
            entity_id: entityIdFor(`fleet:${overlay.repo_state_id}`),
            dedupe_key: `fleet:${overlay.repo_state_id}`,
            source: "fleet",
            owner: "chief/infra",
            action_kind: "review",
            title: `${overlay.repo} on ${overlay.machine}`,
            summary: `${overlay.branch ?? "no branch"} / dirty ${overlay.dirty_tracked_count ?? 0} / untracked ${overlay.untracked_count ?? 0}`,
            status: overlay.git_available
              ? normalizeStatus(overlay.deploy_impact)
              : "git unavailable",
            risk: overlay.deploy_impact === "production" ? "high" : "medium",
            category: "system",
            timeframe: overlay.deploy_impact === "production" ? "now" : "today",
            href: "/fleet",
            next_action: overlay.notes,
            copy_text: overlay.notes,
            proof: overlay.live_runtime_role,
            updated_at: runtime.generated_at ?? now,
          },
          {
            source_state: runtimeReferenceState,
            source_method: "projection",
            source_ref: overlay.repo_state_id,
            evidence_refs: overlay.head_sha ? [overlay.head_sha] : [],
            checked_at: runtime.generated_at,
            observed_at: runtime.generated_at,
            time_state: runtime.generated_at
              ? runtimeReferenceState
              : "unknown",
            sensitivity: "internal",
            owner_kind: "task",
          },
        ),
      ),
    ...runtime.gmail_sent_awareness.projections.inbox_items
      .filter((item) => isOpenProjectionItem(item))
      .map<AdminInboxItem>((item) => {
        const nextAction =
          item.action_kind === "none"
            ? "no action required"
            : "review the projected follow-up; sent-mail proof is event-only";

        return createInboxItem(
          {
            id: item.item_id,
            entity_id: item.entity_ref,
            dedupe_key: item.dedupe_key,
            source: "gmail",
            owner: item.owner,
            action_kind: item.action_kind,
            title: item.title,
            summary: item.summary,
            status: normalizeStatus(item.status),
            risk: riskForUrgency(item.urgency),
            category: item.domain === "work" ? "work" : "system",
            timeframe: timeframeForProjection(item),
            href: item.href ?? "/?category=work",
            next_action: nextAction,
            copy_text: item.action_kind === "none" ? undefined : nextAction,
            proof: item.event_refs.join(", ") || item.dedupe_key,
            updated_at:
              item.last_seen_at ??
              runtime.generated_at ??
              item.expires_at ??
              now,
          },
          {
            source_state: runtimeReferenceState,
            source_method: "projection",
            source_ref: item.event_refs[0] ?? item.dedupe_key,
            evidence_refs: item.event_refs,
            checked_at: runtime.generated_at,
            observed_at: item.last_seen_at,
            time_state: item.last_seen_at
              ? runtimeReferenceState
              : runtime.generated_at
                ? "absent"
                : "unknown",
            deadline_at: item.expires_at,
            sensitivity: "private",
            owner_kind: "task",
          },
        );
      }),
    ...newsletterDrafts
      .filter((draft) => draft.status !== "ready_for_review")
      .map((draft) =>
        createInboxItem(
          {
            id: draft.id,
            entity_id: entityIdFor(`newsletter:${draft.id}`),
            dedupe_key: `newsletter:${draft.id}`,
            source: "newsletter",
            owner: "chief/site",
            action_kind: "review",
            title: draft.title,
            summary: draft.summary,
            status: normalizeStatus(draft.status),
            risk: draft.status === "blocked" ? "high" : "low",
            category: "content",
            timeframe:
              draft.status === "blocked" ? "waiting / gated" : "this week",
            href: `/newsletter/${draft.slug}`,
            next_action: draft.pipeline.next_action,
            copy_text: draft.pipeline.next_action,
            proof: draft.source_fixture,
            updated_at: STATIC_SOURCE_OBSERVED_AT,
          },
          {
            source_state: "stale",
            source_method: "fixture",
            source_ref: draft.source_fixture,
            evidence_refs: [draft.source_fixture],
            checked_at: null,
            observed_at: null,
            time_state: "unchecked",
            sensitivity: "internal",
            owner_kind: "task",
          },
        ),
      ),
    ...carouselPosts
      .filter((post) => post.staleCount > 0 || post.soundStatus !== "approved")
      .map<AdminInboxItem>((post) => {
        const nextAction =
          carouselSummary.staleExports > 0
            ? "review stale crop outputs before export"
            : "review sound approval before platform prep";

        const observedAt =
          carouselSeries.generatedAt === "unknown"
            ? null
            : carouselSeries.generatedAt;
        return createInboxItem(
          {
            id: post.id,
            entity_id: entityIdFor(`carousel:${post.id}`),
            dedupe_key: `carousel:${post.id}`,
            source: "carousel",
            owner: "media/carousels",
            action_kind: "review",
            title: post.title,
            summary: `${post.readyExports}/${post.slideCount * 2} exports ready; sound ${post.soundStatus}`,
            status: normalizeStatus(post.status),
            risk: post.staleCount > 0 ? "medium" : "low",
            category: "content",
            timeframe: "this week",
            href: "/content/carousels",
            next_action: nextAction,
            copy_text: nextAction,
            proof: "media carousel handoff manifest",
            updated_at: observedAt ?? STATIC_SOURCE_OBSERVED_AT,
          },
          {
            source_state: "stale",
            source_method: "fixture",
            source_ref: "media carousel handoff manifest",
            evidence_refs: ["media carousel handoff manifest"],
            checked_at: observedAt,
            observed_at: observedAt,
            time_state: observedAt ? "stale" : "unchecked",
            sensitivity: "internal",
            owner_kind: "task",
          },
        );
      }),
  ];

  const sorted = rankInboxItems(items);
  const mode =
    control.errors.length === 0 &&
    pageContent.mode === "ready" &&
    operations.mode !== "read_failed" &&
    runtime.mode !== "error"
      ? "ready"
      : "partial";

  return {
    generated_at: now,
    mode,
    counts: {
      total: sorted.length,
      high: sorted.filter((item) => item.risk === "high").length,
      medium: sorted.filter((item) => item.risk === "medium").length,
      low: sorted.filter((item) => item.risk === "low").length,
    },
    items: sorted,
    source: inboxReadSourceReference({
      mode,
      sourceMode: control.source_mode,
      checkedAt: now,
      errors: control.errors,
    }),
  };
}

function isOpenProjectionItem(
  item: Pick<AdminControlInboxItem, "action_kind" | "status">,
): boolean {
  return item.action_kind !== "none" && !CLOSED_STATUSES.has(item.status);
}

function inboxItemFromProjection(
  item: AdminControlInboxItem,
  now: string,
  referenceContext: InboxReferenceContext,
): AdminInboxItem {
  const category = item.domain;

  return createInboxItem(
    {
      id: item.item_id,
      entity_id: item.entity_ref,
      dedupe_key: item.dedupe_key,
      source: item.source,
      owner: item.owner,
      action_kind: item.action_kind,
      title: item.title,
      summary: item.summary,
      status: normalizeStatus(item.status),
      risk: riskForUrgency(item.urgency),
      category,
      timeframe: timeframeForProjection(item),
      href: item.href ?? `/?category=${category}`,
      next_action: nextActionForProjection(item),
      proof: item.event_refs.join(", ") || item.dedupe_key,
      updated_at: item.last_seen_at ?? item.expires_at ?? now,
    },
    referenceContext,
  );
}

function createInboxItem(
  fields: AdminInboxItemFields,
  context: InboxReferenceContext,
): AdminInboxItem {
  return {
    ...fields,
    references: buildInboxReferences(fields, context),
  };
}

function buildInboxReferences(
  item: AdminInboxItemFields,
  context: InboxReferenceContext,
): AdminInboxReferences {
  const readAt = context.checked_at ?? new Date().toISOString();
  const valueState: "verified" | "stale" =
    context.source_state === "verified" ? "verified" : "stale";
  const valueCheckedAt =
    valueState === "verified" ? context.checked_at : context.checked_at;
  const authority = {
    kind: "recorded" as const,
    label: "admin projection",
  };
  const confidence = {
    level: valueState === "verified" ? ("high" as const) : ("medium" as const),
    explanation:
      valueState === "verified"
        ? "The current projection supplied this value."
        : "The value is retained, but its source is not current.",
  };
  const provenance = {
    source: item.source,
    source_ref: context.source_ref,
    method: context.source_method,
    evidence_refs: context.evidence_refs,
  };
  const sensitivity = context.sensitivity ?? "internal";
  const actionHref = adminInboxDomainHref(item);

  const entity = defineKnownReference({
    id: semanticReferenceId(item.id, "entity"),
    kind: "graph_entity",
    label: "entity",
    value: item.entity_id,
    summary: item.summary,
    source_state: valueState,
    checked_at: valueCheckedAt,
    authority,
    provenance,
    confidence,
    sensitivity,
    validity: { valid_from: context.observed_at, valid_until: null },
    retrieval_policy: {
      mode: "inspect",
      refresh_href: null,
      explanation: "Inspect the exact entity and its source lineage.",
    },
    destination: inspectorDestination("inspect entity"),
  });

  const action = defineKnownReference({
    id: semanticReferenceId(item.id, "action-route"),
    kind: "route",
    label: "route",
    value: actionHref,
    summary: `Safe internal review surface for ${item.title}.`,
    source_state: "verified",
    checked_at: readAt,
    authority: { kind: "internal", label: "admin route registry" },
    provenance: {
      source: "admin_route_registry",
      source_ref: `admin-route:${item.category}`,
      method: "projection",
      evidence_refs: [],
    },
    confidence: {
      level: "high",
      explanation: "The route was created from the typed Inbox category.",
    },
    sensitivity: "internal",
    validity: { valid_from: readAt, valid_until: null },
    retrieval_policy: {
      mode: "open_internal",
      refresh_href: null,
      explanation: "Open the declared internal review surface.",
    },
    destination: internalDestination(actionHref, "open review surface"),
  });

  const route = isSafeInternalHref(item.href)
    ? defineKnownReference({
        id: semanticReferenceId(item.id, "route"),
        kind: "route",
        label: "route",
        value: item.href,
        summary: "The source supplied a safe internal route.",
        source_state: "verified",
        checked_at: readAt,
        authority: { kind: "internal", label: "admin internal route" },
        provenance,
        confidence: {
          level: "high",
          explanation: "The route passed the internal destination validator.",
        },
        sensitivity,
        validity: { valid_from: readAt, valid_until: null },
        retrieval_policy: {
          mode: "open_internal",
          refresh_href: null,
          explanation: "Open the exact source-declared internal route.",
        },
        destination: internalDestination(item.href, "open internal route"),
      })
    : defineMissingReference({
        id: semanticReferenceId(item.id, "route"),
        kind: "route",
        label: "route",
        value: null,
        summary:
          "No safe internal or provider-authoritative destination was supplied.",
        source_state: "unknown",
        checked_at: readAt,
        authority: { kind: "none", label: "destination authority unavailable" },
        provenance,
        confidence: {
          level: "unknown",
          explanation: "A provider destination cannot be inferred from text.",
        },
        sensitivity,
        validity: { valid_from: null, valid_until: null },
        retrieval_policy: {
          mode: "inspect",
          refresh_href: null,
          explanation: "Inspect provenance without following the raw value.",
        },
        destination: inspectorDestination("inspect route provenance"),
      });

  const source =
    context.source_state === "verified" || context.source_state === "stale"
      ? defineKnownReference({
          id: semanticReferenceId(item.id, "source"),
          kind: "source",
          label: "source",
          value: item.source,
          summary:
            context.source_state === "verified"
              ? "The current projection supplied this source."
              : "This source is retained from a previous or fixture projection.",
          source_state: context.source_state,
          checked_at: context.checked_at,
          authority,
          provenance,
          confidence,
          sensitivity,
          validity: { valid_from: context.observed_at, valid_until: null },
          retrieval_policy: {
            mode:
              context.source_state === "verified"
                ? "inspect"
                : "refresh_then_inspect",
            refresh_href:
              context.source_state === "verified"
                ? null
                : `/?item=${encodeURIComponent(item.id)}`,
            explanation:
              context.source_state === "verified"
                ? "Inspect source authority and evidence."
                : "Refresh the root projection or inspect the retained source.",
          },
          destination: inspectorDestination("inspect source"),
        })
      : defineMissingReference({
          id: semanticReferenceId(item.id, "source"),
          kind: "source",
          label: "source",
          value: null,
          summary:
            context.source_state === "unchecked"
              ? "No provider or current source lookup has run for this value."
              : "The current read could not determine source authority.",
          source_state: context.source_state,
          checked_at:
            context.source_state === "unchecked" ? null : context.checked_at,
          authority: { kind: "none", label: "source authority unavailable" },
          provenance,
          confidence: {
            level: "unknown",
            explanation: "Current source authority is unavailable.",
          },
          sensitivity,
          validity: { valid_from: null, valid_until: null },
          retrieval_policy: {
            mode: "refresh_then_inspect",
            refresh_href: `/?item=${encodeURIComponent(item.id)}`,
            explanation: "Refresh the root projection or inspect provenance.",
          },
          destination: inspectorDestination("inspect source"),
        });

  const owner = defineKnownReference({
    id: semanticReferenceId(item.id, "owner"),
    kind: context.owner_kind ?? "task",
    label: "owner",
    value: item.owner,
    summary: `Resolver recorded for ${item.title}.`,
    source_state: valueState,
    checked_at: valueCheckedAt,
    authority,
    provenance,
    confidence,
    sensitivity,
    validity: { valid_from: context.observed_at, valid_until: null },
    retrieval_policy: {
      mode: "inspect",
      refresh_href: null,
      explanation: "Inspect resolver identity, provenance, and authority.",
    },
    destination: inspectorDestination("inspect owner"),
  });

  const proof = defineKnownReference({
    id: semanticReferenceId(item.id, "proof"),
    kind: "proof",
    label: "proof",
    value: item.proof,
    summary: `Proof pointer recorded for ${item.title}.`,
    source_state: valueState,
    checked_at: valueCheckedAt,
    authority: { kind: "recorded", label: "admin proof pointer" },
    provenance,
    confidence,
    sensitivity,
    validity: { valid_from: context.observed_at, valid_until: null },
    retrieval_policy: {
      mode: "inspect",
      refresh_href: null,
      explanation:
        "Inspect the proof pointer without treating it as a verified outcome.",
    },
    destination: inspectorDestination("inspect proof"),
  });

  const sourceTime = buildSourceTimeReference(item, context, provenance);
  const deadline =
    item.action_kind === "deadline"
      ? buildDeadlineReference(item, context, provenance)
      : null;

  return {
    entity,
    action,
    route,
    source,
    owner,
    proof,
    source_time: sourceTime,
    deadline,
  };
}

function buildSourceTimeReference(
  item: AdminInboxItemFields,
  context: InboxReferenceContext,
  provenance: SemanticReference<"source">["provenance"],
): SemanticReference<"source_time"> {
  if (
    context.observed_at &&
    (context.time_state === "verified" || context.time_state === "stale")
  ) {
    return defineKnownReference({
      id: semanticReferenceId(item.id, "source-time"),
      kind: "source_time",
      label: "source time",
      value: context.observed_at,
      summary: "The source projection recorded this observation time.",
      source_state: context.time_state,
      checked_at: context.checked_at,
      authority: { kind: "recorded", label: "source projection" },
      provenance,
      confidence: {
        level: context.time_state === "verified" ? "high" : "medium",
        explanation:
          context.time_state === "verified"
            ? "The current projection supplied this timestamp."
            : "The timestamp is retained beyond its freshness window.",
      },
      sensitivity: context.sensitivity ?? "internal",
      validity: { valid_from: context.observed_at, valid_until: null },
      retrieval_policy: {
        mode: "inspect",
        refresh_href: null,
        explanation: "Inspect observation and checked times.",
      },
      destination: inspectorDestination("inspect source time"),
    });
  }

  const missingState: "unchecked" | "absent" | "unknown" =
    context.time_state === "absent"
      ? "absent"
      : context.time_state === "unknown"
        ? "unknown"
        : "unchecked";
  return defineMissingReference({
    id: semanticReferenceId(item.id, "source-time"),
    kind: "source_time",
    label: "source time",
    value: null,
    summary:
      missingState === "unchecked"
        ? "The provider or source has not been checked for a timestamp."
        : missingState === "absent"
          ? "The source was checked and returned no timestamp."
          : "The current projection cannot determine whether a timestamp exists.",
    source_state: missingState,
    checked_at: missingState === "unchecked" ? null : context.checked_at,
    authority: { kind: "none", label: "timestamp authority unavailable" },
    provenance,
    confidence: {
      level: "unknown",
      explanation: "No authoritative timestamp is available.",
    },
    sensitivity: context.sensitivity ?? "internal",
    validity: { valid_from: null, valid_until: null },
    retrieval_policy: {
      mode: "refresh_then_inspect",
      refresh_href: `/?item=${encodeURIComponent(item.id)}`,
      explanation: "Refresh the source projection or inspect provenance.",
    },
    destination: inspectorDestination("inspect source time"),
  });
}

function buildDeadlineReference(
  item: AdminInboxItemFields,
  context: InboxReferenceContext,
  provenance: SemanticReference<"source">["provenance"],
): SemanticReference<"deadline"> {
  if (context.deadline_at) {
    const state: "verified" | "stale" =
      context.source_state === "verified" ? "verified" : "stale";
    return defineKnownReference({
      id: semanticReferenceId(item.id, "deadline"),
      kind: "deadline",
      label: "deadline",
      value: context.deadline_at,
      summary:
        "The admin projection records this deadline without a provider-authoritative event destination.",
      source_state: state,
      checked_at: context.checked_at,
      authority: { kind: "recorded", label: "admin deadline projection" },
      provenance,
      confidence: {
        level: state === "verified" ? "high" : "medium",
        explanation:
          state === "verified"
            ? "The current projection supplied the deadline."
            : "The recorded deadline is beyond its freshness window.",
      },
      sensitivity: context.sensitivity ?? "internal",
      validity: { valid_from: null, valid_until: context.deadline_at },
      retrieval_policy: {
        mode: "inspect",
        refresh_href: null,
        explanation:
          "Inspect provenance before treating this as a Calendar-authoritative event.",
      },
      destination: inspectorDestination("inspect deadline provenance"),
    });
  }

  const state = context.checked_at ? "absent" : "unchecked";
  return defineMissingReference({
    id: semanticReferenceId(item.id, "deadline"),
    kind: "deadline",
    label: "deadline",
    value: null,
    summary:
      state === "absent"
        ? "The projection was checked and contains no deadline value."
        : "The deadline provider has not been checked.",
    source_state: state,
    checked_at: state === "absent" ? context.checked_at : null,
    authority: { kind: "none", label: "deadline authority unavailable" },
    provenance,
    confidence: {
      level: "unknown",
      explanation: "No authoritative deadline is available.",
    },
    sensitivity: context.sensitivity ?? "internal",
    validity: { valid_from: null, valid_until: null },
    retrieval_policy: {
      mode: "refresh_then_inspect",
      refresh_href: `/?item=${encodeURIComponent(item.id)}`,
      explanation: "Refresh the source or inspect deadline provenance.",
    },
    destination: inspectorDestination("inspect deadline source"),
  });
}

function inboxReadSourceReference(input: {
  mode: "ready" | "partial";
  sourceMode: "d1" | "fixture" | "mixed";
  checkedAt: string;
  errors: string[];
}): SemanticReference<"source"> {
  const provenance = {
    source: "admin_inbox",
    source_ref: "admin-inbox:read-state",
    method:
      input.sourceMode === "d1"
        ? ("projection" as const)
        : ("fixture" as const),
    evidence_refs: [] as string[],
  };
  if (input.mode === "ready" && input.sourceMode === "d1") {
    return defineKnownReference({
      id: "admin-inbox:source",
      kind: "source",
      label: "source state",
      value: "current admin projection",
      summary: "All required root projection reads completed.",
      source_state: "verified",
      checked_at: input.checkedAt,
      authority: { kind: "internal", label: "admin read model" },
      provenance,
      confidence: {
        level: "high",
        explanation: "All required reads completed without fallback errors.",
      },
      sensitivity: "internal",
      validity: { valid_from: input.checkedAt, valid_until: null },
      retrieval_policy: {
        mode: "inspect",
        refresh_href: null,
        explanation: "Inspect source coverage and read time.",
      },
      destination: inspectorDestination("inspect source coverage"),
    });
  }

  const state = input.sourceMode === "fixture" ? "unchecked" : "unknown";
  return defineMissingReference({
    id: "admin-inbox:source",
    kind: "source",
    label: "source state",
    value: null,
    summary:
      state === "unchecked"
        ? "Current providers were not checked; tracked fixtures remain visible as stale values."
        : `${input.errors.length} required source read${input.errors.length === 1 ? "" : "s"} did not establish a complete current projection.`,
    source_state: state,
    checked_at: state === "unchecked" ? null : input.checkedAt,
    authority: { kind: "none", label: "complete source authority unavailable" },
    provenance,
    confidence: {
      level: "unknown",
      explanation: "The root read model is partial or fixture-backed.",
    },
    sensitivity: "internal",
    validity: { valid_from: null, valid_until: null },
    retrieval_policy: {
      mode: "refresh_then_inspect",
      refresh_href: "/",
      explanation: "Refresh the root projection or inspect source coverage.",
    },
    destination: inspectorDestination("inspect source coverage"),
  });
}

export function adminInboxDomainHref(
  item: Pick<AdminInboxItemFields, "category" | "entity_id">,
): string {
  const entity = encodeURIComponent(item.entity_id);
  switch (item.category) {
    case "work":
      return `/work?view=now&entity=${entity}`;
    case "content":
      return `/content?entity=${entity}`;
    case "life":
      return `/life?entity=${entity}`;
    case "fleet":
      return `/fleet?entity=${entity}`;
    case "system":
      return `/system?entity=${entity}`;
  }
}

function timeframeForProjection(
  item: Pick<AdminControlInboxItem, "status" | "urgency">,
): AdminInboxTimeframe {
  const status = item.status.toLowerCase();
  if (
    status.includes("blocked") ||
    status.includes("gated") ||
    status.includes("waiting")
  ) {
    return "waiting / gated";
  }
  if (item.urgency === "urgent" || item.urgency === "high") return "now";
  if (item.urgency === "low") return "this week";
  return "today";
}

function riskForUrgency(urgency: string): RiskLevel {
  if (urgency === "urgent" || urgency === "high") return "high";
  if (urgency === "low") return "low";
  return "medium";
}

function nextActionForProjection(item: AdminControlInboxItem): string {
  switch (item.action_kind) {
    case "approve":
      return `review the source and approve ${item.title}`;
    case "decide":
      return `choose the next action for ${item.title}`;
    case "verify":
      return `verify ${item.title}`;
    case "deadline":
      return `review the deadline for ${item.title}`;
    case "review":
      return `review ${item.title}`;
    default:
      return `open ${item.title}`;
  }
}

function normalizeStatus(status: string): string {
  return status
    .replaceAll("needs_ani", "review_required")
    .replaceAll("needs ani", "action required")
    .replaceAll("_", " ");
}

export function rankInboxItems(items: AdminInboxItem[]): AdminInboxItem[] {
  const unique = new Map<string, AdminInboxItem>();
  for (const item of items) {
    const requiredAction = `${item.entity_id}:${item.action_kind}`;
    const existing = unique.get(requiredAction);
    if (!existing || item.updated_at > existing.updated_at) {
      unique.set(requiredAction, item);
    }
  }
  return [...unique.values()].sort(
    (a, b) =>
      score(b) - score(a) ||
      b.updated_at.localeCompare(a.updated_at) ||
      a.id.localeCompare(b.id),
  );
}

function score(item: AdminInboxItem): number {
  const risk = item.risk === "high" ? 30 : item.risk === "medium" ? 20 : 10;
  const action = ["approve", "decide", "verify"].includes(item.action_kind)
    ? 5
    : 0;
  const timeframe =
    item.timeframe === "now" ? 4 : item.timeframe === "today" ? 2 : 0;
  return risk + action + timeframe;
}

function entityIdFor(dedupeKey: string): string {
  return `entity-${dedupeKey
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}
