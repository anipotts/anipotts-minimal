import { describe, expect, it } from "vitest";
import {
  AdminInboxWriteError,
  normalizeAdminInboxAttention,
  writeAdminInboxAttention,
  type AdminInboxWriteStatement,
} from "./inbox-write";

class FakeStatement implements AdminInboxWriteStatement {
  values: unknown[] = [];

  constructor(readonly sql: string) {}

  bind(...values: unknown[]): FakeStatement {
    this.values = values;
    return this;
  }
}

function validInput() {
  return {
    domain: "fleet",
    entity_ref: "repo:infra:pr:11",
    attention_kind: "approval",
    source: "github",
    title: "merge fleet convergence pr",
    summary: "review the verified source convergence before merging.",
    href: "https://github.com/anipotts/Infra/pull/11",
    urgency: "high",
    owner: "chief/infra",
    observed_at: "2026-07-24T20:00:00.000Z",
  } as const;
}

describe("admin inbox attention writer", () => {
  it("rejects unknown fields so private payloads cannot enter the projection", () => {
    expect(() =>
      normalizeAdminInboxAttention({
        ...validInput(),
        payload: { transcript: "private" },
      }),
    ).toThrowError("unknown_field:payload");
  });

  it("writes one event and one attention projection in an atomic batch", async () => {
    const statements: FakeStatement[] = [];
    const db = {
      prepare(sql: string) {
        const statement = new FakeStatement(sql);
        statements.push(statement);
        return statement;
      },
      async batch(batch: AdminInboxWriteStatement[]) {
        expect(batch).toEqual(statements);
        return [{ success: true }, { success: true }];
      },
    };

    const result = await writeAdminInboxAttention(db, validInput(), "ani");

    expect(result).toMatchObject({
      ok: true,
      action: "upsert",
      dedupe_key: "attention:fleet:repo:infra:pr:11:approval",
      status: "action_required",
    });
    expect(statements).toHaveLength(2);
    expect(statements[0]?.sql).toContain("INSERT OR IGNORE INTO admin_events");
    expect(statements[1]?.sql).toContain("ON CONFLICT(dedupe_key)");
    expect(statements[1]?.sql).toContain("json_insert");
  });

  it("resolves and restores the same stable attention identity", async () => {
    const db = {
      prepare(sql: string) {
        return new FakeStatement(sql);
      },
      async batch() {
        return [{ success: true }, { success: true }];
      },
    };

    const opened = await writeAdminInboxAttention(db, validInput(), "ani");
    const resolved = await writeAdminInboxAttention(
      db,
      {
        ...validInput(),
        action: "resolve",
        summary: "merged and verified.",
        observed_at: "2026-07-24T21:00:00.000Z",
      },
      "ani",
    );
    const restored = await writeAdminInboxAttention(
      db,
      {
        ...validInput(),
        summary: "a new contradiction reopened the same approval.",
        observed_at: "2026-07-24T22:00:00.000Z",
      },
      "ani",
    );

    expect(resolved.item_id).toBe(opened.item_id);
    expect(restored.item_id).toBe(opened.item_id);
    expect(resolved.status).toBe("resolved");
    expect(restored.status).toBe("action_required");
    expect(
      new Set([opened.event_id, resolved.event_id, restored.event_id]).size,
    ).toBe(3);
  });

  it("fails closed when either statement in the batch fails", async () => {
    const db = {
      prepare(sql: string) {
        return new FakeStatement(sql);
      },
      async batch() {
        return [{ success: true }, { success: false }];
      },
    };

    await expect(
      writeAdminInboxAttention(db, validInput(), "ani"),
    ).rejects.toEqual(
      expect.objectContaining<Partial<AdminInboxWriteError>>({
        status: 500,
        message: "inbox_write_batch_failed",
      }),
    );
  });
});
