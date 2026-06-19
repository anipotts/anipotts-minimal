"use client";

import { useState, useCallback, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { updateContentStatus } from "../actions";
import type { ContentStatus } from "@anipotts/types";
import {
  DraggableCard,
  DroppableColumn,
  ProgressBar,
  Toast,
} from "./pipeline-board-components";
import {
  COLUMNS,
  dropAnimation,
  type BoardItem,
  type PipelineBoardProps,
} from "./pipeline-board-model";

export type { BoardItem } from "./pipeline-board-model";

export default function PipelineBoard({
  items: initialItems,
}: PipelineBoardProps) {
  const [items, setItems] = useState<BoardItem[]>(initialItems);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clearError = useCallback(() => setError(null), []);
  const isUpdating = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor),
  );

  const activeItem = activeId
    ? (items.find((item) => item.id === activeId) ?? null)
    : null;

  const columnItems = useCallback(
    (status: string) => items.filter((item) => item.status === status),
    [items],
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    if (isUpdating.current) return;
    const { active, over } = event;
    if (!over) return;

    const overId = String(over.id);
    let targetStatus: string;

    if (COLUMNS.includes(overId as ContentStatus)) {
      targetStatus = overId;
    } else {
      const overItem = items.find((item) => item.id === overId);
      if (!overItem) return;
      targetStatus = overItem.status;
    }

    const draggedItem = items.find((item) => item.id === String(active.id));
    if (!draggedItem || draggedItem.status === targetStatus) return;

    const prevItems = items;
    setItems((prev) =>
      prev.map((item) =>
        item.id === draggedItem.id ? { ...item, status: targetStatus } : item,
      ),
    );

    isUpdating.current = true;
    try {
      const result = await updateContentStatus(
        draggedItem.id,
        targetStatus as ContentStatus,
      );
      if (result && "error" in result) {
        setItems(prevItems);
        setError(result.error ?? "Failed to update status");
      }
    } finally {
      isUpdating.current = false;
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 h-full">
      <ProgressBar items={items} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto admin-scroll pb-2 flex-1">
          {COLUMNS.map((status) => (
            <DroppableColumn
              key={status}
              status={status}
              items={columnItems(status)}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeItem ? <DraggableCard item={activeItem} overlay /> : null}
        </DragOverlay>
      </DndContext>

      {error && <Toast message={error} onDone={clearError} />}
    </div>
  );
}
