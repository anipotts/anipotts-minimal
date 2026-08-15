import { describe, expect, it } from "vitest";
import {
  buildActivationGraph,
  itemMatchesOperationalProjection,
} from "./activation-graph";
import {
  testInboxItem as item,
  testInboxReadState as inbox,
} from "./inbox.test-fixtures";
import { operatorWorkFixture } from "./operator-work";
import {
  defineMissingReference,
  inspectorDestination,
} from "./semantic-reference";

describe("activation graph projection", () => {
  it("uses the ranked attention head as a suggestion and keeps four graph layers", () => {
    const projection = buildActivationGraph(
      inbox([item({ id: "focus", entity_id: "entity:focus" })]),
      operatorWorkFixture,
      new Date("2026-07-31T12:00:00.000Z"),
    );

    expect(projection.foreground?.id).toBe("focus");
    expect(projection.nodes.map((node) => node.layer)).toEqual([
      "world",
      "obligation",
      "execution",
      "trajectory",
    ]);
    expect(projection.connections).toHaveLength(3);
  });

  it("derives overlapping blocked and needs-Ani projections without collapsing them", () => {
    const approval = item({
      id: "approval",
      entity_id: "entity:approval",
      action_kind: "approve",
      status: "blocked",
    });

    expect(itemMatchesOperationalProjection(approval, "blocked")).toBe(true);
    expect(itemMatchesOperationalProjection(approval, "needs-ani")).toBe(true);
    expect(itemMatchesOperationalProjection(approval, "ready")).toBe(false);

    const projection = buildActivationGraph(
      inbox([approval]),
      operatorWorkFixture,
      new Date("2026-07-31T12:00:00.000Z"),
    );
    expect(projection.lanes.find((lane) => lane.key === "blocked")?.count).toBe(
      1,
    );
    expect(
      projection.lanes.find((lane) => lane.key === "needs-ani")?.count,
    ).toBe(1);
  });

  it("keeps waiting neutral and distinct from a blocked constraint", () => {
    const waiting = item({
      id: "waiting",
      entity_id: "entity:waiting",
      timeframe: "waiting / gated",
    });

    expect(itemMatchesOperationalProjection(waiting, "waiting")).toBe(true);
    expect(itemMatchesOperationalProjection(waiting, "blocked")).toBe(false);
  });

  it("fails closed when the operator work snapshot is stale", () => {
    const projection = buildActivationGraph(
      inbox([]),
      operatorWorkFixture,
      new Date("2026-07-31T12:00:00.000Z"),
    );

    expect(projection.work_source_state).toBe("stale");
    expect(
      projection.lanes.find((lane) => lane.key === "running")?.source_state,
    ).toBe("stale");
  });

  it("does not call Inbox-derived lanes current when providers were not checked", () => {
    const readState = inbox([
      item({ id: "fixture", entity_id: "entity:fixture" }),
    ]);
    readState.source = defineMissingReference({
      id: "test-inbox:unchecked-source",
      kind: "source",
      label: "source state",
      value: null,
      summary: "The provider was not checked.",
      source_state: "unchecked",
      checked_at: null,
      authority: { kind: "none", label: "source authority unavailable" },
      provenance: {
        source: "test",
        source_ref: "test:unchecked-source",
        method: "fixture",
        evidence_refs: [],
      },
      confidence: {
        level: "unknown",
        explanation: "No provider read occurred.",
      },
      sensitivity: "internal",
      validity: { valid_from: null, valid_until: null },
      retrieval_policy: {
        mode: "refresh_then_inspect",
        refresh_href: "/",
        explanation: "Refresh or inspect source coverage.",
      },
      destination: inspectorDestination("inspect source coverage"),
    });

    const projection = buildActivationGraph(
      readState,
      operatorWorkFixture,
      new Date("2026-07-31T12:00:00.000Z"),
    );

    expect(
      projection.lanes.find((lane) => lane.key === "ready")?.source_state,
    ).toBe("stale");
    expect(
      projection.lanes.find((lane) => lane.key === "needs-ani")?.source_state,
    ).toBe("stale");
  });
});
