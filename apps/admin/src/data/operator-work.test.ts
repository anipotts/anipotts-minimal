import { describe, expect, it } from "vitest";
import { operatorWorkFixture } from "./dev-operator-work";
import {
  assertValidOperatorWorkProjection,
  groupOperatorTasks,
} from "./operator-work";

describe("operator work projection", () => {
  it("keeps runtime, operator, lifecycle, freshness, and attention separate", () => {
    assertValidOperatorWorkProjection(operatorWorkFixture);

    const site = operatorWorkFixture.task_states.find(
      (task) => task.task_id === "019f7fb8-69b7-7791-8e67-87c87acfae02",
    );
    expect(site).toMatchObject({
      runtime_state: "active",
      operator_state: "working",
      lifecycle: "open",
      freshness: "fresh",
      attention_ref: null,
    });
  });

  it("renders the four deterministic execution lanes", () => {
    const groups = groupOperatorTasks(operatorWorkFixture);

    expect(Object.keys(groups)).toEqual([
      "foreground",
      "background",
      "waiting",
      "recently_completed",
    ]);
    expect(Object.values(groups).map((rows) => rows.length)).toEqual([
      1, 1, 1, 0,
    ]);
  });

  it("has one handoff lineage and one collapsed loose chat", () => {
    expect(operatorWorkFixture.task_lineage).toEqual([
      expect.objectContaining({ relation: "handoff" }),
    ]);
    expect(operatorWorkFixture.source_states).toEqual([
      expect.objectContaining({
        provider: "chatgpt",
        linked_task_id: null,
        searchable_history_disposition: "preserved_collapsed",
      }),
    ]);
  });

  it("rejects a duplicate task or attention destination", () => {
    const duplicateTask = structuredClone(operatorWorkFixture);
    duplicateTask.task_states.push(duplicateTask.task_states[0]!);
    expect(() => assertValidOperatorWorkProjection(duplicateTask)).toThrow(
      "duplicate operator task",
    );

    const duplicateAttention = structuredClone(operatorWorkFixture);
    duplicateAttention.task_states[0]!.attention_ref =
      duplicateAttention.task_states[2]!.attention_ref;
    expect(() => assertValidOperatorWorkProjection(duplicateAttention)).toThrow(
      "duplicate attention destination",
    );
  });
});
