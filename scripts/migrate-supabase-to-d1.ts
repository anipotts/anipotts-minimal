/**
 * One-time migration script: Supabase -> D1
 *
 * Reads all data from Supabase using the service role key,
 * transforms for SQLite (arrays→JSON, booleans→0/1, JSONB→JSON text),
 * and writes INSERT statements to a SQL file for D1.
 *
 * Usage:
 *   tsx scripts/migrate-supabase-to-d1.ts
 *   wrangler d1 execute anipotts-db --remote --file=scripts/d1-migration-data.sql
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from .env.local
const envPath = path.resolve(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx);
  const val = trimmed.slice(eqIdx + 1);
  if (!process.env[key]) process.env[key] = val;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// SQL escape: double single quotes, handle nulls
function esc(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") return String(val);
  if (typeof val === "boolean") return val ? "1" : "0";
  if (Array.isArray(val)) return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

// Columns that are arrays in Postgres (TEXT[]) -> JSON strings in D1
const ARRAY_COLUMNS = new Set([
  "tags",
  "platforms_targeted",
  "platforms_posted",
  "hashtags",
]);

// Columns that are JSONB in Postgres -> JSON text in D1
const JSONB_COLUMNS = new Set([
  "payload",
  "raw_data",
  "version_history",
]);

// Columns that are JSONB but need special handling (already objects)
const JSONB_VALUE_COLUMNS = new Set(["value", "content"]);

// Columns that are booleans in Postgres -> INTEGER 0/1 in D1
const BOOL_COLUMNS = new Set([
  "published",
  "featured",
  "visible",
  "is_up",
  "dirty",
]);

function transformValue(col: string, val: unknown, table: string): string {
  if (val === null || val === undefined) return "NULL";

  // Booleans -> 0/1
  if (BOOL_COLUMNS.has(col)) {
    return val ? "1" : "0";
  }

  // Arrays -> JSON strings
  if (ARRAY_COLUMNS.has(col)) {
    if (Array.isArray(val)) return esc(JSON.stringify(val));
    if (typeof val === "string") {
      // Postgres might return "{a,b}" format
      if (val.startsWith("{") && val.endsWith("}")) {
        const items = val.slice(1, -1).split(",").filter(Boolean);
        return esc(JSON.stringify(items));
      }
      return esc(val);
    }
    return esc("[]");
  }

  // JSONB columns
  if (JSONB_COLUMNS.has(col)) {
    if (typeof val === "object") return esc(JSON.stringify(val));
    return esc(val);
  }

  // "value" and "content" columns are JSONB in some tables
  if (JSONB_VALUE_COLUMNS.has(col)) {
    // Check if this table uses JSONB for this column
    const jsonbTables: Record<string, Set<string>> = {
      value: new Set(["metrics_cache", "content_config", "business_data", "ops_snapshots"]),
      content: new Set(["page_content"]),
    };
    if (jsonbTables[col]?.has(table)) {
      if (typeof val === "object") return esc(JSON.stringify(val));
    }
  }

  return esc(val);
}

interface TableConfig {
  name: string;
  // Columns to exclude from migration (auto-generated in D1)
  excludeColumns?: string[];
  // For tables with fts column (Postgres generated, doesn't exist in D1)
  skipColumns?: string[];
}

const TABLES: TableConfig[] = [
  { name: "thoughts", skipColumns: ["fts"] },
  { name: "atoms" },
  { name: "projects", skipColumns: ["fts"] },
  { name: "social_links" },
  { name: "page_content" },
  { name: "site_settings" },
  { name: "github_events" },
  { name: "contact_submissions" },
  { name: "content_config" },
  { name: "content_schedule" },
  { name: "update_alerts" },
  { name: "metrics_cache" },
  { name: "status_checks", excludeColumns: ["id"] },
  { name: "favorite_numbers", excludeColumns: ["id"] },
];

async function fetchAll(table: string): Promise<Record<string, unknown>[]> {
  const pageSize = 1000;
  const allRows: Record<string, unknown>[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error(`Error fetching ${table}:`, error.message);
      break;
    }
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return allRows;
}

async function main() {
  const lines: string[] = [
    "-- D1 Migration Data",
    `-- Generated: ${new Date().toISOString()}`,
    "-- Source: Supabase (anipotts.com project)",
    "",
  ];

  const counts: Record<string, number> = {};

  for (const config of TABLES) {
    const { name: table, excludeColumns = [], skipColumns = [] } = config;
    console.log(`Fetching ${table}...`);

    const rows = await fetchAll(table);
    counts[table] = rows.length;

    if (rows.length === 0) {
      lines.push(`-- ${table}: 0 rows (empty)`);
      lines.push("");
      continue;
    }

    lines.push(`-- ${table}: ${rows.length} rows`);

    // Get columns from first row, filtering out excluded/skipped
    const allCols = Object.keys(rows[0]);
    const cols = allCols.filter(
      (c) => !excludeColumns.includes(c) && !skipColumns.includes(c)
    );

    for (const row of rows) {
      const values = cols.map((col) => transformValue(col, row[col], table));
      lines.push(
        `INSERT OR REPLACE INTO ${table} (${cols.join(", ")}) VALUES (${values.join(", ")});`
      );
    }

    lines.push("");
  }

  lines.push("-- END OF MIGRATION DATA");
  lines.push("");

  // Write SQL file
  const outPath = path.resolve(__dirname, "d1-migration-data.sql");
  fs.writeFileSync(outPath, lines.join("\n"));

  console.log("\n--- Migration Summary ---");
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table}: ${count} rows`);
  }
  console.log(`\nSQL written to: ${outPath}`);
  console.log("Next: CLOUDFLARE_ACCOUNT_ID=0f856093bdcd34a7da1bde5ee4385163 npx wrangler d1 execute anipotts-db --remote --file=scripts/d1-migration-data.sql");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
