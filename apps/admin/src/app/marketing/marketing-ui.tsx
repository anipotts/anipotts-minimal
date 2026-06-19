"use client";

import type { MarketingResponseTemplate } from "./marketing-model";
import type { TrackingData } from "./use-tracking";

export function MarketingStatsBar({
  found,
  tracking,
}: {
  found: number;
  tracking: TrackingData;
}) {
  return (
    <div className="flex items-center gap-4 text-[10px] text-zinc-500">
      <span>
        Found: <span className="text-zinc-300">{found}</span>
      </span>
      <span>
        Responded:{" "}
        <span className="text-emerald-400">{tracking.responded.length}</span>
      </span>
      <span>
        Saved: <span className="text-blue-400">{tracking.saved.length}</span>
      </span>
      <span>
        Skipped:{" "}
        <span className="text-zinc-400">{tracking.skipped.length}</span>
      </span>
    </div>
  );
}

export function MarketingError({ error }: { error: string }) {
  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
      <p className="text-[11px] text-red-400">{error}</p>
    </div>
  );
}

export function MarketingTemplateRows({
  heading,
  templates,
  copiedId,
  compact = false,
  getCopyId,
  onCopy,
}: {
  heading: string;
  templates: readonly MarketingResponseTemplate[];
  copiedId: string | null;
  compact?: boolean;
  getCopyId: (template: MarketingResponseTemplate) => string;
  onCopy: (template: MarketingResponseTemplate) => void;
}) {
  const textClassName = compact
    ? "text-[10px] text-zinc-500 mt-0.5 line-clamp-1"
    : "text-[10px] text-zinc-500 mt-0.5 line-clamp-2";

  return (
    <div className="mt-3 space-y-1.5">
      <span className="text-[10px] text-zinc-600 uppercase tracking-wide">
        {heading}
      </span>
      {templates.map((template) => {
        const copyId = getCopyId(template);

        return (
          <div
            key={template.label}
            className="flex items-start justify-between gap-2 rounded border border-zinc-800/40 bg-zinc-900/50 p-2"
          >
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-medium text-zinc-400">
                {template.label}
              </span>
              <p className={textClassName}>{template.text}</p>
            </div>
            <button
              onClick={() => onCopy(template)}
              className="shrink-0 px-2 py-1 rounded text-[10px] font-medium bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 transition-colors"
            >
              {copiedId === copyId ? "Copied!" : "Copy"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
