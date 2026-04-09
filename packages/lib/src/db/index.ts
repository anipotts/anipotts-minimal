export { getDB, setDB } from "./client";
export type { D1Database, D1PreparedStatement, D1Result } from "./types";
export { getDrizzle } from "./drizzle";
export type { DB } from "./drizzle";
export * as schema from "./schema";
export {
  parseJsonArray,
  toJsonArray,
  parseJson,
  toJson,
  uuid,
  now,
} from "./helpers";

// Re-export commonly used Drizzle operators so consumers don't need drizzle-orm directly
export { eq, and, or, desc, asc, sql, lt, inArray } from "drizzle-orm";
