import Link from "next/link";

const QA_STATUSES = ["unreviewed", "verified", "flagged", "skipped"];
const QA_DIFFICULTIES = ["Easy", "Medium", "Hard"];

export function QAFilterBar({
  status,
  difficulty,
  filtered,
  total,
}: {
  status?: string;
  difficulty?: string;
  filtered: number;
  total: number;
}) {
  return (
    <div className="flex gap-4 my-4 items-center">
      <div className="text-[12px] text-zinc-500">
        <span className="text-zinc-200 font-medium">{filtered}</span> of {total}
      </div>

      <div className="flex gap-1.5">
        <QAFilterLink href="/quantercise/qa" active={!status}>
          All
        </QAFilterLink>
        {QA_STATUSES.map((s) => (
          <QAFilterLink
            key={s}
            href={`/quantercise/qa?${new URLSearchParams({
              status: status === s ? "" : s,
              ...(difficulty ? { difficulty } : {}),
            }).toString()}`}
            active={status === s}
          >
            {s}
          </QAFilterLink>
        ))}
      </div>

      <div className="flex gap-1.5 ml-auto">
        {QA_DIFFICULTIES.map((d) => (
          <QAFilterLink
            key={d}
            href={`/quantercise/qa?${new URLSearchParams({
              ...(status ? { status } : {}),
              ...(difficulty === d ? {} : { difficulty: d }),
            }).toString()}`}
            active={difficulty === d}
          >
            {d}
          </QAFilterLink>
        ))}
      </div>
    </div>
  );
}

function QAFilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
        active
          ? "bg-zinc-700 text-zinc-200"
          : "bg-zinc-800/40 text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {children}
    </Link>
  );
}
