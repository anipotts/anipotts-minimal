import {
  getPipelineVelocity,
  type PipelineVelocityRow,
} from "@anipotts/lib/analytics";
import { STATUS_COLORS } from "@/lib/constants";
import { Section } from "@/components/shared/section";

function VelocityTable({ rows }: { rows: PipelineVelocityRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-[12px] text-zinc-600">
        No content data available yet.
      </p>
    );
  }

  const weekMap = new Map<string, Record<string, number>>();
  const allStatuses = new Set<string>();

  for (const row of rows) {
    allStatuses.add(row.status);
    const existing = weekMap.get(row.week) ?? {};
    existing[row.status] = row.count;
    weekMap.set(row.week, existing);
  }

  const statuses = Array.from(allStatuses).sort();
  const weeks = Array.from(weekMap.keys());

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-zinc-800/40">
            <th className="text-left py-1.5 px-2 text-[10px] text-zinc-500 uppercase tracking-wide font-medium">
              Week
            </th>
            {statuses.map((status) => (
              <th
                key={status}
                className="text-right py-1.5 px-2 text-[10px] text-zinc-500 uppercase tracking-wide font-medium"
              >
                {status}
              </th>
            ))}
            <th className="text-right py-1.5 px-2 text-[10px] text-zinc-500 uppercase tracking-wide font-medium">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => {
            const counts = weekMap.get(week) ?? {};
            const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
            return (
              <tr
                key={week}
                className="border-b border-zinc-800/20 hover:bg-zinc-800/20"
              >
                <td className="py-1.5 px-2 text-zinc-400 tabular-nums">
                  {week}
                </td>
                {statuses.map((status) => {
                  const val = counts[status] ?? 0;
                  const colorCls =
                    STATUS_COLORS[status] ?? "bg-zinc-800 text-zinc-400";
                  return (
                    <td key={status} className="text-right py-1.5 px-2">
                      {val > 0 ? (
                        <span
                          className={`inline-block min-w-[1.5rem] text-center rounded-full px-1.5 py-0.5 text-[10px] ${colorCls}`}
                        >
                          {val}
                        </span>
                      ) : (
                        <span className="text-zinc-700">0</span>
                      )}
                    </td>
                  );
                })}
                <td className="text-right py-1.5 px-2 text-zinc-300 font-medium tabular-nums">
                  {total}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export async function PipelineVelocitySection() {
  const rows = await getPipelineVelocity();
  return (
    <Section title="Pipeline Velocity">
      <VelocityTable rows={rows} />
    </Section>
  );
}
