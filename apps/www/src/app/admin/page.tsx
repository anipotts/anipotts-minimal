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
  searchParams: Promise<{
    status?: string;
    series?: string;
    q?: string;
    sort?: string;
  }>;
}) {
  const thoughts = await getThoughtsWithAtomCounts();
  const params = await searchParams;
  const statusFilter = params.status || "all";
  const seriesFilter = params.series || "all";
  const searchQuery = (params.q || "").toLowerCase();
  const sortBy = params.sort || "updated";

  const filtered = thoughts
    .filter((t: ThoughtWithCount) => {
      if (statusFilter !== "all" && (t.status || "draft") !== statusFilter)
        return false;
      if (seriesFilter !== "all" && t.series_type !== seriesFilter)
        return false;
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery))
        return false;
      return true;
    })
    .sort((a: ThoughtWithCount, b: ThoughtWithCount) => {
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
  for (const t of thoughts) {
    const s = t.status || "draft";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 border-b border-zinc-800/60 px-6 py-3 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-[13px] font-medium text-zinc-200">Pipeline</h2>
          <span className="text-[11px] text-zinc-600">
            {filtered.length} of {thoughts.length}
          </span>
        </div>
        <SyncButton />
      </div>

      <div className="shrink-0 px-6 py-2.5 border-b border-zinc-800/40">
        <PipelineFilters
          currentStatus={statusFilter}
          currentSeries={seriesFilter}
          statusCounts={statusCounts}
        />
      </div>

      <div className="flex-1 overflow-y-auto admin-scroll">
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-600 text-[12px]">
              No content matches your filters
            </p>
          </div>
        )}

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
                    className={`admin-badge ${SERIES_COLORS[thought.series_type] || ""}`}
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
    </div>
  );
}
