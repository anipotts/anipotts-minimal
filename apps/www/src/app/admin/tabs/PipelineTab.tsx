"use client";

import { useEffect, useState } from "react";
import { getAdminContent } from "../actions";
import type { Thought, ContentStatus } from "@anipotts/types";
import { FaArrowRight, FaCircle } from "react-icons/fa";

type ContentStatusGroup = ContentStatus | "published";

const STATUS_COLUMNS: { status: ContentStatusGroup; label: string; color: string }[] = [
  { status: "idea", label: "Ideas", color: "text-blue-400" },
  { status: "draft", label: "Drafts", color: "text-yellow-400" },
  { status: "ready", label: "Ready", color: "text-orange-400" },
  { status: "atomized", label: "Atomized", color: "text-purple-400" },
  { status: "published", label: "Published", color: "text-green-400" },
];

export default function PipelineTab() {
  const [content, setContent] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await getAdminContent();
        setContent(data || []);
      } catch (err) {
        console.error("Error fetching content:", err);
      }
      setLoading(false);
    };

    fetchContent();
  }, []);

  const getColumnContent = (status: ContentStatusGroup): Thought[] => {
    return content.filter((item) => {
      if (status === "published") {
        return item.published;
      }
      return item.status === status;
    });
  };

  if (loading) {
    return (
      <div className="p-8 font-mono text-xs text-muted animate-pulse">
        Loading pipeline...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FaCircle className="w-2 h-2 text-accent-400" />
        <h2 className="text-sm font-mono uppercase tracking-widest text-secondary">
          Content Pipeline
        </h2>
        <span className="text-xs text-muted ml-auto">
          {content.length} items total
        </span>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {STATUS_COLUMNS.map((column) => {
          const items = getColumnContent(column.status);
          return (
            <div
              key={column.status}
              className="flex flex-col bg-[rgba(var(--overlay-invert),0.4)] border border-border rounded-lg overflow-hidden min-w-[300px] md:min-w-0"
            >
              {/* Column Header */}
              <div className="px-4 py-3 border-b border-border bg-[rgba(var(--overlay-invert),0.2)]">
                <div className="flex items-center gap-2">
                  <FaCircle className={`w-2 h-2 ${column.color}`} />
                  <h3 className="text-xs font-mono uppercase tracking-widest text-tertiary">
                    {column.label}
                  </h3>
                  <span className="ml-auto text-xs text-muted font-bold">
                    {items.length}
                  </span>
                </div>
              </div>

              {/* Column Content */}
              <div className="flex-grow overflow-y-auto custom-scrollbar p-3 space-y-2 min-h-[300px]">
                {items.length === 0 ? (
                  <div className="text-center text-xs text-muted py-8">
                    Empty
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-input border border-border-subtle rounded hover:border-accent-400/50 transition-colors cursor-pointer group"
                    >
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-accent-400 transition-colors">
                        {item.title || "Untitled"}
                      </h4>
                      <p className="text-[10px] text-faint mt-1 truncate">
                        {item.slug}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-[10px]">
                        <span className="text-muted">
                          {item.views} views
                        </span>
                        <span className="text-faint">
                          {new Date(item.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-xs text-muted font-mono">
        <span className="opacity-60">
          Drag cards between columns to update status •
        </span>
        <span className="text-accent-400 ml-2">
          {content.filter((c) => c.published).length} published
        </span>
      </div>
    </div>
  );
}
