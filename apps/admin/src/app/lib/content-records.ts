import { getDB, now, toJsonArray, uuid } from "@anipotts/lib/db";
import type { ContentStatus, ContentType, SeriesType } from "@anipotts/types";

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

const VALID_STATUSES: ContentStatus[] = [
  "idea",
  "draft",
  "ready",
  "atomized",
  "published",
];

const VALID_SERIES: SeriesType[] = [
  "tip",
  "news",
  "tutorial",
  "essay",
  "behind-the-scenes",
];

const VALID_CONTENT_TYPES: ContentType[] = [
  "video",
  "article",
  "thread",
  "tip",
];

type ThoughtContentFields = {
  title?: string;
  summary?: string;
  content?: string;
  tags?: string[];
};

function slugBase(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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

export async function createThoughtDraft(input: {
  title?: string | null;
  content?: string | null;
  seriesType?: string | null;
  contentType?: string | null;
}) {
  const title = input.title?.trim();
  const content = input.content?.trim();
  const seriesType = input.seriesType as SeriesType;
  const contentType = (input.contentType as ContentType) || "article";

  if (!title) return { error: "Title is required" };
  if (seriesType && !VALID_SERIES.includes(seriesType)) {
    return { error: "Invalid series type" };
  }
  if (!VALID_CONTENT_TYPES.includes(contentType)) {
    return { error: "Invalid content type" };
  }

  const slug = `${slugBase(title)}-${Date.now().toString(36)}`;
  const id = uuid();
  const ts = now();

  const db = getDB();
  if (!db) return { error: "Database not configured" };

  await db
    .prepare(
      `INSERT INTO thoughts (id, title, slug, content, summary, series_type, content_type, status, published, tags, views, created_at, updated_at)
       VALUES (?, ?, ?, ?, '', ?, ?, 'draft', 0, '[]', 0, ?, ?)`,
    )
    .bind(
      id,
      title,
      slug,
      content || "",
      seriesType || null,
      contentType,
      ts,
      ts,
    )
    .run();
  return { success: true, id };
}

export async function updateThoughtStatus(id: string, status: ContentStatus) {
  if (!VALID_STATUSES.includes(status)) return { error: "Invalid status" };

  const update: Record<string, string> = {
    status,
    updated_at: now(),
  };
  if (status === "published") {
    update.published_at = now();
  }

  const result = await updateThought(id, update);
  if (result.error) return { error: result.error };
  return { success: true };
}

export async function updateThoughtContentFields(
  id: string,
  fields: ThoughtContentFields,
) {
  const update: Record<string, unknown> = { updated_at: now() };
  if (fields.title !== undefined) {
    if (!fields.title.trim()) return { error: "Title cannot be empty" };
    update.title = fields.title;
  }
  if (fields.summary !== undefined) {
    if (typeof fields.summary !== "string") return { error: "Invalid summary" };
    update.summary = fields.summary;
  }
  if (fields.content !== undefined) {
    if (typeof fields.content !== "string") return { error: "Invalid content" };
    update.content = fields.content;
  }

  const db = getDB();
  if (fields.tags !== undefined) {
    update.tags = db ? toJsonArray(fields.tags) : fields.tags;
  }

  const result = await updateThought(id, update);
  if (result.error) return { error: result.error };
  return { success: true };
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
