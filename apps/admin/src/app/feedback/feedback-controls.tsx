"use client";

import {
  STATUS_FILTERS,
  TYPE_FILTERS,
  type StatusFilter,
  type TypeFilter,
} from "./feedback-model";

export function FeedbackFilters({
  typeFilter,
  statusFilter,
  issueCount,
  loading,
  onTypeFilter,
  onStatusFilter,
}: {
  typeFilter: TypeFilter;
  statusFilter: StatusFilter;
  issueCount: number;
  loading: boolean;
  onTypeFilter: (type: TypeFilter) => void;
  onStatusFilter: (status: StatusFilter) => void;
}) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-zinc-600 uppercase tracking-wide">
          Type:
        </span>
        {TYPE_FILTERS.map((type) => (
          <button
            key={type}
            onClick={() => onTypeFilter(type)}
            className={`admin-pill px-2 py-0.5 rounded text-[10px] transition-colors ${
              typeFilter === type
                ? "bg-zinc-700/50 text-zinc-200"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {type}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-zinc-600 uppercase tracking-wide">
          Status:
        </span>
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => onStatusFilter(status)}
            className={`admin-pill px-2 py-0.5 rounded text-[10px] transition-colors ${
              statusFilter === status
                ? "bg-zinc-700/50 text-zinc-200"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {status}
          </button>
        ))}
      </div>
      <span className="text-[10px] text-zinc-600 ml-auto">
        {issueCount} issue{issueCount !== 1 ? "s" : ""}
        {loading && " (loading...)"}
      </span>
    </div>
  );
}

export function FeedbackError({ error }: { error: string }) {
  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
      <p className="text-[11px] text-red-400">{error}</p>
    </div>
  );
}

export function FeedbackPagination({
  page,
  hasMore,
  loading,
  onPrevious,
  onNext,
}: {
  page: number;
  hasMore: boolean;
  loading: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      <button
        onClick={onPrevious}
        disabled={page <= 1 || loading}
        className="px-3 py-1.5 rounded text-[11px] font-medium bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 disabled:opacity-30 transition-colors"
      >
        Previous
      </button>
      <span className="text-[10px] text-zinc-600">Page {page}</span>
      <button
        onClick={onNext}
        disabled={!hasMore || loading}
        className="px-3 py-1.5 rounded text-[11px] font-medium bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 disabled:opacity-30 transition-colors"
      >
        Next
      </button>
    </div>
  );
}
