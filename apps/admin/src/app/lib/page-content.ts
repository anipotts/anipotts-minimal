import { getDB, now, uuid } from "@anipotts/lib/db";

export async function savePageContent<T>(
  pageKey: string,
  content: T,
): Promise<
  | { success: true; updatedAt: string; version: number; content: T }
  | { error: string }
> {
  const db = getDB();
  if (!db) return { error: "Database not configured" };

  const ts = now();
  try {
    const existing = await db
      .prepare(
        `SELECT id, version
         FROM page_content
         WHERE page_key = ? AND published = 1
         ORDER BY version DESC
         LIMIT 1`,
      )
      .bind(pageKey)
      .first<{ id: string; version: number | null }>();

    const id = existing?.id ?? uuid();
    const version = (existing?.version ?? 0) + 1;
    const contentJson = JSON.stringify(content);

    if (existing) {
      await db
        .prepare(
          `UPDATE page_content
           SET content = ?, version = ?, published = 1, updated_at = ?, updated_by = ?
           WHERE id = ?`,
        )
        .bind(contentJson, version, ts, "admin", id)
        .run();
    } else {
      await db
        .prepare(
          `INSERT INTO page_content
           (id, page_key, content, version, published, updated_at, updated_by, created_at, version_history)
           VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)`,
        )
        .bind(id, pageKey, contentJson, version, ts, "admin", ts, "[]")
        .run();
    }

    await db
      .prepare(
        "UPDATE page_content SET published = 0 WHERE page_key = ? AND id <> ?",
      )
      .bind(pageKey, id)
      .run();

    return { success: true, updatedAt: ts, version, content };
  } catch (error) {
    return { error: `D1 save failed: ${String(error)}` };
  }
}
