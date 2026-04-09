/**
 * Query helpers for atoms (platform-specific posts).
 * D1-only.
 */

import type { Atom } from "@anipotts/types";
import type { QueryOptions } from "./thoughts";
import { logger } from "../logger";
import { getDB, parseJsonArray, toJsonArray, uuid, now } from "../db";

/** Deserialize a D1 row into an Atom-like object. */
function deserializeAtom(
  row: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...row,
    hashtags: parseJsonArray(row.hashtags),
  };
}

/** Fetch all atoms, ordered by newest first. */
export async function fetchAllAtoms(options?: QueryOptions) {
  const db = getDB();
  if (!db) return [];

  try {
    let sql = "SELECT * FROM atoms";
    const params: unknown[] = [];
    if (options?.subdomain) {
      sql += " WHERE section = ?";
      params.push(options.subdomain);
    }
    sql += " ORDER BY created_at DESC";

    const stmt = db.prepare(sql);
    const { results } = await (
      params.length > 0 ? stmt.bind(...params) : stmt
    ).all<Record<string, unknown>>();
    return (results ?? []).map(deserializeAtom);
  } catch (err) {
    logger.error("admin", "D1 fetchAllAtoms failed", { error: String(err) });
    return [];
  }
}

/** Fetch atoms for a specific content piece. */
export async function fetchAtomsByContent(
  contentId: string,
  options?: QueryOptions,
) {
  const db = getDB();
  if (!db) return [];

  try {
    let sql = "SELECT * FROM atoms WHERE content_id = ?";
    const params: unknown[] = [contentId];
    if (options?.subdomain) {
      sql += " AND section = ?";
      params.push(options.subdomain);
    }
    sql += " ORDER BY created_at DESC";

    const { results } = await db
      .prepare(sql)
      .bind(...params)
      .all<Record<string, unknown>>();
    return (results ?? []).map(deserializeAtom);
  } catch (err) {
    logger.error("admin", "D1 fetchAtomsByContent failed", {
      error: String(err),
    });
    return [];
  }
}

/** Create or update an atom record. Returns the saved record. */
export async function upsertAtomRecord(atom: Partial<Atom>) {
  const db = getDB();
  if (!db) throw new Error("Database not configured");

  const id = atom.id || uuid();
  const ts = now();

  const record: Record<string, unknown> = {
    id,
    content_id: atom.content_id ?? null,
    platform: atom.platform ?? "",
    atom_content: atom.atom_content ?? "",
    voice_mode: atom.voice_mode ?? null,
    hashtags: toJsonArray(atom.hashtags),
    status: atom.status ?? "draft",
    typefully_draft_id: atom.typefully_draft_id ?? null,
    scheduled_at: atom.scheduled_at ?? null,
    posted_at: atom.posted_at ?? null,
    external_url: atom.external_url ?? null,
    created_at: atom.created_at ?? ts,
    updated_at: ts,
  };

  const cols = Object.keys(record);
  const placeholders = cols.map(() => "?").join(", ");
  const sql = `INSERT OR REPLACE INTO atoms (${cols.join(", ")}) VALUES (${placeholders})`;

  await db
    .prepare(sql)
    .bind(...Object.values(record))
    .run();
  return deserializeAtom(record);
}

/** Delete an atom by ID. */
export async function deleteAtomRecord(id: string) {
  const db = getDB();
  if (!db) throw new Error("Database not configured");

  await db.prepare("DELETE FROM atoms WHERE id = ?").bind(id).run();
}
