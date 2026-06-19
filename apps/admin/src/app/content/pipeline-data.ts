import { getDrizzle, parseJsonArray, schema, desc } from "@anipotts/lib/db";
import type { BoardItem } from "./pipeline-board";

export interface WritingPipelineItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  status: string;
  series_type: string | null;
  content_type: string | null;
  published: boolean;
  views: number;
  tags: string[];
  platforms_posted: string[];
  created_at: string;
  updated_at: string;
  published_at: string | null;
  artifact_url: string | null;
  artifact_type: string | null;
  atom_count: number;
}

export interface PipelineFilters {
  status: string;
  series: string;
  q: string;
  sort: string;
}

export async function getWritingPipelineItems(): Promise<
  WritingPipelineItem[]
> {
  const db = getDrizzle();
  if (!db) return [];

  const thoughtRows = await db
    .select()
    .from(schema.thoughts)
    .orderBy(desc(schema.thoughts.updated_at));

  if (thoughtRows.length === 0) return [];

  const thoughtIds = thoughtRows.map((thought) => thought.id);
  const placeholders = thoughtIds.map(() => "?").join(", ");
  const { getDB } = await import("@anipotts/lib/db");
  const d1 = getDB();
  const countMap = new Map<string, number>();

  if (d1) {
    const { results: atomRows } = await d1
      .prepare(
        `SELECT content_id FROM atoms WHERE content_id IN (${placeholders})`,
      )
      .bind(...thoughtIds)
      .all<{ content_id: string }>();

    if (atomRows) {
      for (const atom of atomRows) {
        countMap.set(atom.content_id, (countMap.get(atom.content_id) || 0) + 1);
      }
    }
  }

  return thoughtRows.map((thought) => ({
    id: thought.id,
    title: thought.title,
    slug: thought.slug,
    summary: thought.summary ?? "",
    content: thought.content ?? "",
    status: thought.status ?? "draft",
    series_type: thought.series_type ?? null,
    content_type: thought.content_type ?? null,
    published: thought.published ?? false,
    views: thought.views ?? 0,
    tags: parseJsonArray(thought.tags),
    platforms_posted: parseJsonArray(thought.platforms_posted),
    created_at: thought.created_at ?? "",
    updated_at: thought.updated_at ?? thought.created_at ?? "",
    published_at: thought.published_at ?? null,
    artifact_url: thought.artifact_url ?? null,
    artifact_type: thought.artifact_type ?? null,
    atom_count: countMap.get(thought.id) || 0,
  }));
}

export function filterWritingPipelineItems(
  items: WritingPipelineItem[],
  filters: PipelineFilters,
) {
  const searchQuery = filters.q.toLowerCase();

  return items
    .filter((item) => {
      if (
        filters.status !== "all" &&
        (item.status || "draft") !== filters.status
      ) {
        return false;
      }
      if (filters.series !== "all" && item.series_type !== filters.series) {
        return false;
      }
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (filters.sort) {
        case "created":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "views":
          return (b.views || 0) - (a.views || 0);
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return (
            new Date(b.updated_at || b.created_at).getTime() -
            new Date(a.updated_at || a.created_at).getTime()
          );
      }
    });
}

export function getStatusCounts(items: WritingPipelineItem[]) {
  const statusCounts: Record<string, number> = {};
  for (const item of items) {
    const status = item.status || "draft";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  }
  return statusCounts;
}

export function toBoardItem(item: WritingPipelineItem): BoardItem {
  return {
    id: item.id,
    title: item.title,
    status: item.status || "draft",
    series_type: item.series_type,
    atom_count: item.atom_count,
    platforms_posted: item.platforms_posted ?? [],
    updated_at: item.updated_at || item.created_at,
  };
}
