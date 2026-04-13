import { Suspense } from "react";
import Link from "next/link";
import { getQCQA } from "@anipotts/lib/quantercise";
import type { QCQAItem, QCQAResponse } from "@anipotts/lib/quantercise";
import {
  getQCEnv,
  QCPageLayout,
  PanelShell,
  PanelSkeleton,
  DifficultyBadge,
  StatusBadge,
  EmptyState,
  ErrorPanel,
} from "../components";

export const dynamic = "force-dynamic";

const QA_STATUS_COLORS: Record<string, string> = {
  verified: "bg-emerald-500/10 text-emerald-400",
  flagged: "bg-red-500/10 text-red-400",
  skipped: "bg-zinc-500/10 text-zinc-400",
  unreviewed: "bg-yellow-500/10 text-yellow-400",
};

function StatsBar({ stats }: { stats: NonNullable<QCQAResponse["stats"]> }) {
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

function QARow({ item }: { item: QCQAItem }) {
  return (
    <Link
      href={`/quantercise/problems/${item.id}`}
      className="flex items-center gap-4 px-4 py-2.5 hover:bg-zinc-800/30 transition-colors group"
    >
      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-zinc-200 truncate group-hover:text-white">
          {item.title}
        </div>
        <div className="flex gap-2 mt-0.5 text-[10px] text-zinc-600">
          <span>{item.topic}</span>
          {item.tags && item.tags.length > 0 && (
            <span>{item.tags.slice(0, 2).join(", ")}</span>
          )}
        </div>
      </div>
      <DifficultyBadge difficulty={item.difficulty} />
      <StatusBadge status={item.qaStatus} colorMap={QA_STATUS_COLORS} />
      {item.severity && (
        <StatusBadge
          status={item.severity}
          colorMap={{
            critical: "bg-red-500/10 text-red-400",
            high: "bg-orange-500/10 text-orange-400",
            medium: "bg-amber-500/10 text-amber-400",
            low: "bg-zinc-500/10 text-zinc-400",
          }}
        />
      )}
    </Link>
  );
}

async function QAContent({
  status,
  difficulty,
}: {
  status?: string;
  difficulty?: string;
}) {
  let data: QCQAResponse;
  try {
    data = await getQCQA(getQCEnv(), {
      status,
      difficulty,
      includeStats: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return <ErrorPanel title="QA" message={msg} />;
  }

  const { problems, total, filtered, stats } = data;
  const statuses = ["unreviewed", "verified", "flagged", "skipped"];

  return (
    <>
      {stats && <StatsBar stats={stats} />}

      <div className="flex gap-4 my-4 items-center">
        <div className="text-[12px] text-zinc-500">
          <span className="text-zinc-200 font-medium">{filtered}</span> of{" "}
          {total}
        </div>

        <div className="flex gap-1.5">
          <Link
            href="/quantercise/qa"
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              !status
                ? "bg-zinc-700 text-zinc-200"
                : "bg-zinc-800/40 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            All
          </Link>
          {statuses.map((s) => (
            <Link
              key={s}
              href={`/quantercise/qa?${new URLSearchParams({
                status: status === s ? "" : s,
                ...(difficulty ? { difficulty } : {}),
              }).toString()}`}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                status === s
                  ? "bg-zinc-700 text-zinc-200"
                  : "bg-zinc-800/40 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {s}
            </Link>
          ))}
        </div>

        <div className="flex gap-1.5 ml-auto">
          {["Easy", "Medium", "Hard"].map((d) => (
            <Link
              key={d}
              href={`/quantercise/qa?${new URLSearchParams({
                ...(status ? { status } : {}),
                ...(difficulty === d ? {} : { difficulty: d }),
              }).toString()}`}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                difficulty === d
                  ? "bg-zinc-700 text-zinc-200"
                  : "bg-zinc-800/40 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {d}
            </Link>
          ))}
        </div>
      </div>

      <PanelShell title="Problems">
        {problems.length === 0 ? (
          <EmptyState message="No problems match the selected filters." />
        ) : (
          <div className="divide-y divide-zinc-800/40 -mx-4 -mb-4">
            {problems.map((item) => (
              <QARow key={item.id} item={item} />
            ))}
          </div>
        )}
      </PanelShell>
    </>
  );
}

export default async function QAPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; difficulty?: string }>;
}) {
  const params = await searchParams;
  return (
    <QCPageLayout title="QA Review">
      <Suspense
        fallback={
          <div className="space-y-4">
            <PanelSkeleton title="Review Progress" />
            <PanelSkeleton title="Problems" />
          </div>
        }
      >
        <QAContent status={params.status} difficulty={params.difficulty} />
      </Suspense>
    </QCPageLayout>
  );
}
