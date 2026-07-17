import { beforeAll, describe, expect, it } from "vitest";
import {
  createOpaqueAdminToken,
  encryptAdminPayload,
  importAdminEncryptionKey,
} from "@anipotts/lib/admin";
import {
  openCareerSourceLink,
  refreshCareerProjection,
} from "./career-projections";

class Statement {
  values: unknown[] = [];
  constructor(
    readonly query: string,
    readonly db: FakeDb,
  ) {}
  bind(...values: unknown[]) {
    this.values = values;
    return this;
  }
  async run() {
    if (this.query.includes("last_opened_at") && this.db.auditFail)
      throw new Error("audit unavailable");
    return { meta: { changes: 1 } };
  }
  async first<T>() {
    return this.db.sourceRow as T | null;
  }
  async all<T>() {
    return { results: [] as T[] };
  }
}

class FakeDb {
  prepared: Statement[] = [];
  committed: Statement[] = [];
  failBatch = false;
  auditFail = false;
  sourceRow: Record<string, unknown> | null = null;
  prepare(query: string) {
    const statement = new Statement(query, this);
    this.prepared.push(statement);
    return statement;
  }
  async batch(statements: Statement[]) {
    if (this.failBatch) throw new Error("transaction rejected");
    this.committed.push(...statements);
    return statements.map(() => ({ success: true }));
  }
}

let sourceKey: string;
let encryptedLocator: Awaited<ReturnType<typeof encryptAdminPayload>>;

beforeAll(async () => {
  sourceKey = createOpaqueAdminToken();
  encryptedLocator = await encryptAdminPayload(
    { locator: "https://mail.google.com/mail/u/0/" },
    await importAdminEncryptionKey(sourceKey),
    1,
  );
});

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
    locals: {
      runtime: {
        env: { DB: db, ADMIN_ACTION_ENCRYPTION_KEY: sourceKey },
      },
    },
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

describe("secure career source links", () => {
  function sourceDb(overrides: Record<string, unknown> = {}) {
    const db = new FakeDb();
    db.sourceRow = {
      locator_ciphertext: encryptedLocator.ciphertext,
      locator_iv: encryptedLocator.iv,
      key_version: 1,
      expires_at: "2099-01-01T00:00:00.000Z",
      ...overrides,
    };
    return db;
  }

  it("redirects only after the no-store audit update", async () => {
    const response = await openCareerSourceLink(
      context(sourceDb(), {}),
      "source-safe",
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });

  it("rejects expired, unknown-version, tampered, and disallowed links", async () => {
    const cases = [
      sourceDb({ expires_at: "2020-01-01T00:00:00.000Z" }),
      sourceDb({ key_version: 2 }),
      sourceDb({
        locator_ciphertext: `${encryptedLocator.ciphertext.startsWith("A") ? "B" : "A"}${encryptedLocator.ciphertext.slice(1)}`,
      }),
    ];
    const disallowed = await encryptAdminPayload(
      { locator: "https://outside.invalid/" },
      await importAdminEncryptionKey(sourceKey),
      1,
    );
    cases.push(
      sourceDb({
        locator_ciphertext: disallowed.ciphertext,
        locator_iv: disallowed.iv,
      }),
    );
    for (const db of cases) {
      const response = await openCareerSourceLink(
        context(db, {}),
        "source-safe",
      );
      expect(response.status).toBeGreaterThanOrEqual(400);
      const result = await response.json();
      expect(Object.keys(result)).toEqual(["error"]);
    }
  });

  it("blocks redirect when last-opened audit persistence fails", async () => {
    const db = sourceDb();
    db.auditFail = true;
    const response = await openCareerSourceLink(context(db, {}), "source-safe");
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "source_link_audit_failed",
    });
  });
});
