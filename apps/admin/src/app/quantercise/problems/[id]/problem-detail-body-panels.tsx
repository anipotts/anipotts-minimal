import type { QCProblem } from "@anipotts/lib/quantercise";
import { PanelShell } from "../../components";

export function ProblemBodyPanel({ problem }: { problem: QCProblem }) {
  return (
    <PanelShell title="Body">
      <pre className="text-[11px] text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
        {problem.bodyMd}
      </pre>
    </PanelShell>
  );
}

export function ProblemExamplesPanel({ problem }: { problem: QCProblem }) {
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
