import { describe, expect, it } from "vitest";
import { rankInboxItems } from "./inbox";
import { testInboxItem as item } from "./inbox.test-fixtures";

describe("Inbox ranking", () => {
  it("keeps every unresolved action reachable in stable priority order", () => {
    const rows = rankInboxItems([
      item({ id: "later", entity_id: "entity:later", risk: "low" }),
      item({
        id: "urgent",
        entity_id: "entity:urgent",
        risk: "high",
        timeframe: "now",
      }),
      item({
        id: "approval",
        entity_id: "entity:approval",
        action_kind: "approve",
      }),
    ]);

    expect(rows.map((row) => row.id)).toEqual(["urgent", "approval", "later"]);
    expect(rows.every((row) => row.href.length > 0)).toBe(true);
  });

  it("prevents duplicate Needs Ani destinations for the same action", () => {
    const rows = rankInboxItems([
      item({
        id: "older",
        entity_id: "entity:one",
        updated_at: "2026-07-25T10:00:00.000Z",
      }),
      item({
        id: "newer",
        entity_id: "entity:one",
        updated_at: "2026-07-25T11:00:00.000Z",
      }),
      item({
        id: "different-action",
        entity_id: "entity:one",
        action_kind: "approve",
      }),
    ]);

    expect(rows.map((row) => row.id).sort()).toEqual([
      "different-action",
      "newer",
    ]);
  });
});
