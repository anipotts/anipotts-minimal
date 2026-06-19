import Link from "next/link";
import type { QCProblem } from "@anipotts/lib/quantercise";
import { DifficultyBadge, EmptyState, PanelShell } from "../components";

export function ProblemsPanel({
  search,
  problems,
}: {
  search?: string;
  problems: QCProblem[];
}) {
  return (
    <PanelShell title={search ? `Results for "${search}"` : "All Problems"}>
      {problems.length === 0 ? (
        <EmptyState message="No problems found." />
      ) : (
        <div className="divide-y divide-zinc-800/40 -mx-4 -mb-4">
          {problems.map((p) => (
            <ProblemRow key={p.id} problem={p} />
          ))}
        </div>
      )}
    </PanelShell>
  );
}

function ProblemRow({ problem }: { problem: QCProblem }) {
  return (
    <Link
      href={`/quantercise/problems/${problem.id}`}
      className="flex items-center gap-4 px-4 py-2.5 hover:bg-zinc-800/30 transition-colors group"
    >
      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-zinc-200 truncate group-hover:text-white">
          {problem.title}
        </div>
        <div className="text-[10px] text-zinc-600 mt-0.5">
          {problem.topic} · {problem.type}
          {problem.isPreview && (
            <span className="ml-1.5 text-amber-400/70">(preview)</span>
          )}
        </div>
      </div>
      <DifficultyBadge difficulty={problem.difficulty} />
      <span className="text-[10px] text-zinc-600 w-20 text-right">
        {problem.tags.length > 0 ? problem.tags.slice(0, 2).join(", ") : ""}
      </span>
    </Link>
  );
}
