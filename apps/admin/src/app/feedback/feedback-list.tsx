"use client";

import { useState, useCallback } from "react";
import type { QCFeedbackIssue } from "@anipotts/lib/quantercise";
import { getFeedback, updateFeedback } from "./actions";

type TypeFilter = "all" | "bug" | "feature" | "general";
type StatusFilter = "open" | "closed" | "reopened" | "all";

interface FeedbackListProps {
  initialFeedback: QCFeedbackIssue[];
  initialHasMore: boolean;
  slug: string;
}

export default function FeedbackList({
  initialFeedback,
  initialHasMore,
  slug,
}: FeedbackListProps) {
  const [feedback, setFeedback] = useState<QCFeedbackIssue[]>(initialFeedback);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());

  const fetchPage = useCallback(
    async (newPage: number, status: StatusFilter, type: TypeFilter) => {
      setLoading(true);
      setError(null);
      try {
        const result = await getFeedback(slug, {
          page: newPage,
          status: status === "all" ? undefined : status,
          type: type === "all" ? undefined : type,
        });
        if ("error" in result) return;
        setFeedback(result.data.feedback);
        setHasMore(result.meta.hasMore);
        setPage(newPage);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load feedback");
      } finally {
        setLoading(false);
      }
    },
    [slug],
  );

  const handleStatusFilter = (s: StatusFilter) => {
    setStatusFilter(s);
    fetchPage(1, s, typeFilter);
  };

  const handleTypeFilter = (t: TypeFilter) => {
    setTypeFilter(t);
    fetchPage(1, statusFilter, t);
  };

  const handleToggleState = async (issue: QCFeedbackIssue) => {
    const action = issue.state === "open" ? "close" : "reopen";
    const originalState = issue.state;

    // Optimistic update
    setFeedback((prev) =>
      prev.map((f) =>
        f.id === issue.id
          ? { ...f, state: action === "close" ? "closed" : "open" }
          : f,
      ),
    );
    setUpdatingIds((prev) => new Set([...prev, issue.id]));

    try {
      const result = await updateFeedback(slug, issue.number, action);
      if ("error" in result) {
        // Revert on error
        setFeedback((prev) =>
          prev.map((f) =>
            f.id === issue.id ? { ...f, state: originalState } : f,
          ),
        );
      }
    } catch {
      // Revert on error
      setFeedback((prev) =>
        prev.map((f) =>
          f.id === issue.id ? { ...f, state: originalState } : f,
        ),
      );
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(issue.id);
        return next;
      });
    }
  };

  const filtered = feedback.filter((f) => {
    if (typeFilter === "all") return true;
    return f.labels.some((l) => l.name.toLowerCase().includes(typeFilter));
  });

  const typeFilters: TypeFilter[] = ["all", "bug", "feature", "general"];
  const statusFilters: StatusFilter[] = ["all", "open", "closed", "reopened"];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-600 uppercase tracking-wide">
            Type:
          </span>
          {typeFilters.map((t) => (
            <button
              key={t}
              onClick={() => handleTypeFilter(t)}
              className={`admin-pill px-2 py-0.5 rounded text-[10px] transition-colors ${
                typeFilter === t
                  ? "bg-zinc-700/50 text-zinc-200"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-600 uppercase tracking-wide">
            Status:
          </span>
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusFilter(s)}
              className={`admin-pill px-2 py-0.5 rounded text-[10px] transition-colors ${
                statusFilter === s
                  ? "bg-zinc-700/50 text-zinc-200"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-zinc-600 ml-auto">
          {filtered.length} issue{filtered.length !== 1 ? "s" : ""}
          {loading && " (loading...)"}
        </span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-[11px] text-red-400">{error}</p>
        </div>
      )}

      {/* Issue Cards */}
      <div className="space-y-2">
        {filtered.map((issue) => {
          const isExpanded = expandedId === issue.id;
          const isUpdating = updatingIds.has(issue.id);

          return (
            <div
              key={issue.id}
              className="rounded-lg border border-zinc-800/60 bg-zinc-950/50"
            >
              {/* Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : issue.id)}
                className="w-full px-4 py-3 text-left flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        issue.state === "open"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-zinc-500/10 text-zinc-400"
                      }`}
                    >
                      {issue.state}
                    </span>
                    {issue.labels.map((label) => (
                      <span
                        key={label.name}
                        className="admin-badge inline-block px-1.5 py-0.5 rounded text-[9px] font-medium text-white/90"
                        style={{ backgroundColor: `#${label.color}` }}
                      >
                        {label.name}
                      </span>
                    ))}
                    <span className="text-[10px] text-zinc-700">
                      #{issue.number}
                    </span>
                  </div>
                  <p className="text-[12px] text-zinc-200 leading-relaxed">
                    {issue.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-600">
                    <span>
                      {new Date(issue.created_at).toLocaleDateString()}
                    </span>
                    {issue.reportedBy && <span>by {issue.reportedBy}</span>}
                  </div>
                </div>
                <span className="text-zinc-700 text-[10px] shrink-0">
                  {isExpanded ? "▲" : "▼"}
                </span>
              </button>

              {/* Expanded Body */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-zinc-800/40">
                  {issue.body && (
                    <div className="mt-3 text-[11px] text-zinc-400 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto admin-scroll">
                      {issue.body}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="mt-3 flex items-center gap-4 flex-wrap text-[10px] text-zinc-600">
                    {issue.contactEmail && (
                      <span>
                        Contact:{" "}
                        <span className="text-zinc-400">
                          {issue.contactEmail}
                        </span>
                      </span>
                    )}
                    {issue.pageUrl && (
                      <span>
                        Page:{" "}
                        <span className="text-zinc-400">{issue.pageUrl}</span>
                      </span>
                    )}
                    {issue.screenshot?.startsWith("https://") && (
                      <a
                        href={issue.screenshot}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 hover:text-sky-300 transition-colors"
                      >
                        View screenshot ↗
                      </a>
                    )}
                    <span>
                      Updated: {new Date(issue.updated_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <a
                      href={issue.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded text-[10px] font-medium bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 transition-colors"
                    >
                      View on GitHub ↗
                    </a>
                    <button
                      onClick={() => handleToggleState(issue)}
                      disabled={isUpdating}
                      className={`px-2 py-1 rounded text-[10px] font-medium transition-colors disabled:opacity-50 ${
                        issue.state === "open"
                          ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      }`}
                    >
                      {isUpdating
                        ? "Updating..."
                        : issue.state === "open"
                          ? "Close Issue"
                          : "Reopen Issue"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && !loading && (
        <p className="text-[12px] text-zinc-600">
          No feedback items match the current filters.
        </p>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => fetchPage(page - 1, statusFilter, typeFilter)}
          disabled={page <= 1 || loading}
          className="px-3 py-1.5 rounded text-[11px] font-medium bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 disabled:opacity-30 transition-colors"
        >
          Previous
        </button>
        <span className="text-[10px] text-zinc-600">Page {page}</span>
        <button
          onClick={() => fetchPage(page + 1, statusFilter, typeFilter)}
          disabled={!hasMore || loading}
          className="px-3 py-1.5 rounded text-[11px] font-medium bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 disabled:opacity-30 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
