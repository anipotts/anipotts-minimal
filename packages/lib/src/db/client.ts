/**
 * D1 database accessor.
 *
 * Cloudflare bindings are framework-local. Astro pages call setDB() from their
 * request runtime before shared content helpers run. In local scripts and tests,
 * callers may also inject a D1-compatible object with setDB().
 */

import type { D1Database } from "./types";

/** Manual override for testing or custom setups. */
let _override: D1Database | null = null;

/** Set a D1 database instance directly (for testing or manual wiring). */
export function setDB(db: D1Database): void {
  _override = db;
}

/**
 * Get the D1 database instance.
 *
 * Resolution order:
 * 1. Manual override (setDB)
 * 2. null (D1 unavailable)
 */
export function getDB(): D1Database | null {
  if (_override) return _override;
  return null;
}
