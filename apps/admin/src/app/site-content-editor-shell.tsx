"use client";

import { FloppyDisk, MagnifyingGlass } from "@phosphor-icons/react";
import type { EditorItem, EditorSelection } from "./site-content-editor-model";

export function SiteContentEditorHeader({
  projectCount,
  writingCount,
  dirty,
  isPending,
  onReset,
  onSave,
}: {
  projectCount: number;
  writingCount: number;
  dirty: boolean;
  isPending: boolean;
  onReset: () => void;
  onSave: () => void;
}) {
  return (
    <div className="border-b border-zinc-800/50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-[13px] font-medium text-zinc-100">
          Content inventory
        </h2>
        <p className="mt-1 text-[11px] text-zinc-600">
          {projectCount} projects / {writingCount} writing entries / newsletter
          slots
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onReset}
          disabled={!dirty || isPending}
          className="rounded-md border border-zinc-800 px-2.5 py-1.5 text-[11px] text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300 disabled:opacity-30"
        >
          reset
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!dirty || isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-30"
        >
          <FloppyDisk size={13} weight="duotone" />
          {isPending ? "saving" : dirty ? "save" : "saved"}
        </button>
      </div>
    </div>
  );
}

export function SiteContentEditorFeedback({
  feedback,
}: {
  feedback: string | null;
}) {
  if (!feedback) return null;

  return (
    <div
      role="status"
      className={`border-b border-zinc-800/40 px-4 py-2 text-[11px] ${
        feedback.startsWith("saved") ? "text-green-400" : "text-red-400"
      }`}
    >
      {feedback}
    </div>
  );
}

export function SiteContentEditorSidebar({
  active,
  items,
  query,
  onQueryChange,
  onSelect,
}: {
  active: EditorSelection;
  items: EditorItem[];
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (selection: EditorSelection) => void;
}) {
  return (
    <aside className="border-b border-zinc-800/50 lg:border-b-0 lg:border-r">
      <label className="relative block border-b border-zinc-800/50 p-3">
        <MagnifyingGlass
          size={14}
          className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600"
        />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="search content"
          className="admin-input w-full px-8 py-2 text-[12px] text-zinc-200"
        />
      </label>
      <div className="max-h-[520px] overflow-y-auto admin-scroll">
        {items.map((item) => {
          const selected = item.kind === active.kind && item.id === active.id;
          return (
            <button
              key={`${item.kind}:${item.id}`}
              type="button"
              onClick={() => onSelect({ kind: item.kind, id: item.id })}
              className={`block w-full border-b border-zinc-900 px-3 py-2.5 text-left transition-colors ${
                selected ? "bg-zinc-900/80" : "hover:bg-zinc-900/50"
              }`}
            >
              <span className="block truncate text-[12px] text-zinc-200">
                {item.label}
              </span>
              <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-zinc-600">
                {item.kind} / {item.meta}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
