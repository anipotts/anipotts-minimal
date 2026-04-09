/**
 * Drizzle ORM client for Cloudflare D1.
 *
 * Wraps the existing D1 binding from getDB() with Drizzle's typed query builder.
 * Returns null when D1 is not available (e.g. local dev without Workers).
 */

import { drizzle } from "drizzle-orm/d1";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";
import { getDB } from "./client";

export type DB = DrizzleD1Database<typeof schema>;

export function getDrizzle(): DB | null {
  const d1 = getDB();
  if (!d1) return null;
  // D1Database from our types.ts is compatible with Drizzle's expected D1Database
  return drizzle(d1 as Parameters<typeof drizzle>[0], { schema });
}
