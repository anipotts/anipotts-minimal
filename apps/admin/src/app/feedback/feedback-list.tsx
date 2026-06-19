"use client";

import { useState, useCallback } from "react";
import type { QCFeedbackIssue } from "@anipotts/lib/quantercise";
import { getFeedback, updateFeedback } from "./actions";
import { FeedbackIssueCard } from "./feedback-card";
import {
  FeedbackError,
  FeedbackFilters,
  FeedbackPagination,
} from "./feedback-controls";
import type { StatusFilter, TypeFilter } from "./feedback-model";

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

  return (
    <div className="space-y-4">
      <FeedbackFilters
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        issueCount={filtered.length}
        loading={loading}
        onTypeFilter={handleTypeFilter}
        onStatusFilter={handleStatusFilter}
      />

      {error && <FeedbackError error={error} />}

      {/* Issue Cards */}
      <div className="space-y-2">
        {filtered.map((issue) => {
          const isExpanded = expandedId === issue.id;
          const isUpdating = updatingIds.has(issue.id);

          return (
            <FeedbackIssueCard
              key={issue.id}
              issue={issue}
              isExpanded={isExpanded}
              isUpdating={isUpdating}
              onToggleExpanded={() =>
                setExpandedId(isExpanded ? null : issue.id)
              }
              onToggleState={handleToggleState}
            />
          );
        })}
      </div>

      {filtered.length === 0 && !loading && (
        <p className="text-[12px] text-zinc-600">
          No feedback items match the current filters.
        </p>
      )}

      <FeedbackPagination
        page={page}
        hasMore={hasMore}
        loading={loading}
        onPrevious={() => fetchPage(page - 1, statusFilter, typeFilter)}
        onNext={() => fetchPage(page + 1, statusFilter, typeFilter)}
      />
    </div>
  );
}
