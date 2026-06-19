"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ContentStatus } from "@anipotts/types";
import { STATUS_COLORS, SERIES_COLORS, PLATFORM_ABBREV } from "@/lib/constants";
import {
  COLUMNS,
  COLUMN_HEADER_COLORS,
  type BoardItem,
} from "./pipeline-board-model";

export function ProgressBar({ items }: { items: BoardItem[] }) {
  const counts: Record<string, number> = {};
  for (const column of COLUMNS) {
    counts[column] = items.filter((item) => item.status === column).length;
  }
  const total = items.length || 1;

  const segments = COLUMNS.map((column) => ({
    status: column,
    count: counts[column] || 0,
    pct: ((counts[column] || 0) / total) * 100,
  }));

  return (
    <div className="px-1 pb-3">
      <div className="flex h-1.5 rounded-full overflow-hidden bg-zinc-800/60">
        {segments.map((segment) =>
          segment.count > 0 ? (
            <div
              key={segment.status}
              className={`${COLUMN_HEADER_COLORS[segment.status]} transition-all duration-300`}
              style={{ width: `${segment.pct}%` }}
            />
          ) : null,
        )}
      </div>
      <p className="text-[10px] text-zinc-500 mt-1.5">
        {segments
          .filter((segment) => segment.count > 0)
          .map((segment) => `${segment.count} ${segment.status}`)
          .join(" \u00b7 ")}
      </p>
    </div>
  );
}

export function DraggableCard({
  item,
  overlay,
}: {
  item: BoardItem;
  overlay?: boolean;
}) {
  const router = useRouter();
  const wasDragged = useRef(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: { status: item.status },
  });

  const style = overlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  const date = new Date(item.updated_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  function handlePointerDown() {
    wasDragged.current = false;
  }

  function handlePointerMove() {
    wasDragged.current = true;
  }

  function handleClick() {
    if (!wasDragged.current) {
      router.push(`/content/${item.id}`);
    }
  }

  const baseClasses =
    "rounded-lg border border-zinc-800/60 bg-zinc-900/50 p-3 cursor-grab active:cursor-grabbing";
  const draggingClasses = isDragging ? "opacity-40 scale-[0.98]" : "";
  const overlayClasses = overlay
    ? "ring-2 ring-violet-500/50 shadow-lg shadow-violet-500/10"
    : "";

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      className={`${baseClasses} ${draggingClasses} ${overlayClasses}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
    >
      <p className="text-[13px] text-zinc-200 leading-snug line-clamp-2">
        {item.title}
      </p>

      <div className="flex items-center gap-1 mt-2 flex-wrap">
        {item.atom_count > 0 && (
          <span className="admin-badge bg-zinc-800 text-zinc-400">
            {item.atom_count}a
          </span>
        )}
        {item.series_type && (
          <span
            className={`admin-badge ${SERIES_COLORS[item.series_type as keyof typeof SERIES_COLORS] || ""}`}
          >
            {item.series_type}
          </span>
        )}
        {item.platforms_posted.length > 0 &&
          item.platforms_posted.map((platform) => (
            <span
              key={platform}
              className="admin-badge bg-green-500/10 text-green-400"
            >
              {PLATFORM_ABBREV[platform] || platform}
            </span>
          ))}
      </div>

      <p className="text-[10px] text-zinc-600 mt-2 tabular-nums">{date}</p>
    </div>
  );
}

export function DroppableColumn({
  status,
  items,
}: {
  status: ContentStatus;
  items: BoardItem[];
}) {
  const { setNodeRef } = useDroppable({ id: status });
  const itemIds = items.map((item) => item.id);

  return (
    <div className="w-72 shrink-0 flex flex-col">
      <div className="flex items-center gap-2 px-2 pb-2">
        <span
          className={`admin-badge ${STATUS_COLORS[status] || STATUS_COLORS.draft}`}
        >
          {status}
        </span>
        <span className="text-[10px] text-zinc-600 tabular-nums">
          {items.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 min-h-[300px] max-h-[500px] overflow-y-auto admin-scroll rounded-lg border border-zinc-800/40 bg-zinc-900/20 p-2 space-y-2"
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {items.length === 0 && (
            <p className="text-[11px] text-zinc-600 text-center py-8">
              No items
            </p>
          )}
          {items.map((item) => (
            <DraggableCard key={item.id} item={item} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function Toast({
  message,
  onDone,
}: {
  message: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const timeout = setTimeout(onDone, 3000);
    return () => clearTimeout(timeout);
  }, [onDone]);

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-red-500/30 bg-red-950/90 px-4 py-2 text-[12px] text-red-300 shadow-lg">
      {message}
    </div>
  );
}
