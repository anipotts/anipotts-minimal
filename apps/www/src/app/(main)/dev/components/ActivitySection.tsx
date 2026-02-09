import { FadeIn } from "@anipotts/ui";
import type { GitHubCommit } from "@anipotts/lib/metrics";

export interface GitHubEvent {
  id: string;
  event_type: string;
  event_action: string | null;
  repo: string;
  repo_url: string | null;
  payload: Record<string, unknown>;
  github_timestamp: string;
}

type ActivityItem =
  | { type: "commit"; commit: GitHubCommit; repo: string; date: string }
  | { type: "event"; event: GitHubEvent; date: string };

interface DayGroup {
  date: string;
  repos: {
    name: string;
    commits: GitHubCommit[];
    events: GitHubEvent[];
  }[];
}

function buildActivityGroups(
  commits: GitHubCommit[],
  events: GitHubEvent[]
): DayGroup[] {
  const byDate = new Map<
    string,
    Map<string, { commits: GitHubCommit[]; events: GitHubEvent[] }>
  >();

  for (const commit of commits) {
    const date = commit.date.split("T")[0];
    if (!byDate.has(date)) byDate.set(date, new Map());
    const dateMap = byDate.get(date)!;
    if (!dateMap.has(commit.repo))
      dateMap.set(commit.repo, { commits: [], events: [] });
    dateMap.get(commit.repo)!.commits.push(commit);
  }

  for (const event of events) {
    // Skip push events since commits already cover those
    if (event.event_type === "push") continue;
    const date = event.github_timestamp.split("T")[0];
    if (!byDate.has(date)) byDate.set(date, new Map());
    const dateMap = byDate.get(date)!;
    if (!dateMap.has(event.repo))
      dateMap.set(event.repo, { commits: [], events: [] });
    dateMap.get(event.repo)!.events.push(event);
  }

  return Array.from(byDate.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, repoMap]) => ({
      date,
      repos: Array.from(repoMap.entries())
        .sort(
          (a, b) =>
            b[1].commits.length +
            b[1].events.length -
            (a[1].commits.length + a[1].events.length)
        )
        .map(([name, data]) => ({ name, ...data })),
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

function EventCard({ event }: { event: GitHubEvent }) {
  const { event_type, event_action, payload } = event;

  if (event_type === "pull_request") {
    const merged = payload.merged as boolean;
    const number = payload.number as number;
    const title = payload.title as string;
    const url = payload.url as string | undefined;
    const label = merged ? "Merged" : event_action === "opened" ? "Opened" : "Closed";
    const color = merged
      ? "text-purple-400"
      : event_action === "opened"
        ? "text-green-400"
        : "text-red-400";

    return (
      <div className="flex items-start gap-2 group">
        <span className={`text-[11px] font-mono mt-0.5 shrink-0 ${color}`}>
          PR
        </span>
        <span className="text-sm text-tertiary leading-snug">
          {label} #{number}: {title}
        </span>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5 text-[11px] text-faint hover:text-accent-400"
          >
            view
          </a>
        )}
      </div>
    );
  }

  if (event_type === "release") {
    const tag = payload.tag as string;
    const name = payload.name as string;
    const url = payload.url as string | undefined;
    return (
      <div className="flex items-start gap-2 group">
        <span className="text-[11px] font-mono mt-0.5 shrink-0 text-accent-400">
          REL
        </span>
        <span className="text-sm text-tertiary leading-snug">
          Released {tag}{name && name !== tag ? ` (${name})` : ""}
        </span>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5 text-[11px] text-faint hover:text-accent-400"
          >
            view
          </a>
        )}
      </div>
    );
  }

  if (event_type === "star") {
    const count = payload.stargazers_count as number;
    return (
      <div className="flex items-start gap-2">
        <span className="text-[11px] font-mono mt-0.5 shrink-0 text-yellow-400">
          ★
        </span>
        <span className="text-sm text-tertiary leading-snug">
          New star ({count} total)
        </span>
      </div>
    );
  }

  if (event_type === "create") {
    const refType = payload.ref_type as string;
    const ref = payload.ref as string;
    return (
      <div className="flex items-start gap-2">
        <span className="text-[11px] font-mono mt-0.5 shrink-0 text-blue-400">
          NEW
        </span>
        <span className="text-sm text-tertiary leading-snug">
          Created {refType} {ref}
        </span>
      </div>
    );
  }

  return null;
}

export default function ActivitySection({
  commits,
  events = [],
  fetchedAt,
  isLive = false,
}: {
  commits: GitHubCommit[];
  events?: GitHubEvent[];
  fetchedAt: string | null;
  isLive?: boolean;
}) {
  const grouped = buildActivityGroups(commits, events);
  const totalCommits = commits.length;
  const repoCount = new Set([
    ...commits.map((c) => c.repo),
    ...events.map((e) => e.repo),
  ]).size;

  return (
    <div className="flex flex-col gap-6">
      <FadeIn>
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
          <p className="text-muted text-sm">
            {totalCommits > 0
              ? `${totalCommits} commits across ${repoCount} repos`
              : "What I've been shipping"}
          </p>
          {fetchedAt && (
            <span className="text-[11px] text-faint">
              updated {formatRelativeTime(fetchedAt)}
            </span>
          )}
        </div>
      </FadeIn>

      {grouped.length > 0 ? (
        <div className="space-y-8">
          {grouped.map((day, dayIdx) => (
            <FadeIn key={day.date} delay={dayIdx * 0.03}>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-tertiary">
                    {formatDate(day.date)}
                  </span>
                  <span className="text-[11px] text-faint font-mono">
                    {day.date}
                  </span>
                </div>

                <div className="space-y-3 ml-2 border-l border-border pl-4">
                  {day.repos.map((repo) => (
                    <div key={repo.name}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-secondary font-mono">
                          {repo.name}
                        </span>
                        {repo.commits.length > 0 && (
                          <span className="text-[11px] text-faint">
                            {repo.commits.length} commit
                            {repo.commits.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {/* Events (PRs, releases, etc.) */}
                      {repo.events.length > 0 && (
                        <ul className="space-y-1.5 ml-4 mb-2">
                          {repo.events.map((event) => (
                            <li key={event.id}>
                              <EventCard event={event} />
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Commits */}
                      {repo.commits.length > 0 && (
                        <ul className="space-y-1 ml-4">
                          {repo.commits.map((commit) => (
                            <li
                              key={commit.sha}
                              className="flex items-start gap-2 group"
                            >
                              <span className="text-[11px] text-faint font-mono mt-0.5 shrink-0">
                                {commit.sha}
                              </span>
                              <span className="text-sm text-tertiary leading-snug">
                                {commit.message}
                              </span>
                              <a
                                href={commit.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5 text-[11px] text-faint hover:text-accent-400"
                              >
                                view
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      ) : (
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
      )}

      <FadeIn delay={0.3}>
        <div className="text-center pt-4 border-t border-border-subtle">
          <p className="text-xs text-faint">
            {isLive ? "Live from GitHub" : "Synced from GitHub daily"}
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
