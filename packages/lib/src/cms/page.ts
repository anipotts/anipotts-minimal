import type { PageContent } from "@anipotts/types";
import { and, desc, eq, like } from "drizzle-orm";
import { getDrizzle, parseJson } from "../db";
import * as s from "../db/schema";
import { logger } from "../logger";

export async function fetchPageContent<T = unknown>(
  pageKey: string,
): Promise<PageContent<T> | null> {
  const db = getDrizzle();
  if (db) {
    try {
      const rows = await db
        .select()
        .from(s.pageContent)
        .where(
          and(
            eq(s.pageContent.page_key, pageKey),
            eq(s.pageContent.published, true),
          ),
        )
        .orderBy(desc(s.pageContent.version))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      return {
        id: row.id,
        page_key: row.page_key,
        content: parseJson<T>(row.content) as T,
        version: row.version ?? 1,
        published: row.published ?? false,
        updated_at: row.updated_at ?? "",
        updated_by: row.updated_by ?? null,
        created_at: row.created_at ?? "",
      };
    } catch (err) {
      logger.error("cms", `D1 fetchPageContent("${pageKey}") failed`, {
        error: String(err),
      });
      return null;
    }
  }

  return null;
}

export async function fetchPublishedPageContentByPrefix<T = unknown>(
  pageKeyPrefix: string,
): Promise<PageContent<T>[]> {
  const db = getDrizzle();
  if (!db) return [];

  try {
    const rows = await db
      .select()
      .from(s.pageContent)
      .where(
        and(
          like(s.pageContent.page_key, `${pageKeyPrefix}%`),
          eq(s.pageContent.published, true),
        ),
      )
      .orderBy(desc(s.pageContent.version));
    const latestByKey = new Map<string, PageContent<T>>();

    for (const row of rows) {
      if (latestByKey.has(row.page_key)) continue;
      latestByKey.set(row.page_key, {
        id: row.id,
        page_key: row.page_key,
        content: parseJson<T>(row.content) as T,
        version: row.version ?? 1,
        published: row.published ?? false,
        updated_at: row.updated_at ?? "",
        updated_by: row.updated_by ?? null,
        created_at: row.created_at ?? "",
      });
    }

    return [...latestByKey.values()];
  } catch (err) {
    logger.error(
      "cms",
      `D1 fetchPublishedPageContentByPrefix("${pageKeyPrefix}") failed`,
      { error: String(err) },
    );
    return [];
  }
}
