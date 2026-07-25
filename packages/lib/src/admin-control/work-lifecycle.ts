export const WORK_LIFECYCLE_SCHEMA_VERSION = 1;
export const MAX_ARCHIVE_BATCH_SIZE = 20;

export type WorkSourceSurface =
  | "chatgpt_export"
  | "codex"
  | "github"
  | "apple_notes"
  | "admin"
  | "handoff";

export type WorkReconciliationState =
  | "fresh"
  | "stale"
  | "partial"
  | "unavailable"
  | "conflicting";

export type WorkImportState = "created" | "updated" | "duplicate" | "failed";

export type WorkNativeRuntime =
  | "running"
  | "idle"
  | "blocked"
  | "closed"
  | "unknown";

export type WorkEntityLifecycle = "open" | "completed" | "archived";
export type WorkAttentionStatus = "current" | "cleared" | "archived";

export interface WorkSourceRecord {
  source_id: string;
  surface: WorkSourceSurface;
  provider: string;
  account_scope: string;
  native_id: string;
  host: string | null;
  locator: string;
  title: string;
  summary: string;
  project: string | null;
  cwd: string | null;
  native_status: string;
  native_runtime: WorkNativeRuntime;
  goal: string | null;
  content_hash: string;
  imported_at: string;
  reconciled_at: string;
  reconciliation_state: WorkReconciliationState;
  import_state: WorkImportState;
  lineage_refs: string[];
  proof_refs: string[];
  privacy: "sanitized";
}

export interface WorkEntity {
  entity_id: string;
  kind: "project" | "task" | "decision" | "reference";
  title: string;
  summary: string;
  lifecycle: WorkEntityLifecycle;
  owner: string;
  owner_state: "current" | "stale" | "unknown";
  contradiction_refs: string[];
  source_ids: string[];
  outcome_ids: string[];
  attention_ids: string[];
  updated_at: string;
  archived_at: string | null;
}

export interface WorkOutcome {
  outcome_id: string;
  entity_id: string;
  status: "completed" | "cancelled";
  summary: string;
  proof_refs: string[];
  recorded_at: string;
}

export interface WorkAttentionItem {
  attention_id: string;
  entity_id: string;
  attention_kind: string;
  status: WorkAttentionStatus;
  reason: string;
  owner: string;
  source_ids: string[];
  updated_at: string;
}

export interface WorkHistoryEntry {
  history_id: string;
  entity_id: string;
  kind: "linked" | "promoted" | "completed" | "archived" | "restored";
  summary: string;
  source_ids: string[];
  proof_refs: string[];
  receipt_id: string | null;
  recorded_at: string;
}

export interface WorkArchiveCandidate {
  entity_id: string;
  confidence: "high" | "medium" | "low";
  eligible: boolean;
  selected_by_default: boolean;
  reasons: string[];
  candidate_hash: string;
}

export interface WorkArchiveProposal {
  proposal_id: string;
  entity_ids: string[];
  candidate_hash: string;
  reason: string;
  status: "proposed" | "confirmed" | "cancelled";
  proposed_by: string;
  proposed_at: string;
  confirmed_at: string | null;
}

export interface WorkArchiveConfirmation {
  proposal_id: string;
  entity_ids: string[];
  candidate_hash: string;
  actor: string;
  confirmed_at: string;
}

export interface WorkLifecycleStateReceipt {
  entity_id: string;
  lifecycle: WorkEntityLifecycle;
  archived_at: string | null;
}

export interface WorkAttentionStateReceipt {
  attention_id: string;
  status: WorkAttentionStatus;
}

export interface WorkLifecycleReceipt {
  receipt_id: string;
  action: "archive" | "restore";
  proposal_id: string;
  entity_ids: string[];
  actor: string;
  recorded_at: string;
  lifecycle_before: WorkLifecycleStateReceipt[];
  lifecycle_after: WorkLifecycleStateReceipt[];
  attention_before: WorkAttentionStateReceipt[];
  attention_after: WorkAttentionStateReceipt[];
  proof_refs: string[];
  restoration_of_receipt_id: string | null;
}

export interface WorkLifecycleSnapshot {
  schema_version: number;
  generated_at: string;
  source_mode: "fixture" | "adapter";
  adapter_version: string;
  sources: WorkSourceRecord[];
  entities: WorkEntity[];
  outcomes: WorkOutcome[];
  attention: WorkAttentionItem[];
  history: WorkHistoryEntry[];
  proposals: WorkArchiveProposal[];
  receipts: WorkLifecycleReceipt[];
  errors: string[];
}

export interface WorkLifecycleAdapter {
  version: string;
  readSnapshot(): Promise<WorkLifecycleSnapshot>;
}

export interface WorkSourceImport {
  surface: WorkSourceSurface;
  provider: string;
  account_scope: string;
  native_id: string;
  host: string | null;
  locator: string;
  title: string;
  summary: string;
  project: string | null;
  cwd: string | null;
  native_status: string;
  native_runtime: WorkNativeRuntime;
  goal: string | null;
  content_hash: string;
  imported_at: string;
  reconciled_at: string;
  reconciliation_state: WorkReconciliationState;
  lineage_refs: string[];
  proof_refs: string[];
}

export interface PromoteWorkEntityInput {
  entity_id: string;
  kind: WorkEntity["kind"];
  title: string;
  summary: string;
  owner: string;
  source_ids: string[];
  actor: string;
  recorded_at: string;
}

export interface WorkSearchResult {
  entity_id: string;
  title: string;
  summary: string;
  lifecycle: WorkEntityLifecycle;
  owner: string;
  surfaces: WorkSourceSurface[];
  source_count: number;
  reconciliation_states: WorkReconciliationState[];
  import_states: WorkImportState[];
  source_locators: string[];
  lineage_refs: string[];
  proof_refs: string[];
  outcome_summaries: string[];
  history_summaries: string[];
  receipt_ids: string[];
  updated_at: string;
  score: number;
}

const FORBIDDEN_KEYS = new Set([
  "transcript",
  "transcripts",
  "message",
  "messages",
  "message_body",
  "message_id",
  "recipients",
  "recipient",
  "attachments",
  "attachment",
  "provider_payload",
  "payload",
  "health_data",
  "credentials",
  "credential",
  "secret",
]);

const MAX_TEXT_LENGTH = 800;

export async function loadWorkLifecycleSnapshot(
  adapter: WorkLifecycleAdapter | null | undefined,
  fixture: WorkLifecycleSnapshot,
): Promise<WorkLifecycleSnapshot> {
  if (!adapter) {
    assertValidWorkLifecycle(fixture);
    return cloneSnapshot(fixture);
  }
  try {
    const snapshot = await adapter.readSnapshot();
    assertValidWorkLifecycle(snapshot);
    return {
      ...cloneSnapshot(snapshot),
      source_mode: "adapter",
      adapter_version: adapter.version,
    };
  } catch {
    return emptyWorkLifecycleSnapshot(
      adapter.version,
      "lifecycle adapter read failed",
    );
  }
}

export function emptyWorkLifecycleSnapshot(
  adapterVersion = "unavailable",
  error?: string,
): WorkLifecycleSnapshot {
  return {
    schema_version: WORK_LIFECYCLE_SCHEMA_VERSION,
    generated_at: new Date(0).toISOString(),
    source_mode: "adapter",
    adapter_version: adapterVersion,
    sources: [],
    entities: [],
    outcomes: [],
    attention: [],
    history: [],
    proposals: [],
    receipts: [],
    errors: error ? [error] : [],
  };
}

export function sourceIdentityKey(
  source: Pick<
    WorkSourceRecord | WorkSourceImport,
    "provider" | "account_scope" | "native_id" | "host"
  >,
): string {
  return [
    source.provider,
    source.account_scope,
    source.native_id,
    source.host ?? "-",
  ]
    .map((part) => encodeURIComponent(part.trim().toLowerCase()))
    .join(":");
}

export function upsertSourceImport(
  snapshot: WorkLifecycleSnapshot,
  input: WorkSourceImport,
): { snapshot: WorkLifecycleSnapshot; source: WorkSourceRecord } {
  const identity = sourceIdentityKey(input);
  const existing = snapshot.sources.find(
    (source) => sourceIdentityKey(source) === identity,
  );
  const next = cloneSnapshot(snapshot);

  if (existing) {
    const source: WorkSourceRecord = {
      ...existing,
      ...input,
      source_id: existing.source_id,
      import_state:
        existing.content_hash === input.content_hash ? "duplicate" : "updated",
      privacy: "sanitized",
    };
    next.sources = next.sources.map((candidate) =>
      candidate.source_id === existing.source_id ? source : candidate,
    );
    assertValidWorkLifecycle(next);
    return { snapshot: next, source };
  }

  const source: WorkSourceRecord = {
    ...input,
    source_id: stableId("source", identity),
    import_state: "created",
    privacy: "sanitized",
  };
  next.sources.push(source);
  assertValidWorkLifecycle(next);
  return { snapshot: next, source };
}

export function assertValidWorkLifecycle(
  snapshot: WorkLifecycleSnapshot,
): void {
  walkSanitized(snapshot, "snapshot");

  const sourceIds = new Set<string>();
  const sourceIdentities = new Set<string>();
  for (const source of snapshot.sources) {
    if (source.privacy !== "sanitized") {
      throw new Error(`${source.source_id} must be sanitized`);
    }
    if (sourceIds.has(source.source_id)) {
      throw new Error(`duplicate source id ${source.source_id}`);
    }
    const identity = sourceIdentityKey(source);
    if (sourceIdentities.has(identity)) {
      throw new Error(`duplicate source identity ${identity}`);
    }
    sourceIds.add(source.source_id);
    sourceIdentities.add(identity);
  }

  const entityIds = new Set(
    snapshot.entities.map((entity) => entity.entity_id),
  );
  const sourceOwners = new Map<string, string>();
  for (const entity of snapshot.entities) {
    for (const sourceId of entity.source_ids) {
      if (!sourceIds.has(sourceId)) {
        throw new Error(
          `${entity.entity_id} references unknown source ${sourceId}`,
        );
      }
      const owner = sourceOwners.get(sourceId);
      if (owner && owner !== entity.entity_id) {
        throw new Error(`${sourceId} links to more than one entity`);
      }
      sourceOwners.set(sourceId, entity.entity_id);
    }

    if (entity.lifecycle === "completed") {
      const completedProof = snapshot.outcomes.some(
        (outcome) =>
          outcome.entity_id === entity.entity_id &&
          outcome.status === "completed" &&
          outcome.proof_refs.length > 0,
      );
      if (!completedProof) {
        throw new Error(
          `${entity.entity_id} is completed without outcome proof`,
        );
      }
    }
    if (
      entity.lifecycle === "archived" &&
      !snapshot.receipts.some(
        (receipt) =>
          receipt.action === "archive" &&
          receipt.entity_ids.includes(entity.entity_id),
      )
    ) {
      throw new Error(`${entity.entity_id} is archived without a receipt`);
    }
  }

  const attentionKeys = new Set<string>();
  for (const item of snapshot.attention) {
    if (!entityIds.has(item.entity_id)) {
      throw new Error(`${item.attention_id} references unknown entity`);
    }
    for (const sourceId of item.source_ids) {
      if (!sourceIds.has(sourceId)) {
        throw new Error(
          `${item.attention_id} references unknown source ${sourceId}`,
        );
      }
    }
    if (item.status === "current") {
      const key = `${item.entity_id}:${item.attention_kind}`;
      if (attentionKeys.has(key)) {
        throw new Error(`duplicate unresolved attention ${key}`);
      }
      attentionKeys.add(key);
    }
  }
}

export function linkSourceToEntity(
  snapshot: WorkLifecycleSnapshot,
  sourceId: string,
  entityId: string,
  actor: string,
  recordedAt: string,
): WorkLifecycleSnapshot {
  requireSource(snapshot, sourceId);
  const currentOwner = snapshot.entities.find((entity) =>
    entity.source_ids.includes(sourceId),
  );
  if (currentOwner && currentOwner.entity_id !== entityId) {
    throw new Error(`${sourceId} already links to ${currentOwner.entity_id}`);
  }
  const entity = requireEntity(snapshot, entityId);
  if (entity.source_ids.includes(sourceId)) return cloneSnapshot(snapshot);

  const next = cloneSnapshot(snapshot);
  next.entities = next.entities.map((candidate) =>
    candidate.entity_id === entityId
      ? {
          ...candidate,
          source_ids: [...candidate.source_ids, sourceId],
          updated_at: recordedAt,
        }
      : candidate,
  );
  next.history.push({
    history_id: stableId("history", entityId, sourceId, recordedAt),
    entity_id: entityId,
    kind: "linked",
    summary: `linked sanitized source by ${actor}`,
    source_ids: [sourceId],
    proof_refs: [],
    receipt_id: null,
    recorded_at: recordedAt,
  });
  assertValidWorkLifecycle(next);
  return next;
}

export function promoteSourcesToEntity(
  snapshot: WorkLifecycleSnapshot,
  input: PromoteWorkEntityInput,
): WorkLifecycleSnapshot {
  if (
    snapshot.entities.some((entity) => entity.entity_id === input.entity_id)
  ) {
    throw new Error(`entity already exists: ${input.entity_id}`);
  }
  const sourceIds = [...new Set(input.source_ids)];
  if (sourceIds.length === 0) throw new Error("promotion requires a source");
  for (const sourceId of sourceIds) {
    requireSource(snapshot, sourceId);
    const owner = snapshot.entities.find((entity) =>
      entity.source_ids.includes(sourceId),
    );
    if (owner)
      throw new Error(`${sourceId} already links to ${owner.entity_id}`);
  }

  const next = cloneSnapshot(snapshot);
  next.entities.push({
    entity_id: input.entity_id,
    kind: input.kind,
    title: input.title,
    summary: input.summary,
    lifecycle: "open",
    owner: input.owner,
    owner_state: "current",
    contradiction_refs: [],
    source_ids: sourceIds,
    outcome_ids: [],
    attention_ids: [],
    updated_at: input.recorded_at,
    archived_at: null,
  });
  next.history.push({
    history_id: stableId(
      "history",
      input.entity_id,
      "promoted",
      input.recorded_at,
    ),
    entity_id: input.entity_id,
    kind: "promoted",
    summary: `promoted ${sourceIds.length} sanitized source${sourceIds.length === 1 ? "" : "s"} by ${input.actor}`,
    source_ids: sourceIds,
    proof_refs: [],
    receipt_id: null,
    recorded_at: input.recorded_at,
  });
  assertValidWorkLifecycle(next);
  return next;
}

export function completeWorkEntity(
  snapshot: WorkLifecycleSnapshot,
  entityId: string,
  outcome: Omit<WorkOutcome, "entity_id" | "status">,
  actor: string,
): WorkLifecycleSnapshot {
  const entity = requireEntity(snapshot, entityId);
  if (entity.lifecycle !== "open") {
    throw new Error("only open entities can be completed");
  }
  if (outcome.proof_refs.length === 0) {
    throw new Error("completion requires outcome proof");
  }
  const next = cloneSnapshot(snapshot);
  const completed: WorkOutcome = {
    ...outcome,
    entity_id: entityId,
    status: "completed",
  };
  next.outcomes.push(completed);
  next.entities = next.entities.map((candidate) =>
    candidate.entity_id === entityId
      ? {
          ...candidate,
          lifecycle: "completed",
          outcome_ids: [...candidate.outcome_ids, outcome.outcome_id],
          updated_at: outcome.recorded_at,
        }
      : candidate,
  );
  next.attention = next.attention.map((item) =>
    item.entity_id === entityId && item.status === "current"
      ? { ...item, status: "cleared", updated_at: outcome.recorded_at }
      : item,
  );
  next.history.push({
    history_id: stableId("history", entityId, "completed", outcome.recorded_at),
    entity_id: entityId,
    kind: "completed",
    summary: `completion recorded by ${actor}`,
    source_ids: entity.source_ids,
    proof_refs: outcome.proof_refs,
    receipt_id: null,
    recorded_at: outcome.recorded_at,
  });
  assertValidWorkLifecycle(next);
  return next;
}

export function evaluateArchiveCandidate(
  snapshot: WorkLifecycleSnapshot,
  entityId: string,
): WorkArchiveCandidate {
  assertValidWorkLifecycle(snapshot);
  const entity = requireEntity(snapshot, entityId);
  const sources = sourcesForEntity(snapshot, entity);
  const completedOutcome = snapshot.outcomes.find(
    (outcome) =>
      outcome.entity_id === entityId &&
      outcome.status === "completed" &&
      outcome.proof_refs.length > 0,
  );
  const unresolvedAttention = snapshot.attention.filter(
    (item) => item.entity_id === entityId && item.status === "current",
  );
  const activeRuntime = sources.filter(
    (source) => source.native_runtime === "running",
  );
  const nonFresh = sources.filter(
    (source) => source.reconciliation_state !== "fresh",
  );
  const conflicting = sources.filter(
    (source) => source.reconciliation_state === "conflicting",
  );
  const reasons: string[] = [];

  if (entity.lifecycle !== "completed")
    reasons.push("lifecycle is not completed");
  if (!completedOutcome) reasons.push("completed outcome proof is missing");
  if (sources.length === 0) reasons.push("source reconciliation is missing");
  if (unresolvedAttention.length > 0)
    reasons.push("unresolved attention remains");
  if (activeRuntime.length > 0) reasons.push("native runtime is active");
  if (entity.owner_state !== "current")
    reasons.push("current owner is unverified");
  if (nonFresh.length > 0) reasons.push("reconciliation is not fresh");
  if (entity.contradiction_refs.length > 0 || conflicting.length > 0) {
    reasons.push("source contradiction is unresolved");
  }

  const low =
    entity.lifecycle !== "completed" ||
    !completedOutcome ||
    entity.contradiction_refs.length > 0 ||
    conflicting.length > 0;
  const confidence = low ? "low" : reasons.length === 0 ? "high" : "medium";
  return {
    entity_id: entityId,
    confidence,
    eligible: confidence === "high",
    selected_by_default: confidence === "high",
    reasons: reasons.length === 0 ? ["all archive checks passed"] : reasons,
    candidate_hash: archiveCandidateHash(snapshot, entityId),
  };
}

export function createArchiveProposalBatches(
  snapshot: WorkLifecycleSnapshot,
  entityIds: string[],
  reason: string,
  proposedBy: string,
  proposedAt: string,
): WorkArchiveProposal[] {
  const candidates = [...new Set(entityIds)].sort();
  if (candidates.length === 0) {
    throw new Error("archive proposal requires at least one entity");
  }
  for (const entityId of candidates) {
    const candidate = evaluateArchiveCandidate(snapshot, entityId);
    if (!candidate.eligible) {
      throw new Error(`${entityId} is not a high-confidence archive candidate`);
    }
  }

  const proposals: WorkArchiveProposal[] = [];
  for (
    let index = 0;
    index < candidates.length;
    index += MAX_ARCHIVE_BATCH_SIZE
  ) {
    const batch = candidates.slice(index, index + MAX_ARCHIVE_BATCH_SIZE);
    proposals.push({
      proposal_id: stableId(
        "archive",
        proposedAt,
        String(index / MAX_ARCHIVE_BATCH_SIZE + 1),
        batch.join("+"),
      ),
      entity_ids: batch,
      candidate_hash: archiveBatchHash(snapshot, batch),
      reason: reason.trim() || "review completed work for archive",
      status: "proposed",
      proposed_by: proposedBy,
      proposed_at: proposedAt,
      confirmed_at: null,
    });
  }
  return proposals;
}

export function confirmArchiveProposal(
  snapshot: WorkLifecycleSnapshot,
  proposal: WorkArchiveProposal,
  confirmation: WorkArchiveConfirmation,
): { snapshot: WorkLifecycleSnapshot; receipt: WorkLifecycleReceipt } {
  if (proposal.status !== "proposed") {
    throw new Error("only a proposed archive batch can be confirmed");
  }
  if (
    confirmation.proposal_id !== proposal.proposal_id ||
    confirmation.candidate_hash !== proposal.candidate_hash ||
    !sameStrings(confirmation.entity_ids, proposal.entity_ids) ||
    !confirmation.actor.trim() ||
    !confirmation.confirmed_at.trim()
  ) {
    throw new Error("archive confirmation does not match the proposal binding");
  }
  const currentHash = archiveBatchHash(snapshot, proposal.entity_ids);
  if (currentHash !== proposal.candidate_hash) {
    throw new Error("archive candidate changed after proposal creation");
  }
  for (const entityId of proposal.entity_ids) {
    if (!evaluateArchiveCandidate(snapshot, entityId).eligible) {
      throw new Error(`${entityId} is no longer eligible for archive`);
    }
  }

  const selected = new Set(proposal.entity_ids);
  const lifecycleBefore = selectedEntityStates(snapshot, selected);
  const attentionBefore = selectedAttentionStates(snapshot, selected);
  const next = cloneSnapshot(snapshot);
  next.entities = next.entities.map((entity) =>
    selected.has(entity.entity_id)
      ? {
          ...entity,
          lifecycle: "archived",
          archived_at: confirmation.confirmed_at,
          updated_at: confirmation.confirmed_at,
        }
      : entity,
  );
  next.attention = next.attention.map((item) =>
    selected.has(item.entity_id) && item.status === "current"
      ? { ...item, status: "archived", updated_at: confirmation.confirmed_at }
      : item,
  );
  next.proposals = [
    ...next.proposals.filter(
      (candidate) => candidate.proposal_id !== proposal.proposal_id,
    ),
    {
      ...proposal,
      status: "confirmed",
      confirmed_at: confirmation.confirmed_at,
    },
  ];

  const receiptId = stableId(
    "receipt",
    proposal.proposal_id,
    "archive",
    confirmation.confirmed_at,
  );
  const proofRefs = [
    `admin-projection://${proposal.proposal_id}`,
    ...proposal.entity_ids.flatMap((entityId) =>
      snapshot.outcomes
        .filter(
          (outcome) =>
            outcome.entity_id === entityId && outcome.status === "completed",
        )
        .flatMap((outcome) => outcome.proof_refs),
    ),
  ];
  const receipt: WorkLifecycleReceipt = {
    receipt_id: receiptId,
    action: "archive",
    proposal_id: proposal.proposal_id,
    entity_ids: [...proposal.entity_ids],
    actor: confirmation.actor,
    recorded_at: confirmation.confirmed_at,
    lifecycle_before: lifecycleBefore,
    lifecycle_after: selectedEntityStates(next, selected),
    attention_before: attentionBefore,
    attention_after: selectedAttentionStates(next, selected),
    proof_refs: [...new Set(proofRefs)],
    restoration_of_receipt_id: null,
  };
  next.receipts.push(receipt);
  for (const entityId of proposal.entity_ids) {
    next.history.push({
      history_id: stableId("history", entityId, "archived", receiptId),
      entity_id: entityId,
      kind: "archived",
      summary: `admin projection archive confirmed by ${confirmation.actor}`,
      source_ids: requireEntity(snapshot, entityId).source_ids,
      proof_refs: receipt.proof_refs,
      receipt_id: receiptId,
      recorded_at: confirmation.confirmed_at,
    });
  }
  assertValidWorkLifecycle(next);
  return { snapshot: next, receipt };
}

export function restoreArchiveReceipt(
  snapshot: WorkLifecycleSnapshot,
  archiveReceipt: WorkLifecycleReceipt,
  actor: string,
  recordedAt: string,
): { snapshot: WorkLifecycleSnapshot; receipt: WorkLifecycleReceipt } {
  assertValidWorkLifecycle(snapshot);
  if (archiveReceipt.action !== "archive") {
    throw new Error("restore requires an archive receipt");
  }
  const storedArchiveReceipt = snapshot.receipts.find(
    (receipt) => receipt.receipt_id === archiveReceipt.receipt_id,
  );
  if (
    !storedArchiveReceipt ||
    JSON.stringify(storedArchiveReceipt) !== JSON.stringify(archiveReceipt)
  ) {
    throw new Error("restore requires the exact stored archive receipt");
  }
  const selected = new Set(archiveReceipt.entity_ids);
  for (const entityId of selected) {
    if (requireEntity(snapshot, entityId).lifecycle !== "archived") {
      throw new Error(`${entityId} is not archived`);
    }
  }
  const originalLifecycle = new Map(
    archiveReceipt.lifecycle_before.map((state) => [state.entity_id, state]),
  );
  if (
    [...originalLifecycle.values()].some(
      (state) => state.lifecycle !== "open" && state.lifecycle !== "completed",
    )
  ) {
    throw new Error("archive receipt has an invalid restoration lifecycle");
  }
  const originalAttention = new Map(
    archiveReceipt.attention_before.map((state) => [state.attention_id, state]),
  );
  const lifecycleBefore = selectedEntityStates(snapshot, selected);
  const attentionBefore = selectedAttentionStates(snapshot, selected);
  const next = cloneSnapshot(snapshot);
  next.entities = next.entities.map((entity) => {
    const previous = originalLifecycle.get(entity.entity_id);
    return previous
      ? {
          ...entity,
          lifecycle: previous.lifecycle,
          archived_at: previous.archived_at,
          updated_at: recordedAt,
        }
      : entity;
  });
  next.attention = next.attention.map((item) => {
    const previous = originalAttention.get(item.attention_id);
    return previous
      ? { ...item, status: previous.status, updated_at: recordedAt }
      : item;
  });

  const receiptId = stableId(
    "receipt",
    archiveReceipt.receipt_id,
    "restore",
    recordedAt,
  );
  const receipt: WorkLifecycleReceipt = {
    receipt_id: receiptId,
    action: "restore",
    proposal_id: archiveReceipt.proposal_id,
    entity_ids: [...archiveReceipt.entity_ids],
    actor,
    recorded_at: recordedAt,
    lifecycle_before: lifecycleBefore,
    lifecycle_after: selectedEntityStates(next, selected),
    attention_before: attentionBefore,
    attention_after: selectedAttentionStates(next, selected),
    proof_refs: [
      `admin-projection://${archiveReceipt.proposal_id}/restore`,
      archiveReceipt.receipt_id,
      ...archiveReceipt.proof_refs,
    ],
    restoration_of_receipt_id: archiveReceipt.receipt_id,
  };
  next.receipts.push(receipt);
  for (const entityId of archiveReceipt.entity_ids) {
    next.history.push({
      history_id: stableId("history", entityId, "restored", receiptId),
      entity_id: entityId,
      kind: "restored",
      summary: `admin projection archive restored by ${actor}`,
      source_ids: requireEntity(snapshot, entityId).source_ids,
      proof_refs: receipt.proof_refs,
      receipt_id: receiptId,
      recorded_at: recordedAt,
    });
  }
  assertValidWorkLifecycle(next);
  return { snapshot: next, receipt };
}

export function searchWorkLifecycle(
  snapshot: WorkLifecycleSnapshot,
  query: string,
  limit = 20,
): WorkSearchResult[] {
  assertValidWorkLifecycle(snapshot);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("search limit must be between 1 and 100");
  }
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return snapshot.entities
    .map((entity) => buildSearchResult(snapshot, entity, terms))
    .filter((result) => terms.length === 0 || result.score > 0)
    .sort(
      (a, b) => b.score - a.score || b.updated_at.localeCompare(a.updated_at),
    )
    .slice(0, limit);
}

export function archiveBatchHash(
  snapshot: WorkLifecycleSnapshot,
  entityIds: string[],
): string {
  const canonical = [...new Set(entityIds)]
    .sort()
    .map((entityId) => archiveCandidateHash(snapshot, entityId));
  return hashText(JSON.stringify(canonical));
}

function archiveCandidateHash(
  snapshot: WorkLifecycleSnapshot,
  entityId: string,
): string {
  const entity = requireEntity(snapshot, entityId);
  const sources = sourcesForEntity(snapshot, entity)
    .map((source) => ({
      identity: sourceIdentityKey(source),
      content_hash: source.content_hash,
      reconciliation_state: source.reconciliation_state,
      native_runtime: source.native_runtime,
    }))
    .sort((a, b) => a.identity.localeCompare(b.identity));
  const outcomes = snapshot.outcomes
    .filter((outcome) => outcome.entity_id === entityId)
    .map((outcome) => ({
      outcome_id: outcome.outcome_id,
      status: outcome.status,
      proof_refs: [...outcome.proof_refs].sort(),
    }))
    .sort((a, b) => a.outcome_id.localeCompare(b.outcome_id));
  const attention = snapshot.attention
    .filter((item) => item.entity_id === entityId && item.status === "current")
    .map((item) => `${item.attention_kind}:${item.attention_id}`)
    .sort();
  return hashText(
    JSON.stringify({
      entity_id: entity.entity_id,
      lifecycle: entity.lifecycle,
      owner: entity.owner,
      owner_state: entity.owner_state,
      contradiction_refs: [...entity.contradiction_refs].sort(),
      sources,
      outcomes,
      attention,
    }),
  );
}

function buildSearchResult(
  snapshot: WorkLifecycleSnapshot,
  entity: WorkEntity,
  terms: string[],
): WorkSearchResult {
  const sources = sourcesForEntity(snapshot, entity);
  const outcomes = snapshot.outcomes.filter(
    (outcome) => outcome.entity_id === entity.entity_id,
  );
  const history = snapshot.history.filter(
    (entry) => entry.entity_id === entity.entity_id,
  );
  const receipts = snapshot.receipts.filter((receipt) =>
    receipt.entity_ids.includes(entity.entity_id),
  );
  const titleText = entity.title.toLowerCase();
  const summaryText = entity.summary.toLowerCase();
  const sourceText = sources
    .flatMap((source) => [
      source.surface,
      source.provider,
      source.account_scope,
      source.title,
      source.summary,
      source.project ?? "",
      source.cwd ?? "",
      source.host ?? "",
      source.native_status,
      source.goal ?? "",
      ...source.lineage_refs,
      ...source.proof_refs,
    ])
    .join(" ")
    .toLowerCase();
  const outcomeText = outcomes
    .map((outcome) => outcome.summary)
    .join(" ")
    .toLowerCase();
  const historyText = history
    .map((entry) => entry.summary)
    .join(" ")
    .toLowerCase();
  const receiptText = receipts
    .flatMap((receipt) => [receipt.receipt_id, ...receipt.proof_refs])
    .join(" ")
    .toLowerCase();
  const score = terms.reduce((total, term) => {
    if (titleText.includes(term)) return total + 8;
    if (summaryText.includes(term)) return total + 5;
    if (sourceText.includes(term)) return total + 3;
    if (
      outcomeText.includes(term) ||
      historyText.includes(term) ||
      receiptText.includes(term)
    ) {
      return total + 2;
    }
    return total;
  }, 0);

  return {
    entity_id: entity.entity_id,
    title: entity.title,
    summary: entity.summary,
    lifecycle: entity.lifecycle,
    owner: entity.owner,
    surfaces: [...new Set(sources.map((source) => source.surface))],
    source_count: sources.length,
    reconciliation_states: [
      ...new Set(sources.map((source) => source.reconciliation_state)),
    ],
    import_states: [...new Set(sources.map((source) => source.import_state))],
    source_locators: sources.map((source) => source.locator),
    lineage_refs: [
      ...new Set(sources.flatMap((source) => source.lineage_refs)),
    ],
    proof_refs: [
      ...new Set([
        ...sources.flatMap((source) => source.proof_refs),
        ...outcomes.flatMap((outcome) => outcome.proof_refs),
        ...history.flatMap((entry) => entry.proof_refs),
        ...receipts.flatMap((receipt) => receipt.proof_refs),
      ]),
    ],
    outcome_summaries: outcomes.map((outcome) => outcome.summary),
    history_summaries: history.map((entry) => entry.summary),
    receipt_ids: receipts.map((receipt) => receipt.receipt_id),
    updated_at: entity.updated_at,
    score,
  };
}

function requireSource(
  snapshot: WorkLifecycleSnapshot,
  sourceId: string,
): WorkSourceRecord {
  const source = snapshot.sources.find(
    (candidate) => candidate.source_id === sourceId,
  );
  if (!source) throw new Error(`unknown source: ${sourceId}`);
  return source;
}

function requireEntity(
  snapshot: WorkLifecycleSnapshot,
  entityId: string,
): WorkEntity {
  const entity = snapshot.entities.find(
    (candidate) => candidate.entity_id === entityId,
  );
  if (!entity) throw new Error(`unknown entity: ${entityId}`);
  return entity;
}

function sourcesForEntity(
  snapshot: WorkLifecycleSnapshot,
  entity: WorkEntity,
): WorkSourceRecord[] {
  const sourceIds = new Set(entity.source_ids);
  return snapshot.sources.filter((source) => sourceIds.has(source.source_id));
}

function lifecycleState(entity: WorkEntity): WorkLifecycleStateReceipt {
  return {
    entity_id: entity.entity_id,
    lifecycle: entity.lifecycle,
    archived_at: entity.archived_at,
  };
}

function attentionState(
  attention: WorkAttentionItem,
): WorkAttentionStateReceipt {
  return {
    attention_id: attention.attention_id,
    status: attention.status,
  };
}

function selectedEntityStates(
  snapshot: WorkLifecycleSnapshot,
  selected: Set<string>,
): WorkLifecycleStateReceipt[] {
  return snapshot.entities
    .filter((entity) => selected.has(entity.entity_id))
    .map(lifecycleState);
}

function selectedAttentionStates(
  snapshot: WorkLifecycleSnapshot,
  selected: Set<string>,
): WorkAttentionStateReceipt[] {
  return snapshot.attention
    .filter((item) => selected.has(item.entity_id))
    .map(attentionState);
}

function cloneSnapshot(snapshot: WorkLifecycleSnapshot): WorkLifecycleSnapshot {
  return structuredClone(snapshot);
}

function stableId(prefix: string, ...parts: string[]): string {
  return `${prefix}-${parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

function hashText(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function sameStrings(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function walkSanitized(value: unknown, path: string): void {
  if (typeof value === "string") {
    if (value.length > MAX_TEXT_LENGTH) {
      throw new Error(`${path} exceeds sanitized text limit`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkSanitized(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) {
      throw new Error(
        `${path}.${key} is forbidden in sanitized lifecycle data`,
      );
    }
    walkSanitized(child, `${path}.${key}`);
  }
}
