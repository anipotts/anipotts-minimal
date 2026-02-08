import { FadeIn } from "@anipotts/ui";
import { FaCodeBranch, FaExternalLinkAlt } from "react-icons/fa";
import { createClient } from "@anipotts/lib/supabase";
import { getCacheValue, CACHE_KEYS } from "@anipotts/lib/metrics";
import type { GitHubRecentActivity, GitHubCommit } from "@anipotts/lib/metrics";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "updates | ani potts",
  description: "Recent activity and commits from ani potts",
  openGraph: {
    title: "updates | ani potts",
    description: "Recent activity and commits from ani potts",
    url: "https://anipotts.com/updates",
    siteName: "anipotts.com",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "updates | ani potts",
    description: "Recent activity and commits from ani potts",
  },
  alternates: {
    canonical: "https://anipotts.com/updates",
  },
};

async function getActivity(): Promise<{
  commits: GitHubCommit[];
  fetchedAt: string | null;
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { commits: [], fetchedAt: null };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const cached = await getCacheValue<GitHubRecentActivity>(
      supabase,
      CACHE_KEYS.GITHUB_ACTIVITY,
    );

    if (!cached) return { commits: [], fetchedAt: null };

    return {
      commits: cached.value.commits,
      fetchedAt: cached.value.fetchedAt,
    };
  } catch (e) {
    console.error("Error fetching activity:", e);
    return { commits: [], fetchedAt: null };
  }
}

/** Group commits by date, then by repo within each date. */
function groupCommits(
  commits: GitHubCommit[],
): { date: string; repos: { name: string; commits: GitHubCommit[] }[] }[] {
  const byDate = new Map<string, Map<string, GitHubCommit[]>>();

  for (const commit of commits) {
    const date = commit.date.split("T")[0];
    if (!byDate.has(date)) byDate.set(date, new Map());
    const dateMap = byDate.get(date)!;
    if (!dateMap.has(commit.repo)) dateMap.set(commit.repo, []);
    dateMap.get(commit.repo)!.push(commit);
  }

  // Sort dates descending
  return Array.from(byDate.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, repoMap]) => ({
      date,
      repos: Array.from(repoMap.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .map(([name, commits]) => ({ name, commits })),
    }));
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayStr = today.toISOString().split("T")[0];
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (dateStr === todayStr) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function UpdatesPage() {
  const { commits, fetchedAt } = await getActivity();
  const grouped = groupCommits(commits);
  const totalCommits = commits.length;
  const repoCount = new Set(commits.map((c) => c.repo)).size;

  return (
    <div className="flex flex-col gap-8 py-8 px-4 max-w-3xl mx-auto">
      <FadeIn>
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-xs uppercase tracking-widest text-accent-400 mb-2">
              Recent Activity
            </h1>
            <p className="text-muted text-sm">
              {totalCommits > 0
                ? `${totalCommits} commits across ${repoCount} repos — last 30 days`
                : "What I've been shipping"}
            </p>
          </div>
          {fetchedAt && (
            <div className="text-right">
              <span className="text-[10px] text-muted uppercase tracking-wider">
                Updated
              </span>
              <p className="text-xs text-tertiary">
                {formatRelativeTime(fetchedAt)}
              </p>
            </div>
          )}
        </div>
      </FadeIn>

      {grouped.length > 0 ? (
        <div className="space-y-8">
          {grouped.map((day, dayIdx) => (
            <FadeIn key={day.date} delay={dayIdx * 0.05}>
              <div>
                {/* Date header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-tertiary">
                    {formatDate(day.date)}
                  </span>
                  <span className="text-[10px] text-faint font-mono">
                    {day.date}
                  </span>
                </div>

                {/* Repos for this date */}
                <div className="space-y-3 ml-2 border-l border-border pl-4">
                  {day.repos.map((repo) => (
                    <div key={repo.name}>
                      <div className="flex items-center gap-2 mb-2">
                        <FaCodeBranch className="text-accent-400 text-xs" />
                        <span className="text-sm text-secondary font-mono">
                          {repo.name}
                        </span>
                        <span className="text-[10px] text-faint">
                          {repo.commits.length} commit{repo.commits.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <ul className="space-y-1 ml-4">
                        {repo.commits.map((commit) => (
                          <li key={commit.sha} className="flex items-start gap-2 group">
                            <span className="text-[10px] text-faint font-mono mt-0.5 shrink-0">
                              {commit.sha}
                            </span>
                            <span className="text-sm text-tertiary leading-snug">
                              {commit.message}
                            </span>
                            <a
                              href={commit.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
                            >
                              <FaExternalLinkAlt className="text-[10px] text-faint hover:text-accent-400" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      ) : (
        /* Fallback: static changelog when no cached data */
        <div className="space-y-6">
          <FadeIn delay={0.1}>
            <div className="border-l-2 border-accent-400/30 pl-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-1 bg-accent-400/10 text-accent-400 rounded text-xs font-mono">
                  v3.0.0
                </span>
                <span className="text-muted text-xs">anipotts.com</span>
                <span className="text-faint text-xs">2025-01-05</span>
              </div>
              <ul className="space-y-2 text-sm text-secondary">
                <li>Converted to Turborepo monorepo architecture</li>
                <li>Added 10 subdomain apps</li>
                <li>Shared UI component library</li>
              </ul>
            </div>
          </FadeIn>
        </div>
      )}

      <FadeIn delay={0.5}>
        <div className="text-center pt-4 border-t border-border-subtle">
          <p className="text-xs text-faint">
            Synced from GitHub daily • Public repos only
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
