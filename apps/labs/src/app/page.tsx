import Link from "next/link";
import { listExperiments, listWeekly } from "@/lib/content";
import { PageFrame } from "@/components/PageFrame";

export const dynamic = "force-static";

export default function HomePage() {
  const weekly = listWeekly();
  const experiments = listExperiments();

  return (
    <PageFrame>
      <header className="mb-16">
        <h1 className="font-mono text-2xl font-medium tracking-tight">
          anipotts / labs
        </h1>
        <p className="mt-3 max-w-prose text-[color:var(--muted)]">
          Observable artifacts from a personal autonomous framework. Bots
          publish weekly digests; experiments are tidied work I&rsquo;m
          comfortable showing in public. Source is split across two repos so
          the contract holds:{" "}
          <a
            href="https://github.com/anipotts/labs"
            className="text-[color:var(--accent)] hover:underline"
          >
            anipotts/labs
          </a>{" "}
          for bots,{" "}
          <a
            href="https://github.com/anipotts/anipotts.com"
            className="text-[color:var(--accent)] hover:underline"
          >
            anipotts.com
          </a>{" "}
          for humans.
        </p>
      </header>

      <section className="mb-16">
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
          Weekly digests
        </h2>
        {weekly.length === 0 ? (
          <p className="mt-4 text-sm text-[color:var(--muted)]">
            No digests cached yet. Run <code>pnpm fetch-bot-content</code>.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[color:var(--border)]">
            {weekly.map((w) => (
              <li key={w.slug}>
                <Link
                  href={`/weekly/${w.slug}`}
                  className="group flex items-baseline justify-between gap-6 py-4 transition-colors hover:bg-[color:var(--surface)] -mx-3 px-3 rounded"
                >
                  <span className="font-mono text-sm text-[color:var(--accent)]">
                    {w.week}
                  </span>
                  <span className="text-right text-sm text-[color:var(--muted)]">
                    {w.events != null
                      ? `${w.events} events · ${w.agents ?? 0} agents`
                      : "digest"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
          Experiments
        </h2>
        {experiments.length === 0 ? (
          <p className="mt-4 text-sm text-[color:var(--muted)]">
            Nothing here yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[color:var(--border)]">
            {experiments.map((e) => (
              <li key={e.slug}>
                <Link
                  href={`/experiments/${e.slug}`}
                  className="group flex items-baseline justify-between gap-6 py-4 transition-colors hover:bg-[color:var(--surface)] -mx-3 px-3 rounded"
                >
                  <span>
                    <span className="block text-sm">{e.title}</span>
                    {e.summary && (
                      <span className="mt-1 block text-xs text-[color:var(--muted)]">
                        {e.summary}
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-xs text-[color:var(--muted)]">
                    {e.date}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageFrame>
  );
}
