import Link from "next/link";
import type { QCQAItem } from "@anipotts/lib/quantercise";
import {
  DifficultyBadge,
  EmptyState,
  PanelShell,
  StatusBadge,
} from "../components";

const QA_STATUS_COLORS: Record<string, string> = {
  verified: "bg-emerald-500/10 text-emerald-400",
  flagged: "bg-red-500/10 text-red-400",
  skipped: "bg-zinc-500/10 text-zinc-400",
  unreviewed: "bg-yellow-500/10 text-yellow-400",
};

const QA_SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400",
  high: "bg-orange-500/10 text-orange-400",
  medium: "bg-amber-500/10 text-amber-400",
  low: "bg-zinc-500/10 text-zinc-400",
};

export function QAProblemsPanel({ problems }: { problems: QCQAItem[] }) {
  return (
    <PanelShell title="Problems">
      {problems.length === 0 ? (
        <EmptyState message="No problems match the selected filters." />
      ) : (
        <div className="divide-y divide-zinc-800/40 -mx-4 -mb-4">
          {problems.map((item) => (
            <QARow key={item.id} item={item} />
          ))}
        </div>
      )}
    </PanelShell>
  );
}

function QARow({ item }: { item: QCQAItem }) {
  return (
    <Link
      href={`/quantercise/problems/${item.id}`}
      className="flex items-center gap-4 px-4 py-2.5 hover:bg-zinc-800/30 transition-colors group"
    >
      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-zinc-200 truncate group-hover:text-white">
          {item.title}
        </div>
        <div className="flex gap-2 mt-0.5 text-[10px] text-zinc-600">
          <span>{item.topic}</span>
          {item.tags && item.tags.length > 0 && (
            <span>{item.tags.slice(0, 2).join(", ")}</span>
          )}
        </div>
      </div>
      <DifficultyBadge difficulty={item.difficulty} />
      <StatusBadge status={item.qaStatus} colorMap={QA_STATUS_COLORS} />
      {item.severity && (
        <StatusBadge status={item.severity} colorMap={QA_SEVERITY_COLORS} />
      )}
    </Link>
  );
}
