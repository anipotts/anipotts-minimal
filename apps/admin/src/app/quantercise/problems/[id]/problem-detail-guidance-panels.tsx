import type { QCProblem } from "@anipotts/lib/quantercise";
import { PanelShell } from "../../components";

export function ProblemGuidancePanels({ problem }: { problem: QCProblem }) {
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

export function ProblemFollowUpsPanel({ problem }: { problem: QCProblem }) {
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

export function ProblemWhyPanel({ problem }: { problem: QCProblem }) {
  if (!problem.whyThisMatters) {
    return null;
  }

  return (
    <PanelShell title="Why This Matters">
      <p className="text-[11px] text-zinc-400">{problem.whyThisMatters}</p>
    </PanelShell>
  );
}
