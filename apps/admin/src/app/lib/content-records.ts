import { getDB } from "@anipotts/lib/db";

const THOUGHT_COLUMNS = new Set([
  "title",
  "slug",
  "content",
  "summary",
  "series_type",
  "content_type",
  "status",
  "published",
  "published_at",
  "tags",
  "platforms_posted",
  "voice_mode",
  "updated_at",
  "views",
  "buttondown_email_id",
  "typefully_x_draft_id",
  "typefully_linkedin_draft_id",
]);

const ATOM_COLUMNS = new Set([
  "content_id",
  "platform",
  "atom_content",
  "voice_mode",
  "hashtags",
  "status",
  "scheduled_at",
  "posted_at",
  "external_url",
  "typefully_draft_id",
  "updated_at",
]);

export async function getThoughtById(id: string, columns = "*") {
  const db = getDB();
  if (db) {
    return db
      .prepare(`SELECT ${columns} FROM thoughts WHERE id = ?`)
      .bind(id)
      .first<Record<string, unknown>>();
  }
  return null;
}

export async function updateThought(
  id: string,
  fields: Record<string, unknown>,
): Promise<{ error?: string }> {
  const db = getDB();
  if (db) {
    const safe = Object.keys(fields).filter((key) => THOUGHT_COLUMNS.has(key));
    if (safe.length === 0) return { error: "No valid columns" };
    const sets = safe.map((key) => `${key} = ?`).join(", ");
    const vals = safe.map((key) => fields[key]);
    await db
      .prepare(`UPDATE thoughts SET ${sets} WHERE id = ?`)
      .bind(...vals, id)
      .run();
    return {};
  }
  return { error: "Database not configured" };
}

export async function getAtomById(id: string) {
  const db = getDB();
  if (db) {
    return db
      .prepare("SELECT * FROM atoms WHERE id = ?")
      .bind(id)
      .first<Record<string, unknown>>();
  }
  return null;
}

export async function updateAtomFields(
  id: string,
  fields: Record<string, unknown>,
): Promise<{ error?: string }> {
  const db = getDB();
  if (db) {
    const safe = Object.keys(fields).filter((key) => ATOM_COLUMNS.has(key));
    if (safe.length === 0) return { error: "No valid columns" };
    const sets = safe.map((key) => `${key} = ?`).join(", ");
    const vals = safe.map((key) => fields[key]);
    await db
      .prepare(`UPDATE atoms SET ${sets} WHERE id = ?`)
      .bind(...vals, id)
      .run();
    return {};
  }
  return { error: "Database not configured" };
}
