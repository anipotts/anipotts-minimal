/**
 * D1 database accessor.
 *
 * In production (CF Workers/Pages), the D1 binding comes from request context
 * via @opennextjs/cloudflare. In dev (next dev on Vercel), D1 is not available
 * and getDB() returns null, triggering Supabase fallback paths.
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
 * 2. CF Workers request context (getCloudflareContext)
 * 3. null (triggers Supabase fallback)
 */
export function getDB(): D1Database | null {
  if (_override) return _override;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    if (ctx?.env?.DB) return ctx.env.DB as D1Database;
  } catch {
    // Not in CF runtime (e.g. next dev on Vercel), fall through to Supabase
  }

  return null;
}
