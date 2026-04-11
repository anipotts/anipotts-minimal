import { Suspense } from "react";
import {
  getPipelineVelocity,
  getSeriesPerformance,
} from "@anipotts/lib/analytics";
import type {
  PipelineVelocityRow,
  SeriesPerformanceRow,
} from "@anipotts/lib/analytics";
import { STATUS_COLORS, SERIES_COLORS } from "@/lib/constants";
import { Section, SectionSkeleton } from "@/components/shared/section";

export const dynamic = "force-dynamic";

// Pipeline velocity table

function VelocityTable({ rows }: { rows: PipelineVelocityRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-[12px] text-zinc-600">
        No content data available yet.
      </p>
    );
  }

  // Pivot: group rows by week, show status counts per week
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
            {statuses.map((s) => (
              <th
                key={s}
                className="text-right py-1.5 px-2 text-[10px] text-zinc-500 uppercase tracking-wide font-medium"
              >
                {s}
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
                {statuses.map((s) => {
                  const val = counts[s] ?? 0;
                  const colorCls =
                    STATUS_COLORS[s] ?? "bg-zinc-800 text-zinc-400";
                  return (
                    <td key={s} className="text-right py-1.5 px-2">
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

async function PipelineVelocitySection() {
  const rows = await getPipelineVelocity();
  return (
    <Section title="Pipeline Velocity">
      <VelocityTable rows={rows} />
    </Section>
  );
}

// Series performance table

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

async function SeriesPerformanceSection() {
  const rows = await getSeriesPerformance();
  return (
    <Section title="Series Performance">
      <SeriesTable rows={rows} />
    </Section>
  );
}

// Typefully card

async function TypefullyCard() {
  const apiKey = process.env.TYPEFULLY_API_KEY;

  if (!apiKey) {
    return (
      <Section title="Typefully">
        <p className="text-[12px] text-zinc-600">
          Connect Typefully by adding TYPEFULLY_API_KEY to your environment.
        </p>
      </Section>
    );
  }

  let draftCount = 0;
  let error: string | null = null;

  try {
    const res = await fetch("https://api.typefully.com/v1/drafts", {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      error = `API returned ${res.status}`;
    } else {
      const data = (await res.json()) as unknown[];
      draftCount = Array.isArray(data) ? data.length : 0;
    }
  } catch {
    error = "Failed to reach Typefully API";
  }

  if (error) {
    return (
      <Section title="Typefully">
        <p className="text-[12px] text-amber-400/70">{error}</p>
      </Section>
    );
  }

  return (
    <Section title="Typefully">
      <div className="flex items-baseline gap-2">
        <span className="text-[20px] font-medium text-zinc-100">
          {draftCount}
        </span>
        <span className="text-[11px] text-zinc-500">drafts in queue</span>
      </div>
    </Section>
  );
}

// Placeholder cards

function InstagramPlaceholder() {
  return (
    <Section title="Instagram">
      <p className="text-[12px] text-zinc-600">
        Connect Instagram to see post analytics here.
      </p>
    </Section>
  );
}

function PostHogPlaceholder() {
  return (
    <Section title="PostHog">
      <a
        href="https://us.posthog.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[12px] text-blue-400 hover:text-blue-300 transition-colors"
      >
        View Analytics
      </a>
    </Section>
  );
}

// Page

export default function ContentAnalyticsPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 border-b border-zinc-800/60 px-6 py-3">
        <h2 className="text-[13px] font-medium text-zinc-200">
          Content Analytics
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto admin-scroll p-6 space-y-4">
        <Suspense fallback={<SectionSkeleton title="Pipeline Velocity" />}>
          <PipelineVelocitySection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton title="Series Performance" />}>
          <SeriesPerformanceSection />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<SectionSkeleton title="Typefully" />}>
            <TypefullyCard />
          </Suspense>
          <InstagramPlaceholder />
        </div>

        <PostHogPlaceholder />
      </div>
    </div>
  );
}
