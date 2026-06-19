import type { QCProblem } from "@anipotts/lib/quantercise";
import { DifficultyBadge, PanelShell } from "../../components";

export function ProblemOverviewPanel({ problem }: { problem: QCProblem }) {
  return (
    <PanelShell title="Overview">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h3 className="text-[14px] font-medium text-zinc-200">
            {problem.title}
          </h3>
          <DifficultyBadge difficulty={problem.difficulty} />
          {problem.isPreview && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400">
              Preview
            </span>
          )}
        </div>

        <div className="flex gap-4 text-[10px] text-zinc-500">
          <span>Topic: {problem.topic}</span>
          <span>Type: {problem.type}</span>
          <span>Score: {problem.difficultyScore}</span>
          <span>Slug: {problem.slug}</span>
        </div>

        {problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {problem.tags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded bg-zinc-800/60 text-[10px] text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {problem.companies.length > 0 && (
          <div className="text-[10px] text-zinc-500">
            Companies: {problem.companies.join(", ")}
          </div>
        )}
      </div>
    </PanelShell>
  );
}

export function ProblemTimestampRow({ problem }: { problem: QCProblem }) {
  return (
    <div className="text-[10px] text-zinc-600 flex gap-4">
      <span>Created: {new Date(problem.createdAt).toLocaleDateString()}</span>
      <span>Updated: {new Date(problem.updatedAt).toLocaleDateString()}</span>
      {problem.deletedAt && (
        <span className="text-red-400/70">
          Deleted: {new Date(problem.deletedAt).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
