import { Suspense } from "react";
import { getDrizzle, parseJsonArray, schema, desc } from "@anipotts/lib/db";
import Link from "next/link";
import PipelineFilters from "./pipeline-filters";
import PipelineBoard from "./pipeline-board";
import type { BoardItem } from "./pipeline-board";
import { SERIES_COLORS, STATUS_COLORS, PLATFORM_ABBREV } from "@/lib/constants";

interface WritingPipelineItem {
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

async function getWritingPipelineItems(): Promise<WritingPipelineItem[]> {
  const db = getDrizzle();
  if (!db) return [];

  const thoughtRows = await db
    .select()
    .from(schema.thoughts)
    .orderBy(desc(schema.thoughts.updated_at));

  if (thoughtRows.length === 0) return [];

  // Get atom counts per thought using raw count query
  const thoughtIds = thoughtRows.map((t) => t.id);
  const placeholders = thoughtIds.map(() => "?").join(", ");

  // Use the raw D1 for the IN query since Drizzle's inArray requires importing
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

  return thoughtRows.map((t) => ({
    id: t.id,
    title: t.title,
    slug: t.slug,
    summary: t.summary ?? "",
    content: t.content ?? "",
    status: t.status ?? "draft",
    series_type: t.series_type ?? null,
    content_type: t.content_type ?? null,
    published: t.published ?? false,
    views: t.views ?? 0,
    tags: parseJsonArray(t.tags),
    platforms_posted: parseJsonArray(t.platforms_posted),
    created_at: t.created_at ?? "",
    updated_at: t.updated_at ?? t.created_at ?? "",
    published_at: t.published_at ?? null,
    artifact_url: t.artifact_url ?? null,
    artifact_type: t.artifact_type ?? null,
    atom_count: countMap.get(t.id) || 0,
  }));
}

export const dynamic = "force-dynamic";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    series?: string;
    q?: string;
    sort?: string;
    view?: string;
  }>;
}) {
  const writingItems = await getWritingPipelineItems();
  const params = await searchParams;
  const statusFilter = params.status || "all";
  const seriesFilter = params.series || "all";
  const searchQuery = (params.q || "").toLowerCase();
  const sortBy = params.sort || "updated";
  const currentView = params.view || "list";

  const filtered = writingItems
    .filter((t: WritingPipelineItem) => {
      if (statusFilter !== "all" && (t.status || "draft") !== statusFilter)
        return false;
      if (seriesFilter !== "all" && t.series_type !== seriesFilter)
        return false;
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery))
        return false;
      return true;
    })
    .sort((a: WritingPipelineItem, b: WritingPipelineItem) => {
      switch (sortBy) {
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

  const statusCounts: Record<string, number> = {};
  for (const t of writingItems) {
    const s = t.status || "draft";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 border-b border-zinc-800/60 px-6 py-3 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-[13px] font-medium text-zinc-200">Pipeline</h2>
          <span className="text-[11px] text-zinc-600">
            {filtered.length} of {writingItems.length}
          </span>
        </div>
      </div>

      <div className="shrink-0 px-6 py-2.5 border-b border-zinc-800/40">
        <Suspense fallback={<div className="h-8" />}>
          <PipelineFilters
            currentStatus={statusFilter}
            currentSeries={seriesFilter}
            currentView={currentView}
            statusCounts={statusCounts}
          />
        </Suspense>
      </div>

      {currentView === "board" ? (
        <div className="flex-1 overflow-hidden">
          <PipelineBoard
            items={filtered.map(
              (t: WritingPipelineItem): BoardItem => ({
                id: t.id,
                title: t.title,
                status: t.status || "draft",
                series_type: t.series_type,
                atom_count: t.atom_count,
                platforms_posted: t.platforms_posted ?? [],
                updated_at: t.updated_at || t.created_at,
              }),
            )}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto admin-scroll">
          {filtered.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-zinc-600 text-[12px]">
                No content matches your filters
              </p>
            </div>
          )}

          {filtered.map((thought: WritingPipelineItem) => {
            const status = thought.status || "draft";
            const date = new Date(
              thought.updated_at || thought.created_at,
            ).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            const postedPlatforms = thought.platforms_posted as string[] | null;

            return (
              <Link
                key={thought.id}
                href={`/content/${thought.id}`}
                className="admin-row"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] text-zinc-200 truncate block">
                    {thought.title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {thought.atom_count > 0 && (
                    <span className="text-[10px] text-zinc-600 tabular-nums">
                      {thought.atom_count}a
                    </span>
                  )}
                  {postedPlatforms && postedPlatforms.length > 0 && (
                    <span className="flex items-center gap-0.5">
                      {postedPlatforms.map((p) => (
                        <span
                          key={p}
                          className="admin-badge bg-green-500/10 text-green-400"
                        >
                          {PLATFORM_ABBREV[p] || p}
                        </span>
                      ))}
                    </span>
                  )}
                  {thought.series_type && (
                    <span
                      className={`admin-badge ${SERIES_COLORS[thought.series_type as keyof typeof SERIES_COLORS] || ""}`}
                    >
                      {thought.series_type}
                    </span>
                  )}
                  <span
                    className={`admin-badge ${STATUS_COLORS[status] || STATUS_COLORS.draft}`}
                  >
                    {status}
                  </span>
                  <span className="text-[10px] text-zinc-600 w-11 text-right tabular-nums">
                    {date}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
