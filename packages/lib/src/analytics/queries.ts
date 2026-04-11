import { sql } from "drizzle-orm";
import { getDrizzle } from "../db/drizzle";
import { thoughts } from "../db/schema";
import type { PipelineVelocityRow, SeriesPerformanceRow } from "./types";

/**
 * Pipeline velocity: count of thoughts per (week, status).
 * Uses SQLite strftime for ISO week grouping.
 */
export async function getPipelineVelocity(): Promise<PipelineVelocityRow[]> {
  const db = getDrizzle();
  if (!db) return [];

  const rows = await db
    .select({
      week: sql<string>`strftime('%Y-W%W', ${thoughts.created_at})`.as("week"),
      status: sql<string>`coalesce(${thoughts.status}, 'draft')`.as("status"),
      count: sql<number>`count(*)`.as("count"),
    })
    .from(thoughts)
    .groupBy(
      sql`strftime('%Y-W%W', ${thoughts.created_at})`,
      sql`coalesce(${thoughts.status}, 'draft')`,
    )
    .orderBy(sql`week DESC`);

  return rows.map((r) => ({
    week: r.week ?? "",
    status: r.status ?? "draft",
    count: Number(r.count),
  }));
}

/**
 * Series performance: count + total views per series_type.
 * Only includes rows where series_type is not null.
 */
export async function getSeriesPerformance(): Promise<SeriesPerformanceRow[]> {
  const db = getDrizzle();
  if (!db) return [];

  const rows = await db
    .select({
      series_type: thoughts.series_type,
      count: sql<number>`count(*)`.as("count"),
      total_views: sql<number>`coalesce(sum(${thoughts.views}), 0)`.as(
        "total_views",
      ),
    })
    .from(thoughts)
    .where(sql`${thoughts.series_type} IS NOT NULL`)
    .groupBy(thoughts.series_type)
    .orderBy(sql`count DESC`);

  return rows.map((r) => ({
    series_type: r.series_type ?? "",
    count: Number(r.count),
    total_views: Number(r.total_views),
  }));
}
