import { describe, expect, it } from "vitest";
import type { AdminInboxItem, AdminInboxReadState } from "./inbox";
import {
  buildActivationGraph,
  itemMatchesOperationalProjection,
} from "./activation-graph";
import { operatorWorkFixture } from "./operator-work";

const item = (
  values: Partial<AdminInboxItem> & Pick<AdminInboxItem, "id" | "entity_id">,
): AdminInboxItem => ({
  dedupe_key: values.id,
  source: "test",
  owner: "chief/site",
  action_kind: "open",
  title: values.id,
  summary: "source-backed summary",
  status: "open",
  risk: "medium",
  category: "work",
  timeframe: "today",
  href: "/work",
  next_action: "take the next bounded action",
  proof: "proof:test",
  updated_at: "2026-07-31T12:00:00.000Z",
  ...values,
});

const inbox = (items: AdminInboxItem[]): AdminInboxReadState => ({
  generated_at: "2026-07-31T12:00:00.000Z",
  mode: "ready",
  counts: { total: items.length, high: 0, medium: items.length, low: 0 },
  items,
});

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
});
