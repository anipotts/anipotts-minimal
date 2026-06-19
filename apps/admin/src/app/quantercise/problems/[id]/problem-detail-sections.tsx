import type { QCProblem } from "@anipotts/lib/quantercise";
import { DifficultyBadge, PanelShell } from "../../components";

export function ProblemDetailPanels({ problem }: { problem: QCProblem }) {
  return (
    <div className="space-y-4">
      <ProblemOverviewPanel problem={problem} />
      <ProblemBodyPanel problem={problem} />
      <ProblemExamplesPanel problem={problem} />
      <ProblemGuidancePanels problem={problem} />
      <ProblemFollowUpsPanel problem={problem} />
      <ProblemWhyPanel problem={problem} />
      <ProblemTimestampRow problem={problem} />
    </div>
  );
}

function ProblemOverviewPanel({ problem }: { problem: QCProblem }) {
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

function ProblemBodyPanel({ problem }: { problem: QCProblem }) {
  return (
    <PanelShell title="Body">
      <pre className="text-[11px] text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
        {problem.bodyMd}
      </pre>
    </PanelShell>
  );
}

function ProblemExamplesPanel({ problem }: { problem: QCProblem }) {
  if (!problem.examples || problem.examples.length === 0) {
    return null;
  }

  return (
    <PanelShell title="Examples">
      <div className="space-y-3">
        {problem.examples.map((ex, i) => (
          <div key={i} className="space-y-1">
            <div className="text-[10px] text-zinc-500 font-medium">
              Example {i + 1}
            </div>
            <div className="bg-zinc-900/50 rounded p-2 text-[11px] font-mono">
              <div className="text-zinc-400">
                Input: <span className="text-zinc-200">{ex.input}</span>
              </div>
              <div className="text-zinc-400">
                Output: <span className="text-zinc-200">{ex.output}</span>
              </div>
              {ex.explanation && (
                <div className="text-zinc-500 mt-1">{ex.explanation}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

function ProblemGuidancePanels({ problem }: { problem: QCProblem }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {problem.hints.length > 0 && (
        <PanelShell title="Hints">
          <ol className="space-y-1.5 list-decimal list-inside">
            {problem.hints.map((hint, i) => (
              <li key={i} className="text-[11px] text-zinc-400">
                {hint}
              </li>
            ))}
          </ol>
        </PanelShell>
      )}

      {problem.constraints.length > 0 && (
        <PanelShell title="Constraints">
          <ul className="space-y-1">
            {problem.constraints.map((c, i) => (
              <li key={i} className="text-[11px] text-zinc-400 font-mono">
                {c}
              </li>
            ))}
          </ul>
        </PanelShell>
      )}
    </div>
  );
}

function ProblemFollowUpsPanel({ problem }: { problem: QCProblem }) {
  if (problem.followUps.length === 0) {
    return null;
  }

  return (
    <PanelShell title="Follow-ups">
      <ul className="space-y-1">
        {problem.followUps.map((f, i) => (
          <li key={i} className="text-[11px] text-zinc-400">
            {f}
          </li>
        ))}
      </ul>
    </PanelShell>
  );
}

function ProblemWhyPanel({ problem }: { problem: QCProblem }) {
  if (!problem.whyThisMatters) {
    return null;
  }

  return (
    <PanelShell title="Why This Matters">
      <p className="text-[11px] text-zinc-400">{problem.whyThisMatters}</p>
    </PanelShell>
  );
}

function ProblemTimestampRow({ problem }: { problem: QCProblem }) {
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
