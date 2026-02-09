"use client";

import { useEffect, useState, useMemo, memo } from "react";
import { getAdminContent } from "../actions";
import type { Thought, ContentStatus } from "@anipotts/types";
import { FaCircle } from "react-icons/fa";

type ContentStatusGroup = ContentStatus | "published";

const STATUS_COLUMNS: { status: ContentStatusGroup; label: string; color: string }[] = [
  { status: "idea", label: "Ideas", color: "text-blue-400" },
  { status: "draft", label: "Drafts", color: "text-yellow-400" },
  { status: "ready", label: "Ready", color: "text-orange-400" },
  { status: "atomized", label: "Atomized", color: "text-purple-400" },
  { status: "published", label: "Published", color: "text-green-400" },
];

// Memoized card component
const PipelineCard = memo(function PipelineCard({ item }: { item: Thought }) {
  return (
    <div className="p-4 bg-[var(--input-bg)] border border-[var(--border)] rounded-md hover:border-[var(--accent-400)]/60 hover:bg-[var(--overlay-5)] transition-all cursor-pointer group">
      <h4 className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent-400)]">
        {item.title || "Untitled"}
      </h4>
      <div className="flex items-center justify-between mt-2 text-[11px]">
        <span className="text-[var(--text-muted)] font-medium">{item.views} views</span>
        <span className="text-[var(--text-tertiary)]">
          {new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
      </div>
    </div>
  );
});

// Memoized column component
const PipelineColumn = memo(function PipelineColumn({
  status,
  label,
  color,
  items,
}: {
  status: string;
  label: string;
  color: string;
  items: Thought[];
}) {
  return (
    <div className="flex flex-col bg-[var(--overlay-3)] border border-[var(--border)] rounded-lg overflow-hidden min-w-0">
      {/* Column Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--overlay-5)] shrink-0">
        <div className="flex items-center gap-2">
          <FaCircle className={`w-2 h-2 ${color}`} />
          <span className="text-[13px] font-mono uppercase tracking-wide text-[var(--text-secondary)] font-semibold">{label}</span>
          <span className="ml-auto text-xs text-[var(--text-tertiary)] font-bold bg-[var(--input-bg)] px-2.5 py-1 rounded">{items.length}</span>
        </div>
      </div>
      {/* Column Content - scrollable if needed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {items.length === 0 ? (
          <div className="text-center text-xs text-[var(--text-muted)] py-6">Empty</div>
        ) : (
          items.map((item) => <PipelineCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
});

export default memo(function PipelineTab() {
  const [content, setContent] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getAdminContent();
        if (mounted) setContent(data || []);
      } catch { /* silent */ }
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  // Memoized grouped content
  const grouped = useMemo(() => {
    const map: Record<ContentStatusGroup, Thought[]> = {
      idea: [], draft: [], ready: [], atomized: [], published: [],
    };
    for (const item of content) {
      if (item.published) map.published.push(item);
      else if (item.status) map[item.status].push(item);
      else map.draft.push(item);
    }
    return map;
  }, [content]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-xs text-[var(--text-muted)] animate-pulse">Loading...</span>
      </div>
    );
  }

  return (
    <div className="h-full p-4 flex flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 shrink-0 px-1">
        <FaCircle className="w-2 h-2 text-[var(--accent-400)]" />
        <span className="text-lg font-semibold text-[var(--text-primary)]">Pipeline</span>
        <span className="text-[13px] text-[var(--text-muted)] ml-auto font-medium">{content.length} items</span>
      </div>

      {/* Kanban Board - 5 columns, fills remaining height */}
      <div className="flex-1 grid grid-cols-5 gap-3 min-h-0 overflow-hidden">
        {STATUS_COLUMNS.map((col) => (
          <PipelineColumn key={col.status} status={col.status} label={col.label} color={col.color} items={grouped[col.status]} />
        ))}
      </div>
    </div>
  );
});
