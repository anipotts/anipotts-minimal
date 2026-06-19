import Link from "next/link";
import { SERIES_COLORS, STATUS_COLORS, PLATFORM_ABBREV } from "@/lib/constants";
import type { WritingPipelineItem } from "./pipeline-data";

export function PipelineList({ items }: { items: WritingPipelineItem[] }) {
  return (
    <div className="flex-1 overflow-y-auto admin-scroll">
      {items.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-zinc-600 text-[12px]">
            No content matches your filters
          </p>
        </div>
      )}

      {items.map((thought) => (
        <PipelineListRow key={thought.id} thought={thought} />
      ))}
    </div>
  );
}

function PipelineListRow({ thought }: { thought: WritingPipelineItem }) {
  const status = thought.status || "draft";
  const date = new Date(
    thought.updated_at || thought.created_at,
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const postedPlatforms = thought.platforms_posted as string[] | null;

  return (
    <Link href={`/content/${thought.id}`} className="admin-row">
      <div className="flex-1 min-w-0">
        <span className="text-[13px] text-zinc-200 truncate block">
          {thought.title}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {thought.atom_count > 0 && (
          <span className="text-[10px] text-zinc-600 tabular-nums">
            {thought.atom_count}a
          </span>
        )}
        {postedPlatforms && postedPlatforms.length > 0 && (
          <span className="flex items-center gap-0.5">
            {postedPlatforms.map((platform) => (
              <span
                key={platform}
                className="admin-badge bg-green-500/10 text-green-400"
              >
                {PLATFORM_ABBREV[platform] || platform}
              </span>
            ))}
          </span>
        )}
        {thought.series_type && (
          <span
            className={`admin-badge ${SERIES_COLORS[thought.series_type as keyof typeof SERIES_COLORS] || ""}`}
          >
            {thought.series_type}
          </span>
        )}
        <span
          className={`admin-badge ${STATUS_COLORS[status] || STATUS_COLORS.draft}`}
        >
          {status}
        </span>
        <span className="text-[10px] text-zinc-600 w-11 text-right tabular-nums">
          {date}
        </span>
      </div>
    </Link>
  );
}
