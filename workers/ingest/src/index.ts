interface Env {
  DB: D1Database;
  MAC_MINI_INGEST_KEY: string;
}

type Category = "ops" | "code" | "analytics" | "business" | "rollup";

const CATEGORY_TABLE: Record<Category, string> = {
  ops: "ops_snapshots",
  code: "code_health",
  analytics: "analytics_events",
  business: "business_data",
  rollup: "daily_rollups",
};

const VALID_CATEGORIES = new Set<Category>([
  "ops",
  "code",
  "analytics",
  "business",
  "rollup",
]);

/** Allowlisted columns per table. Only these can be written via ingest. */
const TABLE_COLUMNS: Record<Category, Set<string>> = {
  ops: new Set(["key", "category", "value", "updated_at"]),
  code: new Set([
    "repo",
    "dirty",
    "unpushed_count",
    "stale_branches",
    "last_commit_at",
    "last_commit_msg",
    "deployment_status",
    "updated_at",
  ]),
  analytics: new Set([
    "id",
    "source",
    "metric",
    "value",
    "dimensions",
    "period_start",
    "period_end",
    "fetched_at",
  ]),
  business: new Set(["key", "value", "source_file", "updated_at"]),
  rollup: new Set(["id", "date", "hour", "metric", "value", "created_at"]),
};

/** Primary key column(s) per table, used to look up existing rows for merging. */
const PK_COLUMNS: Record<Category, string[]> = {
  ops: ["key", "category"],
  code: ["repo"],
  analytics: ["id"],
  business: ["key"],
  rollup: ["id"],
};

/** Timestamp column name per table (set automatically on ingest). */
const TS_COLUMN: Record<Category, string> = {
  ops: "updated_at",
  code: "updated_at",
  analytics: "fetched_at",
  business: "updated_at",
  rollup: "created_at",
};

interface IngestPayload {
  category: Category;
  data: Record<string, unknown> | Record<string, unknown>[];
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Fetch the existing row from D1 so we can merge incoming fields over it,
 * preventing INSERT OR REPLACE from NULL-ing omitted columns.
 */
async function fetchExistingRow(
  db: D1Database,
  table: string,
  pkColumns: string[],
  incomingRecord: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  const whereClauses = pkColumns.map((col) => `${col} = ?`);
  const whereValues = pkColumns.map((col) => incomingRecord[col]);

  // If any PK value is missing, can't look up existing row
  if (whereValues.some((v) => v === undefined || v === null)) return null;

  const sql = `SELECT * FROM ${table} WHERE ${whereClauses.join(" AND ")} LIMIT 1`;
  const result = await db
    .prepare(sql)
    .bind(...whereValues)
    .first();
  return result as Record<string, unknown> | null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204 });
    }

    // Health check endpoint
    if (request.method === "GET") {
      let d1Status: "connected" | "error" = "error";
      let tablesOk = false;
      try {
        const result = await env.DB.prepare(
          "SELECT COUNT(*) as cnt FROM thoughts LIMIT 1",
        ).first<{ cnt: number }>();
        if (result && typeof result.cnt === "number") {
          d1Status = "connected";
          tablesOk = true;
        }
      } catch {
        d1Status = "error";
      }
      return jsonResponse({
        app: "ingest",
        ok: d1Status === "connected",
        d1: d1Status,
        tables_ok: tablesOk,
        ts: new Date().toISOString(),
      });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    // Auth: require MAC_MINI_INGEST_KEY header
    const apiKey = request.headers.get("X-Ingest-Key");
    if (!apiKey || apiKey !== env.MAC_MINI_INGEST_KEY) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Parse body
    let payload: IngestPayload;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, 400);
    }

    // Validate category
    if (!payload.category || !VALID_CATEGORIES.has(payload.category)) {
      return jsonResponse(
        {
          error: `Invalid category. Must be one of: ${[...VALID_CATEGORIES].join(", ")}`,
        },
        400,
      );
    }

    if (!payload.data) {
      return jsonResponse({ error: "Missing data field" }, 400);
    }

    const category = payload.category;
    const table = CATEGORY_TABLE[category];
    const allowedColumns = TABLE_COLUMNS[category];
    const pkColumns = PK_COLUMNS[category];
    const tsColumn = TS_COLUMN[category];
    const rows = Array.isArray(payload.data) ? payload.data : [payload.data];

    if (rows.length === 0) {
      return jsonResponse({ error: "Empty data array" }, 400);
    }

    const ts = new Date().toISOString();
    let rowsWritten = 0;

    try {
      const statements = [];

      for (const row of rows) {
        // Filter to allowlisted columns only, add timestamp
        const incoming: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(row)) {
          if (allowedColumns.has(k)) {
            incoming[k] =
              typeof v === "object" && v !== null ? JSON.stringify(v) : v;
          }
        }
        incoming[tsColumn] = ts;

        if (Object.keys(incoming).length === 0) {
          throw new Error("No valid columns in row");
        }

        // Merge: fetch existing row so omitted columns keep their values
        const existing = await fetchExistingRow(
          env.DB,
          table,
          pkColumns,
          incoming,
        );
        const merged = existing ? { ...existing, ...incoming } : incoming;

        // Only write allowlisted columns + timestamp
        const record: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(merged)) {
          if (allowedColumns.has(k)) {
            record[k] = v;
          }
        }

        const keys = Object.keys(record);
        const placeholders = keys.map(() => "?").join(", ");
        const values = Object.values(record);

        statements.push(
          env.DB.prepare(
            `INSERT OR REPLACE INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`,
          ).bind(...values),
        );
      }

      await env.DB.batch(statements);
      rowsWritten = rows.length;
    } catch (e) {
      const isValidation =
        e instanceof Error && e.message === "No valid columns in row";
      return jsonResponse(
        { error: isValidation ? e.message : "Database write failed" },
        isValidation ? 400 : 500,
      );
    }

    return jsonResponse({ success: true, rows_written: rowsWritten });
  },
};
