import { createServerClient } from "@anipotts/lib";
import type { Thought } from "@anipotts/types";
import Link from "next/link";
import PipelineFilters from "./pipeline-filters";
import ApproveButton from "./approve-button";
import { SERIES_COLORS } from "@/lib/constants";

const STATUS_COLORS: Record<string, string> = {
  idea: "bg-zinc-700 text-zinc-300",
  draft: "bg-yellow-500/20 text-yellow-400",
  ready: "bg-blue-500/20 text-blue-400",
  atomized: "bg-purple-500/20 text-purple-400",
  published: "bg-green-500/20 text-green-400",
};

async function getThoughtsWithAtomCounts() {
  const supabase = createServerClient();
  if (!supabase) return [];

  const { data: thoughts, error } = await supabase
    .from("thoughts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error || !thoughts) return [];

  const thoughtIds = thoughts.map((t: Thought) => t.id);
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

  return thoughts.map((t: Thought) => ({
    ...t,
    atom_count: countMap.get(t.id) || 0,
  }));
}

export const dynamic = "force-dynamic";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; series?: string }>;
}) {
  const thoughts = await getThoughtsWithAtomCounts();
  const params = await searchParams;
  const statusFilter = params.status || "all";
  const seriesFilter = params.series || "all";

  const filtered = thoughts.filter((t: Thought & { atom_count: number }) => {
    if (statusFilter !== "all" && (t.status || "draft") !== statusFilter)
      return false;
    if (seriesFilter !== "all" && t.series_type !== seriesFilter) return false;
    return true;
  });

  const statusCounts: Record<string, number> = {};
  for (const t of thoughts) {
    const s = (t as Thought).status || "draft";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pipeline</h2>
        <span className="text-sm text-zinc-500">{thoughts.length} total</span>
      </div>

      <PipelineFilters
        currentStatus={statusFilter}
        currentSeries={seriesFilter}
        statusCounts={statusCounts}
      />

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-zinc-500 text-center py-8">No content found</p>
        )}

        {filtered.map((thought: Thought & { atom_count: number }) => {
          const status = thought.status || "draft";
          const date = new Date(
            thought.updated_at || thought.created_at,
          ).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          return (
            <Link
              key={thought.id}
              href={`/admin/content/${thought.id}`}
              className="block bg-zinc-900 rounded-xl p-4 active:bg-zinc-800 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-zinc-100 truncate">
                    {thought.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[status] || STATUS_COLORS.draft}`}
                    >
                      {status}
                    </span>
                    {thought.series_type && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${SERIES_COLORS[thought.series_type] || ""}`}
                      >
                        {thought.series_type}
                      </span>
                    )}
                    {thought.atom_count > 0 && (
                      <span className="text-xs text-zinc-500">
                        {thought.atom_count} atom
                        {thought.atom_count !== 1 ? "s" : ""}
                      </span>
                    )}
                    <span className="text-xs text-zinc-600">{date}</span>
                  </div>
                </div>
                {status === "draft" && <ApproveButton id={thought.id} />}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
