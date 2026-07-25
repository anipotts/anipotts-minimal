import { describe, expect, it } from "vitest";
import {
  assertValidWorkLifecycle,
  completeWorkEntity,
  confirmArchiveProposal,
  createArchiveProposalBatches,
  emptyWorkLifecycleSnapshot,
  evaluateArchiveCandidate,
  fixtureWorkLifecycle,
  loadWorkLifecycleSnapshot,
  promoteSourcesToEntity,
  restoreArchiveReceipt,
  searchWorkLifecycle,
  sourceIdentityKey,
  upsertSourceImport,
  type WorkLifecycleSnapshot,
  type WorkSourceImport,
} from "./index";

const LATER = "2026-07-22T17:00:00.000Z";

describe("work lifecycle", () => {
  it("converges many conversations on one entity and one same-kind attention row", () => {
    assertValidWorkLifecycle(fixtureWorkLifecycle);

    const entity = fixtureWorkLifecycle.entities.find(
      (candidate) => candidate.entity_id === "entity-admin-home-lifecycle",
    );
    expect(entity?.source_ids).toEqual([
      "source-codex-admin-home",
      "source-chatgpt-lifecycle-export",
      "source-github-pr-244",
    ]);
    expect(
      fixtureWorkLifecycle.attention.filter(
        (item) =>
          item.entity_id === entity?.entity_id &&
          item.attention_kind === "review" &&
          item.status === "current",
      ),
    ).toHaveLength(1);
  });

  it("treats provider, account scope, native id, and host as immutable source identity", () => {
    const source = fixtureWorkLifecycle.sources[0]!;
    const identity = sourceIdentityKey(source);

    expect(identity).toContain("openai-codex");
    expect(identity).toContain("ani-personal");
    expect(identity).toContain("task-admin-home");
    expect(identity).toContain("ap-pro");
    expect(sourceIdentityKey({ ...source, host: "ap-mini" })).not.toBe(
      identity,
    );
  });

  it("updates a duplicate import in place without creating another entity", () => {
    const original = fixtureWorkLifecycle.sources.find(
      (source) => source.source_id === "source-chatgpt-lifecycle-export",
    )!;
    const input = sourceImport(original);
    const result = upsertSourceImport(fixtureWorkLifecycle, {
      ...input,
      imported_at: LATER,
      reconciled_at: LATER,
    });

    expect(result.source.source_id).toBe(original.source_id);
    expect(result.source.import_state).toBe("duplicate");
    expect(result.snapshot.sources).toHaveLength(
      fixtureWorkLifecycle.sources.length,
    );
    expect(
      result.snapshot.entities.filter((entity) =>
        entity.source_ids.includes(original.source_id),
      ),
    ).toHaveLength(1);
  });

  it("rejects a source linked to more than one entity", () => {
    const snapshot = structuredClone(fixtureWorkLifecycle);
    snapshot.entities[1]!.source_ids.push("source-codex-admin-home");

    expect(() => assertValidWorkLifecycle(snapshot)).toThrow(
      "links to more than one entity",
    );
  });

  it("rejects duplicate unresolved attention for one entity and kind", () => {
    const snapshot = structuredClone(fixtureWorkLifecycle);
    snapshot.attention.push({
      ...snapshot.attention[0]!,
      attention_id: "attention-admin-home-review-copy",
    });

    expect(() => assertValidWorkLifecycle(snapshot)).toThrow(
      "duplicate unresolved attention",
    );
  });

  it("promotes sources once and starts only in the open lifecycle", () => {
    const snapshot = structuredClone(fixtureWorkLifecycle);
    const detachedSource = snapshot.sources.pop()!;
    for (const entity of snapshot.entities) {
      entity.source_ids = entity.source_ids.filter(
        (sourceId) => sourceId !== detachedSource.source_id,
      );
    }
    snapshot.sources.push(detachedSource);

    const promoted = promoteSourcesToEntity(snapshot, {
      entity_id: "entity-promoted-source",
      kind: "reference",
      title: "promoted source",
      summary: "one sanitized source promoted into one entity.",
      owner: "chief/site",
      source_ids: [detachedSource.source_id],
      actor: "ani",
      recorded_at: LATER,
    });

    expect(promoted.entities.at(-1)?.lifecycle).toBe("open");
    expect(promoted.history.at(-1)?.kind).toBe("promoted");
  });

  it("completes an open entity only with outcome proof", () => {
    expect(() =>
      completeWorkEntity(
        fixtureWorkLifecycle,
        "entity-admin-home-lifecycle",
        {
          outcome_id: "outcome-admin-home-complete",
          summary: "local slice complete.",
          proof_refs: [],
          recorded_at: LATER,
        },
        "ani",
      ),
    ).toThrow("completion requires outcome proof");

    const completed = completeWorkEntity(
      fixtureWorkLifecycle,
      "entity-admin-home-lifecycle",
      {
        outcome_id: "outcome-admin-home-complete",
        summary: "local slice complete.",
        proof_refs: ["git:verified-commit"],
        recorded_at: LATER,
      },
      "ani",
    );
    expect(
      completed.entities.find(
        (entity) => entity.entity_id === "entity-admin-home-lifecycle",
      )?.lifecycle,
    ).toBe("completed");
    expect(completed.attention[0]?.status).toBe("cleared");
  });

  it("keeps stale or unavailable candidates at medium and conflicts at low", () => {
    expect(
      evaluateArchiveCandidate(
        fixtureWorkLifecycle,
        "entity-retired-site-topology",
      ).confidence,
    ).toBe("high");
    expect(
      evaluateArchiveCandidate(
        fixtureWorkLifecycle,
        "entity-legacy-index-review",
      ),
    ).toMatchObject({ confidence: "medium", selected_by_default: false });
    expect(
      evaluateArchiveCandidate(
        fixtureWorkLifecycle,
        "entity-conflicting-archive-review",
      ),
    ).toMatchObject({ confidence: "low", eligible: false });
  });

  it("does not infer fresh reconciliation when an entity has no source", () => {
    const snapshot = structuredClone(fixtureWorkLifecycle);
    snapshot.entities.find(
      (entity) => entity.entity_id === "entity-retired-site-topology",
    )!.source_ids = [];

    expect(
      evaluateArchiveCandidate(snapshot, "entity-retired-site-topology"),
    ).toMatchObject({ confidence: "medium", eligible: false });
  });

  it.each(["stale", "partial", "unavailable", "conflicting"] as const)(
    "never gives %s reconciliation high archive confidence",
    (reconciliationState) => {
      const snapshot = structuredClone(fixtureWorkLifecycle);
      const source = snapshot.sources.find(
        (candidate) =>
          candidate.source_id === "source-retired-topology-handoff",
      )!;
      source.reconciliation_state = reconciliationState;

      expect(
        evaluateArchiveCandidate(snapshot, "entity-retired-site-topology")
          .confidence,
      ).not.toBe("high");
    },
  );

  it("splits more than twenty eligible candidates deterministically", () => {
    const snapshot = makeArchiveBatchSnapshot(21);
    const entityIds = snapshot.entities
      .map((entity) => entity.entity_id)
      .reverse();
    const proposals = createArchiveProposalBatches(
      snapshot,
      entityIds,
      "completed fixtures",
      "ani",
      LATER,
    );

    expect(proposals).toHaveLength(2);
    expect(proposals[0]?.entity_ids).toHaveLength(20);
    expect(proposals[1]?.entity_ids).toHaveLength(1);
    expect(proposals.flatMap((proposal) => proposal.entity_ids)).toEqual(
      [...entityIds].sort(),
    );
  });

  it("rejects altered archive confirmation payloads", () => {
    const proposal = createArchiveProposalBatches(
      fixtureWorkLifecycle,
      ["entity-retired-site-topology"],
      "retired topology",
      "ani",
      LATER,
    )[0]!;

    expect(() =>
      confirmArchiveProposal(fixtureWorkLifecycle, proposal, {
        proposal_id: proposal.proposal_id,
        entity_ids: ["entity-retired-site-topology"],
        candidate_hash: "fnv1a-altered",
        actor: "ani",
        confirmed_at: LATER,
      }),
    ).toThrow("does not match the proposal binding");
  });

  it("archives and restores the same ids with append-only linked receipts", () => {
    const proposal = createArchiveProposalBatches(
      fixtureWorkLifecycle,
      ["entity-retired-site-topology"],
      "retired topology",
      "ani",
      LATER,
    )[0]!;
    const archived = confirmArchiveProposal(fixtureWorkLifecycle, proposal, {
      proposal_id: proposal.proposal_id,
      entity_ids: proposal.entity_ids,
      candidate_hash: proposal.candidate_hash,
      actor: "ani",
      confirmed_at: LATER,
    });
    const restored = restoreArchiveReceipt(
      archived.snapshot,
      archived.receipt,
      "ani",
      "2026-07-22T18:00:00.000Z",
    );

    const entity = restored.snapshot.entities.find(
      (candidate) => candidate.entity_id === "entity-retired-site-topology",
    );
    expect(entity?.lifecycle).toBe("completed");
    expect(entity?.source_ids).toEqual(["source-retired-topology-handoff"]);
    expect(restored.snapshot.receipts).toHaveLength(2);
    expect(restored.receipt.restoration_of_receipt_id).toBe(
      archived.receipt.receipt_id,
    );
    expect(searchWorkLifecycle(restored.snapshot, "restored")[0]).toMatchObject(
      {
        entity_id: "entity-retired-site-topology",
        receipt_ids: [archived.receipt.receipt_id, restored.receipt.receipt_id],
      },
    );

    expect(() =>
      restoreArchiveReceipt(
        archived.snapshot,
        { ...archived.receipt, actor: "altered" },
        "ani",
        "2026-07-22T18:30:00.000Z",
      ),
    ).toThrow("exact stored archive receipt");
  });

  it("keeps empty and failed adapter states explicit without fixture fallback", async () => {
    const empty = emptyWorkLifecycleSnapshot("adapter-v1");
    expect(empty.entities).toEqual([]);
    expect(empty.errors).toEqual([]);

    const failed = await loadWorkLifecycleSnapshot(
      {
        version: "adapter-v1",
        async readSnapshot() {
          throw new Error("adapter unavailable");
        },
      },
      fixtureWorkLifecycle,
    );
    expect(failed.source_mode).toBe("adapter");
    expect(failed.entities).toEqual([]);
    expect(failed.errors).toEqual(["lifecycle adapter read failed"]);
  });

  it("rejects forbidden raw fields from sanitized lifecycle data", () => {
    const unsafe = structuredClone(
      fixtureWorkLifecycle,
    ) as WorkLifecycleSnapshot & {
      transcripts?: string[];
    };
    unsafe.transcripts = ["raw text"];

    expect(() => assertValidWorkLifecycle(unsafe)).toThrow("forbidden");
  });
});

function sourceImport(
  source: WorkLifecycleSnapshot["sources"][number],
): WorkSourceImport {
  return {
    surface: source.surface,
    provider: source.provider,
    account_scope: source.account_scope,
    native_id: source.native_id,
    host: source.host,
    locator: source.locator,
    title: source.title,
    summary: source.summary,
    project: source.project,
    cwd: source.cwd,
    native_status: source.native_status,
    native_runtime: source.native_runtime,
    goal: source.goal,
    content_hash: source.content_hash,
    imported_at: source.imported_at,
    reconciled_at: source.reconciled_at,
    reconciliation_state: source.reconciliation_state,
    lineage_refs: source.lineage_refs,
    proof_refs: source.proof_refs,
  };
}

function makeArchiveBatchSnapshot(count: number): WorkLifecycleSnapshot {
  const snapshot = emptyWorkLifecycleSnapshot("fixture-v1");
  snapshot.source_mode = "fixture";
  for (let index = 0; index < count; index += 1) {
    const id = String(index).padStart(2, "0");
    const sourceId = `source-batch-${id}`;
    const entityId = `entity-batch-${id}`;
    const outcomeId = `outcome-batch-${id}`;
    snapshot.sources.push({
      source_id: sourceId,
      surface: "admin",
      provider: "fixture",
      account_scope: "batch-test",
      native_id: id,
      host: null,
      locator: `admin://batch/${id}`,
      title: `batch source ${id}`,
      summary: "sanitized batch fixture.",
      project: "test",
      cwd: null,
      native_status: "closed",
      native_runtime: "closed",
      goal: null,
      content_hash: `sha256:batch-${id}`,
      imported_at: LATER,
      reconciled_at: LATER,
      reconciliation_state: "fresh",
      import_state: "created",
      lineage_refs: [],
      proof_refs: [`proof:batch-${id}`],
      privacy: "sanitized",
    });
    snapshot.entities.push({
      entity_id: entityId,
      kind: "reference",
      title: `batch entity ${id}`,
      summary: "completed batch fixture.",
      lifecycle: "completed",
      owner: "ani",
      owner_state: "current",
      contradiction_refs: [],
      source_ids: [sourceId],
      outcome_ids: [outcomeId],
      attention_ids: [],
      updated_at: LATER,
      archived_at: null,
    });
    snapshot.outcomes.push({
      outcome_id: outcomeId,
      entity_id: entityId,
      status: "completed",
      summary: "batch fixture completed.",
      proof_refs: [`proof:batch-${id}`],
      recorded_at: LATER,
    });
  }
  assertValidWorkLifecycle(snapshot);
  return snapshot;
}
