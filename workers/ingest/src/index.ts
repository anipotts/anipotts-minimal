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

interface IngestPayload {
  category: Category;
  data: Record<string, unknown> | Record<string, unknown>[];
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-Ingest-Key",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Only POST allowed
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

    const table = CATEGORY_TABLE[payload.category];
    const rows = Array.isArray(payload.data) ? payload.data : [payload.data];

    if (rows.length === 0) {
      return jsonResponse({ error: "Empty data array" }, 400);
    }

    const ts = new Date().toISOString();
    let rowsWritten = 0;

    try {
      const statements = rows.map((row) => {
        const record: Record<string, unknown> = {
          ...row,
          ingested_at: ts,
        };
        const keys = Object.keys(record);
        const placeholders = keys.map(() => "?").join(", ");
        const values = keys.map((k) => {
          const v = record[k];
          if (typeof v === "object" && v !== null) return JSON.stringify(v);
          return v;
        });

        return env.DB.prepare(
          `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`,
        ).bind(...values);
      });

      // Batch insert for efficiency
      await env.DB.batch(statements);
      rowsWritten = rows.length;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return jsonResponse({ error: `Database error: ${msg}` }, 500);
    }

    return jsonResponse({ success: true, rows_written: rowsWritten });
  },
};
