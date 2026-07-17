import { describe, expect, it } from "vitest";
import { refreshCareerProjection } from "./career-projections";

class Statement {
  values: unknown[] = [];
  constructor(readonly query: string) {}
  bind(...values: unknown[]) {
    this.values = values;
    return this;
  }
  async run() {
    return { meta: { changes: 1 } };
  }
  async first<T>() {
    return null as T | null;
  }
  async all<T>() {
    return { results: [] as T[] };
  }
}

class FakeDb {
  prepared: Statement[] = [];
  committed: Statement[] = [];
  failBatch = false;
  prepare(query: string) {
    const statement = new Statement(query);
    this.prepared.push(statement);
    return statement;
  }
  async batch(statements: Statement[]) {
    if (this.failBatch) throw new Error("transaction rejected");
    this.committed.push(...statements);
    return statements.map(() => ({ success: true }));
  }
}

function context(db: FakeDb, body: Record<string, unknown>) {
  return {
    request: new Request(
      "https://admin.anipotts.com/api/admin/projections/refresh",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
    ),
    locals: { runtime: { env: { DB: db } } },
  } as never;
}

function projection(status = "fresh") {
  return {
    domain: "career",
    snapshot: {
      snapshot_id: "snapshot-safe",
      current_focus: "focused search",
      next_action: "review target",
      source_status: [{ source: "jobs", status }],
    },
    targets: [{ company: "company", role: "role", next_action: "review" }],
  };
}

describe("career projection refresh", () => {
  it("commits a valid refresh in one batch", async () => {
    const db = new FakeDb();
    const response = await refreshCareerProjection(context(db, projection()));
    expect(response.status).toBe(200);
    expect(db.committed).toHaveLength(2);
  });

  it("rejects complete target validation before writes", async () => {
    const db = new FakeDb();
    const body = projection();
    body.targets[0]!.company = "";
    const response = await refreshCareerProjection(context(db, body));
    expect(response.status).toBe(400);
    expect(db.committed).toHaveLength(0);
  });

  it("leaves no committed writes when the atomic batch fails", async () => {
    const db = new FakeDb();
    db.failBatch = true;
    await expect(
      refreshCareerProjection(context(db, projection())),
    ).rejects.toThrow("transaction rejected");
    expect(db.committed).toHaveLength(0);
  });

  it("records stale source state without replacing targets", async () => {
    const db = new FakeDb();
    const response = await refreshCareerProjection(
      context(db, projection("unavailable")),
    );
    expect(response.status).toBe(202);
    expect(db.committed).toHaveLength(1);
    expect(db.committed[0]!.query).toContain("admin_career_snapshots");
  });
});
