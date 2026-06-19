import type { QCAnalytics } from "@anipotts/lib/quantercise";
import { PanelShell } from "../components";

export function DAUChart({ data }: { data: QCAnalytics }) {
  const points = data.dailyActiveUsers;
  if (points.length === 0) return null;

  const max = Math.max(...points.map((p) => p.count), 1);

  return (
    <PanelShell title="Daily Active Users (30d)">
      <div className="flex items-end gap-px h-24">
        {points.map((p) => {
          const pct = (p.count / max) * 100;
          return (
            <div
              key={p.date}
              className="flex-1 bg-violet-500/40 hover:bg-violet-500/70 rounded-t transition-colors"
              style={{ height: `${Math.max(pct, 2)}%` }}
              title={`${p.date}: ${p.count}`}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-1.5 text-[9px] text-zinc-600">
        <span>{points[0]?.date}</span>
        <span>{points[points.length - 1]?.date}</span>
      </div>
    </PanelShell>
  );
}
