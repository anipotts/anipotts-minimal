/**
 * Query helpers for atoms (platform-specific posts).
 * D1-first with Supabase fallback for backward compatibility.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
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
export async function fetchAllAtoms(
  supabase: SupabaseClient,
  options?: QueryOptions,
) {
  const db = getDB();
  if (db) {
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

  let query = supabase
    .from("atoms")
    .select("*")
    .order("created_at", { ascending: false });

  if (options?.subdomain) {
    query = query.eq("subdomain", options.subdomain);
  }

  const { data, error } = await query;
  if (error) {
    logger.error("admin", "Error fetching atoms", { error: String(error) });
    return [];
  }
  return data;
}

/** Fetch atoms for a specific content piece. */
export async function fetchAtomsByContent(
  supabase: SupabaseClient,
  contentId: string,
  options?: QueryOptions,
) {
  const db = getDB();
  if (db) {
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

  let query = supabase
    .from("atoms")
    .select("*")
    .eq("content_id", contentId)
    .order("created_at", { ascending: false });

  if (options?.subdomain) {
    query = query.eq("subdomain", options.subdomain);
  }

  const { data, error } = await query;
  if (error) {
    logger.error("admin", "Error fetching atoms", { error: String(error) });
    return [];
  }
  return data;
}

/** Create or update an atom record. Returns the saved record. */
export async function upsertAtomRecord(
  supabase: SupabaseClient,
  atom: Partial<Atom>,
) {
  const db = getDB();
  if (db) {
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

  const { data, error } = await supabase
    .from("atoms")
    .upsert([atom], { onConflict: "id" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Delete an atom by ID. */
export async function deleteAtomRecord(supabase: SupabaseClient, id: string) {
  const db = getDB();
  if (db) {
    await db.prepare("DELETE FROM atoms WHERE id = ?").bind(id).run();
    return;
  }

  const { error } = await supabase.from("atoms").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
