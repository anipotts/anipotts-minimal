import type { QCQAResponse } from "@anipotts/lib/quantercise";
import { PanelShell } from "../components";

export function QAStatsBar({
  stats,
}: {
  stats: NonNullable<QCQAResponse["stats"]>;
}) {
  const total = stats.total || 1;
  const segments = [
    { label: "Verified", value: stats.verified, color: "bg-emerald-500" },
    { label: "Flagged", value: stats.flagged, color: "bg-red-500" },
    { label: "Skipped", value: stats.skipped, color: "bg-zinc-500" },
    { label: "Unreviewed", value: stats.unreviewed, color: "bg-yellow-500" },
  ];

  return (
    <PanelShell title="Review Progress">
      <div className="flex h-3 rounded-full overflow-hidden mb-3">
        {segments.map((s) => (
          <div
            key={s.label}
            className={`${s.color} transition-all`}
            style={{ width: `${(s.value / total) * 100}%` }}
            title={`${s.label}: ${s.value}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${s.color}`} />
            <span className="text-[11px] text-zinc-500">{s.label}</span>
            <span className="text-[11px] font-mono text-zinc-300 ml-auto">
              {s.value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-[10px] text-zinc-600">
        {Math.round((stats.verified / total) * 100)}% reviewed
      </div>
    </PanelShell>
  );
}
