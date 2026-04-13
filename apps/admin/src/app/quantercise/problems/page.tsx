import { Suspense } from "react";
import Link from "next/link";
import { getQCProblems } from "@anipotts/lib/quantercise";
import type { QCProblem } from "@anipotts/lib/quantercise";
import {
  getQCEnv,
  QCPageLayout,
  PanelShell,
  PanelSkeleton,
  DifficultyBadge,
  EmptyState,
  ErrorPanel,
} from "../components";

export const dynamic = "force-dynamic";

function ProblemRow({ problem }: { problem: QCProblem }) {
  return (
    <Link
      href={`/quantercise/problems/${problem.id}`}
      className="flex items-center gap-4 px-4 py-2.5 hover:bg-zinc-800/30 transition-colors group"
    >
      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-zinc-200 truncate group-hover:text-white">
          {problem.title}
        </div>
        <div className="text-[10px] text-zinc-600 mt-0.5">
          {problem.topic} · {problem.type}
          {problem.isPreview && (
            <span className="ml-1.5 text-amber-400/70">(preview)</span>
          )}
        </div>
      </div>
      <DifficultyBadge difficulty={problem.difficulty} />
      <span className="text-[10px] text-zinc-600 w-20 text-right">
        {problem.tags.length > 0 ? problem.tags.slice(0, 2).join(", ") : ""}
      </span>
    </Link>
  );
}

async function ProblemsContent({
  search,
  difficulty,
  offset,
}: {
  search?: string;
  difficulty?: string;
  offset?: number;
}) {
  const limit = 50;
  let data;
  try {
    data = await getQCProblems(getQCEnv(), {
      limit,
      offset: offset ?? 0,
      search,
      difficulty,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return <ErrorPanel title="Problems" message={msg} />;
  }

  const { problems, total, hasMore } = data;
  const currentOffset = offset ?? 0;

  return (
    <>
      <div className="flex gap-6 mb-4 items-center">
        <div className="text-[12px] text-zinc-500">
          <span className="text-zinc-200 font-medium">{total}</span> problems
        </div>

        <div className="flex gap-1.5">
          {["Easy", "Medium", "Hard"].map((d) => {
            const isActive = difficulty === d;
            return (
              <Link
                key={d}
                href={`/quantercise/problems?${new URLSearchParams({
                  ...(search ? { search } : {}),
                  ...(isActive ? {} : { difficulty: d }),
                }).toString()}`}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-700 text-zinc-200"
                    : "bg-zinc-800/40 text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {d}
              </Link>
            );
          })}
        </div>
      </div>

      <PanelShell title={search ? `Results for "${search}"` : "All Problems"}>
        {problems.length === 0 ? (
          <EmptyState message="No problems found." />
        ) : (
          <div className="divide-y divide-zinc-800/40 -mx-4 -mb-4">
            {problems.map((p) => (
              <ProblemRow key={p.id} problem={p} />
            ))}
          </div>
        )}
      </PanelShell>

      {(hasMore || currentOffset > 0) && (
        <div className="flex gap-2 mt-4">
          {currentOffset > 0 && (
            <Link
              href={`/quantercise/problems?${new URLSearchParams({
                ...(search ? { search } : {}),
                ...(difficulty ? { difficulty } : {}),
                offset: String(Math.max(0, currentOffset - limit)),
              }).toString()}`}
              className="px-3 py-1.5 rounded bg-zinc-800 text-[11px] text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Previous
            </Link>
          )}
          {hasMore && (
            <Link
              href={`/quantercise/problems?${new URLSearchParams({
                ...(search ? { search } : {}),
                ...(difficulty ? { difficulty } : {}),
                offset: String(currentOffset + limit),
              }).toString()}`}
              className="px-3 py-1.5 rounded bg-zinc-800 text-[11px] text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </>
  );
}

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    difficulty?: string;
    offset?: string;
  }>;
}) {
  const params = await searchParams;
  const offset = params.offset ? parseInt(params.offset, 10) : undefined;

  return (
    <QCPageLayout title="Problems">
      <Suspense fallback={<PanelSkeleton title="Problems" />}>
        <ProblemsContent
          search={params.search}
          difficulty={params.difficulty}
          offset={offset}
        />
      </Suspense>
    </QCPageLayout>
  );
}
