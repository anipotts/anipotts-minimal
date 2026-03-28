import clsx from "clsx";

interface ThroughputPoint {
  date: string;
  toolCalls: number;
  filesMutated: number;
}

interface ThroughputChartProps {
  data: ThroughputPoint[];
  className?: string;
}

export function ThroughputChart({ data, className }: ThroughputChartProps) {
  if (!data.length) return null;

  const width = 600;
  const height = 180;
  const chartHeight = 120;
  const chartTop = 24;
  const chartBottom = chartTop + chartHeight;
  const maxValue =
    data.reduce(
      (max, point) => Math.max(max, point.toolCalls, point.filesMutated),
      0,
    ) || 1;
  const barWidth = width / data.length;

  const linePoints = data
    .map((point, index) => {
      const x = index * barWidth + barWidth / 2;
      const y =
        chartBottom - (point.filesMutated / maxValue) * chartHeight || 0;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className={clsx("w-full", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-44"
        role="img"
        aria-label="Tool calls and files mutated over the last 30 days"
      >
        {[0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = chartBottom - chartHeight * ratio;
          return (
            <line
              key={ratio}
              x1={0}
              x2={width}
              y1={y}
              y2={y}
              stroke="rgba(var(--border-subtle),0.6)"
              strokeDasharray="4 4"
            />
          );
        })}

        {data.map((point, index) => {
          const barHeight = (point.toolCalls / maxValue) * chartHeight;
          const x = index * barWidth + 1;
          const y = chartBottom - barHeight;
          return (
            <rect
              key={point.date}
              x={x}
              y={y}
              width={Math.max(2, barWidth - 2)}
              height={barHeight}
              rx={2}
              fill="rgba(var(--accent-400),0.6)"
            />
          );
        })}

        <polyline
          points={linePoints}
          fill="none"
          stroke="rgba(var(--accent-400),0.9)"
          strokeWidth={2}
        />

        <circle
          cx={width - barWidth / 2}
          cy={
            chartBottom -
            ((data[data.length - 1]?.filesMutated ?? 0) / maxValue) *
              chartHeight
          }
          r={3}
          fill="rgba(var(--accent-400),1)"
        />

        <text x={0} y={height - 12} fill="rgba(var(--muted),1)" fontSize="10">
          {data[0]?.date}
        </text>
        <text
          x={width}
          y={height - 12}
          fill="rgba(var(--muted),1)"
          fontSize="10"
          textAnchor="end"
        >
          {data[data.length - 1]?.date}
        </text>
        <text
          x={width}
          y={16}
          fill="rgba(var(--muted),1)"
          fontSize="10"
          textAnchor="end"
        >
          max {maxValue.toLocaleString()}
        </text>
      </svg>
      <div className="flex items-center gap-4 text-[11px] text-tertiary font-mono">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-6 rounded-sm bg-[rgba(var(--accent-400),0.6)]" />
          tool calls
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-6 bg-[rgba(var(--accent-400),0.9)]" />
          files mutated
        </span>
      </div>
    </div>
  );
}
