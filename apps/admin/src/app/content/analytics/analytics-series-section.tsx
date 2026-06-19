import {
  getSeriesPerformance,
  type SeriesPerformanceRow,
} from "@anipotts/lib/analytics";
import { SERIES_COLORS } from "@/lib/constants";
import { Section } from "@/components/shared/section";

function SeriesTable({ rows }: { rows: SeriesPerformanceRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-[12px] text-zinc-600">No series data available yet.</p>
    );
  }

  return (
    <div className="space-y-px">
      <div className="flex items-center gap-2 py-1.5 px-2 text-[10px] text-zinc-500 uppercase tracking-wide border-b border-zinc-800/40">
        <div className="flex-1">Series</div>
        <div className="w-16 text-right">Count</div>
        <div className="w-20 text-right">Views</div>
      </div>
      {rows.map((row) => {
        const colorCls =
          SERIES_COLORS[row.series_type as keyof typeof SERIES_COLORS] ?? "";
        return (
          <div
            key={row.series_type}
            className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-zinc-800/20"
          >
            <div className="flex-1">
              <span className={`admin-badge ${colorCls}`}>
                {row.series_type}
              </span>
            </div>
            <div className="w-16 text-right text-[12px] text-zinc-300 tabular-nums">
              {row.count}
            </div>
            <div className="w-20 text-right text-[12px] text-zinc-400 tabular-nums">
              {row.total_views.toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export async function SeriesPerformanceSection() {
  const rows = await getSeriesPerformance();
  return (
    <Section title="Series Performance">
      <SeriesTable rows={rows} />
    </Section>
  );
}
