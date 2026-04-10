interface Env {
  DB: D1Database;
  MAC_MINI_INGEST_KEY: string;
}

type Category = "ops" | "code" | "analytics" | "business";

const CATEGORY_TABLE: Record<Category, string> = {
  ops: "ops_snapshots",
  code: "code_health",
  analytics: "analytics_events",
  business: "business_data",
};

const VALID_CATEGORIES = new Set<Category>([
  "ops",
  "code",
  "analytics",
  "business",
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
};

/** Timestamp column name per table (set automatically on ingest). */
const TS_COLUMN: Record<Category, string> = {
  ops: "updated_at",
  code: "updated_at",
  analytics: "fetched_at",
  business: "updated_at",
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204 });
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
    const tsColumn = TS_COLUMN[category];
    const rows = Array.isArray(payload.data) ? payload.data : [payload.data];

    if (rows.length === 0) {
      return jsonResponse({ error: "Empty data array" }, 400);
    }

    const ts = new Date().toISOString();
    let rowsWritten = 0;

    try {
      const statements = rows.map((row) => {
        // Filter to allowlisted columns only, add timestamp
        const record: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(row)) {
          if (allowedColumns.has(k)) {
            record[k] =
              typeof v === "object" && v !== null ? JSON.stringify(v) : v;
          }
        }
        record[tsColumn] = ts;

        const keys = Object.keys(record);
        if (keys.length === 0) {
          throw new Error("No valid columns in row");
        }

        const placeholders = keys.map(() => "?").join(", ");
        const values = Object.values(record);

        return env.DB.prepare(
          `INSERT OR REPLACE INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`,
        ).bind(...values);
      });

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
