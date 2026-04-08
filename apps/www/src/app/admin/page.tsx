import { createServerClient } from "@anipotts/lib";
import type { Database } from "@anipotts/types";

type ThoughtRow = Database["public"]["Tables"]["thoughts"]["Row"];
type ThoughtWithCount = ThoughtRow & { atom_count: number };
import Link from "next/link";
import PipelineFilters from "./pipeline-filters";
import SyncButton from "./sync-button";
import { SERIES_COLORS, STATUS_COLORS, PLATFORM_ABBREV } from "@/lib/constants";

async function getThoughtsWithAtomCounts() {
  const supabase = createServerClient();
  if (!supabase) return [];

  const { data: thoughts, error } = await supabase
    .from("thoughts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error || !thoughts) return [];

  const thoughtIds = thoughts.map((t) => t.id);
  const { data: atomCounts } = await supabase
    .from("atoms")
    .select("content_id")
    .in("content_id", thoughtIds);

  const countMap = new Map<string, number>();
  if (atomCounts) {
    for (const atom of atomCounts) {
      countMap.set(atom.content_id, (countMap.get(atom.content_id) || 0) + 1);
    }
  }

  return thoughts.map((t) => ({
    ...t,
    atom_count: countMap.get(t.id) || 0,
  }));
}

export const dynamic = "force-dynamic";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; series?: string; q?: string }>;
}) {
  const thoughts = await getThoughtsWithAtomCounts();
  const params = await searchParams;
  const statusFilter = params.status || "all";
  const seriesFilter = params.series || "all";
  const searchQuery = (params.q || "").toLowerCase();

  const filtered = thoughts.filter((t: ThoughtWithCount) => {
    if (statusFilter !== "all" && (t.status || "draft") !== statusFilter)
      return false;
    if (seriesFilter !== "all" && t.series_type !== seriesFilter) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery))
      return false;
    return true;
  });

  const statusCounts: Record<string, number> = {};
  for (const t of thoughts) {
    const s = t.status || "draft";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold">Pipeline</h2>
          <span className="text-xs text-zinc-500">
            {filtered.length} of {thoughts.length}
          </span>
        </div>
        <SyncButton />
      </div>

      {/* Filters */}
      <div className="shrink-0 px-6 py-2 border-b border-zinc-800/50">
        <PipelineFilters
          currentStatus={statusFilter}
          currentSeries={seriesFilter}
          statusCounts={statusCounts}
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto admin-scroll">
        {filtered.length === 0 && (
          <p className="text-zinc-500 text-center py-12 text-sm">
            No content found
          </p>
        )}

        <div className="divide-y divide-zinc-800/50">
          {filtered.map((thought: ThoughtWithCount) => {
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
                className="flex items-center gap-4 px-6 py-3 hover:bg-zinc-900/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-100 truncate">
                      {thought.title}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {thought.atom_count > 0 && (
                    <span className="text-[11px] text-zinc-500">
                      {thought.atom_count}a
                    </span>
                  )}
                  {postedPlatforms && postedPlatforms.length > 0 && (
                    <span className="flex items-center gap-0.5">
                      {postedPlatforms.map((p) => (
                        <span
                          key={p}
                          className="text-[10px] px-1 py-0.5 bg-green-500/10 text-green-400 rounded"
                        >
                          {PLATFORM_ABBREV[p] || p}
                        </span>
                      ))}
                    </span>
                  )}
                  {thought.series_type && (
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded ${SERIES_COLORS[thought.series_type] || ""}`}
                    >
                      {thought.series_type}
                    </span>
                  )}
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded ${STATUS_COLORS[status] || STATUS_COLORS.draft}`}
                  >
                    {status}
                  </span>
                  <span className="text-[11px] text-zinc-600 w-12 text-right">
                    {date}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
