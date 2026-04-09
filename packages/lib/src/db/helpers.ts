/**
 * D1/SQLite data transformation helpers.
 *
 * Postgres -> SQLite type mapping:
 *   TEXT[]    -> TEXT (JSON array string)
 *   BOOLEAN   -> INTEGER (0/1)
 *   JSONB     -> TEXT (JSON string)
 *   UUID      -> TEXT (generated in app)
 */

/** Parse a JSON array column from D1 (stored as TEXT). Returns [] on failure. */
export function parseJsonArray<T = string>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  if (typeof val === "string" && val) {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Serialize an array for D1 storage. */
export function toJsonArray(val: unknown[] | null | undefined): string {
  return JSON.stringify(val ?? []);
}

/** Parse a JSON object column from D1. Returns null on failure. */
export function parseJson<T = unknown>(val: unknown): T | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "object") return val as T;
  if (typeof val === "string" && val) {
    try {
      return JSON.parse(val) as T;
    } catch {
      return null;
    }
  }
  return null;
}

/** Serialize an object for D1 storage. */
export function toJson(val: unknown): string {
  return JSON.stringify(val ?? {});
}

/** Generate a UUID v4. Works in both Node.js and Workers runtime. */
export function uuid(): string {
  return crypto.randomUUID();
}

/** Get current ISO timestamp for D1. */
export function now(): string {
  return new Date().toISOString();
}
