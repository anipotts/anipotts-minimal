import { Suspense } from "react";
import PipelineFilters from "./pipeline-filters";
import PipelineBoard from "./pipeline-board";
import {
  filterWritingPipelineItems,
  getStatusCounts,
  getWritingPipelineItems,
  toBoardItem,
} from "./pipeline-data";
import { PipelineList } from "./pipeline-list";

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
  const searchQuery = params.q || "";
  const sortBy = params.sort || "updated";
  const currentView = params.view || "list";

  const filtered = filterWritingPipelineItems(writingItems, {
    status: statusFilter,
    series: seriesFilter,
    q: searchQuery,
    sort: sortBy,
  });
  const statusCounts = getStatusCounts(writingItems);

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
          <PipelineBoard items={filtered.map(toBoardItem)} />
        </div>
      ) : (
        <PipelineList items={filtered} />
      )}
    </div>
  );
}
