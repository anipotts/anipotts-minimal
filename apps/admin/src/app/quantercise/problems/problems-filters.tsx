import Link from "next/link";

const PROBLEM_DIFFICULTIES = ["Easy", "Medium", "Hard"];

function getProblemsHref(params: {
  search?: string;
  difficulty?: string;
  offset?: string;
}) {
  const query = new URLSearchParams({
    ...(params.search ? { search: params.search } : {}),
    ...(params.difficulty ? { difficulty: params.difficulty } : {}),
    ...(params.offset ? { offset: params.offset } : {}),
  });

  return `/quantercise/problems?${query.toString()}`;
}

export function ProblemsFilterBar({
  search,
  difficulty,
  total,
}: {
  search?: string;
  difficulty?: string;
  total: number;
}) {
  return (
    <div className="flex gap-6 mb-4 items-center">
      <div className="text-[12px] text-zinc-500">
        <span className="text-zinc-200 font-medium">{total}</span> problems
      </div>

      <div className="flex gap-1.5">
        {PROBLEM_DIFFICULTIES.map((d) => {
          const isActive = difficulty === d;
          return (
            <Link
              key={d}
              href={getProblemsHref({
                search,
                difficulty: isActive ? undefined : d,
              })}
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
  );
}

export function ProblemsPagination({
  search,
  difficulty,
  currentOffset,
  hasMore,
  limit,
}: {
  search?: string;
  difficulty?: string;
  currentOffset: number;
  hasMore: boolean;
  limit: number;
}) {
  if (!hasMore && currentOffset <= 0) {
    return null;
  }

  return (
    <div className="flex gap-2 mt-4">
      {currentOffset > 0 && (
        <Link
          href={getProblemsHref({
            search,
            difficulty,
            offset: String(Math.max(0, currentOffset - limit)),
          })}
          className="px-3 py-1.5 rounded bg-zinc-800 text-[11px] text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          Previous
        </Link>
      )}
      {hasMore && (
        <Link
          href={getProblemsHref({
            search,
            difficulty,
            offset: String(currentOffset + limit),
          })}
          className="px-3 py-1.5 rounded bg-zinc-800 text-[11px] text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          Next
        </Link>
      )}
    </div>
  );
}
