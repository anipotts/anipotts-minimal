/**
 * Query helpers for atoms (platform-specific posts).
 * Uses Drizzle ORM for typed D1 queries.
 */

import type { Atom } from "@anipotts/types";
import type { QueryOptions } from "./thoughts";
import { eq, desc } from "drizzle-orm";
import { logger } from "../logger";
import { getDrizzle, parseJsonArray, toJsonArray, uuid, now } from "../db";
import * as s from "../db/schema";

/** Fetch all atoms, ordered by newest first. */
export async function fetchAllAtoms(_options?: QueryOptions) {
  const db = getDrizzle();
  if (!db) return [];

  try {
    // Note: atoms table doesn't have a "section" column per the schema.
    // The original code tried to filter by section but that column doesn't exist on atoms.
    // Keeping the interface for API compatibility but only filtering if the column existed.
    const results = await db
      .select()
      .from(s.atoms)
      .orderBy(desc(s.atoms.created_at));

    return results.map((row) => ({
      ...row,
      hashtags: parseJsonArray(row.hashtags),
    }));
  } catch (err) {
    logger.error("admin", "D1 fetchAllAtoms failed", { error: String(err) });
    return [];
  }
}

/** Fetch atoms for a specific content piece. */
export async function fetchAtomsByContent(
  contentId: string,
  _options?: QueryOptions,
) {
  const db = getDrizzle();
  if (!db) return [];

  try {
    const results = await db
      .select()
      .from(s.atoms)
      .where(eq(s.atoms.content_id, contentId))
      .orderBy(desc(s.atoms.created_at));

    return results.map((row) => ({
      ...row,
      hashtags: parseJsonArray(row.hashtags),
    }));
  } catch (err) {
    logger.error("admin", "D1 fetchAtomsByContent failed", {
      error: String(err),
    });
    return [];
  }
}

/** Create or update an atom record. Returns the saved record. */
export async function upsertAtomRecord(atom: Partial<Atom>) {
  const db = getDrizzle();
  if (!db) throw new Error("Database not configured");

  const id = atom.id || uuid();
  const ts = now();

  const record = {
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

  await db
    .insert(s.atoms)
    .values(record)
    .onConflictDoUpdate({
      target: s.atoms.id,
      set: {
        content_id: record.content_id,
        platform: record.platform,
        atom_content: record.atom_content,
        voice_mode: record.voice_mode,
        hashtags: record.hashtags,
        status: record.status,
        typefully_draft_id: record.typefully_draft_id,
        scheduled_at: record.scheduled_at,
        posted_at: record.posted_at,
        external_url: record.external_url,
        updated_at: record.updated_at,
      },
    });

  return {
    ...record,
    hashtags: parseJsonArray(record.hashtags),
  };
}

/** Delete an atom by ID. */
export async function deleteAtomRecord(id: string) {
  const db = getDrizzle();
  if (!db) throw new Error("Database not configured");

  await db.delete(s.atoms).where(eq(s.atoms.id, id));
}
