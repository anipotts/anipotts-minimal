import { FadeIn } from "@anipotts/ui";
import { formatNumber, formatShortRelativeTime } from "@anipotts/lib";
import type { GitHubStats, WakaTimeStats } from "@anipotts/lib/metrics";

export default function MetricsSection({
  github,
  wakatime,
  lastUpdated,
}: {
  github: GitHubStats;
  wakatime: WakaTimeStats;
  lastUpdated: string | null;
}) {
  const statCards = [
    { label: "Total Commits", value: formatNumber(github.totalCommits) },
    { label: "Current Streak", value: `${github.currentStreak} days` },
    { label: "Longest Streak", value: `${github.longestStreak} days` },
    { label: "This Week", value: wakatime.codingTimeWeek },
    { label: "Daily Average", value: wakatime.dailyAverage },
    { label: "Public Repos", value: formatNumber(github.publicRepos) },
    { label: "Total Stars", value: formatNumber(github.totalStars) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <FadeIn key={stat.label} delay={i * 0.05}>
            <div className="p-6 bg-input border border-border rounded-lg">
              <div className="text-muted text-sm mb-2">{stat.label}</div>
              <span className="text-3xl font-bold text-body">{stat.value}</span>
            </div>
          </FadeIn>
        ))}
      </div>

      {wakatime.topLanguages.length > 0 && (
        <FadeIn delay={0.3}>
          <div className="p-6 bg-input border border-border rounded-lg">
            <h2 className="text-xs uppercase tracking-widest text-muted mb-4">
              Top Languages (last 7 days)
            </h2>
            <div className="space-y-3">
              {wakatime.topLanguages.map((lang) => (
                <div key={lang.name} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-secondary truncate">
                    {lang.name}
                  </span>
                  <div className="flex-grow h-2 bg-overlay-10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${lang.percentage}%`,
                        backgroundColor: lang.color,
                      }}
                    />
                  </div>
                  <span className="w-14 text-xs text-muted text-right">
                    {lang.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      )}

      <FadeIn delay={0.4}>
        <div className="text-center pt-4 border-t border-border-subtle">
          <p className="text-xs text-faint">
            Data from{" "}
            <a
              href="https://github.com/anipotts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-400 hover:underline"
            >
              GitHub API
            </a>
            {" & "}
            <a
              href="https://wakatime.com/@anipotts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-400 hover:underline"
            >
              WakaTime
            </a>
            {lastUpdated && (
              <span className="ml-2 text-faint">
                updated {formatShortRelativeTime(lastUpdated)}
              </span>
            )}
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
