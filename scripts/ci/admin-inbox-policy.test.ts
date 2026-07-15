import { describe, expect, it } from "vitest";
import {
  canonicalInboxDomain,
  isClosedInboxItem,
  partitionInboxProjectionItems,
  requiresHumanInboxAttention,
  shouldPromoteRuntimeOverlay,
  type InboxPolicyItem,
} from "../../apps/admin/src/data/inbox-policy";
import { fixtureProjections } from "../../packages/lib/src/admin-control/fixtures";

const baseItem: InboxPolicyItem = {
  domain: "work",
  source: "test",
  owner: "chief/site",
  account: null,
  title: "test item",
  status: "review",
  attention_kind: "review",
  action_kind: "review",
};

describe("admin inbox policy", () => {
  it("maps source domains into the five canonical filters", () => {
    expect(canonicalInboxDomain({ ...baseItem, domain: "jobs" })).toBe("work");
    expect(canonicalInboxDomain({ ...baseItem, domain: "brand" })).toBe(
      "content",
    );
    expect(canonicalInboxDomain({ ...baseItem, domain: "health" })).toBe(
      "life",
    );
    expect(canonicalInboxDomain({ ...baseItem, domain: "fleet" })).toBe(
      "fleet",
    );
    expect(canonicalInboxDomain({ ...baseItem, domain: "infra" })).toBe(
      "system",
    );
  });

  it("keeps the current cleanup audit out because no inbox item exists", () => {
    const cleanupItems = fixtureProjections.inbox_items.filter((item) =>
      [item.item_id, item.dedupe_key, item.entity_ref, item.title]
        .filter(Boolean)
        .some((value) =>
          value?.toLowerCase().includes("personal-system-cleanup"),
        ),
    );

    expect(cleanupItems).toEqual([]);
  });

  it("allows a future explicit cleanup decision into the open queue", () => {
    expect(
      requiresHumanInboxAttention({
        ...baseItem,
        title: "personal-system-cleanup decision",
        attention_kind: "decision",
        action_kind: "decide",
      }),
    ).toBe(true);
  });

  it("retains closed rows as history while excluding them from open counts", () => {
    const resolved = {
      ...baseItem,
      status: "resolved",
      attention_kind: "verification",
      action_kind: "verify",
    };

    expect(isClosedInboxItem(resolved)).toBe(true);
    expect(requiresHumanInboxAttention(resolved)).toBe(false);
    expect(partitionInboxProjectionItems([baseItem, resolved])).toEqual({
      open: [baseItem],
      history: [resolved],
    });
  });

  it("includes an explicit review card", () => {
    expect(requiresHumanInboxAttention(baseItem)).toBe(true);
  });

  it("excludes routine dirty repo observations at the source", () => {
    expect(
      shouldPromoteRuntimeOverlay({
        deploy_impact: "local_only",
        git_available: true,
      }),
    ).toBe(false);
    expect(
      shouldPromoteRuntimeOverlay({
        deploy_impact: "production",
        git_available: true,
      }),
    ).toBe(true);
  });
});
