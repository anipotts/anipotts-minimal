import { FadeIn } from "@anipotts/ui";
import { FaGithub, FaClock, FaCode, FaFire, FaCalendar, FaStar } from "react-icons/fa";
import { createClient } from "@anipotts/lib/supabase";
import type { GitHubStats, WakaTimeStats } from "@anipotts/lib/metrics";
import { CACHE_KEYS } from "@anipotts/lib/metrics";

// Revalidate every 60 seconds — cron runs daily but this ensures fresh reads
export const revalidate = 60;

/** Fallback values shown when cache is empty (before first cron run). */
const FALLBACK_GITHUB: GitHubStats = {
  totalCommits: 0,
  currentStreak: 0,
  longestStreak: 0,
  publicRepos: 0,
  totalStars: 0,
  fetchedAt: "",
};

const FALLBACK_WAKATIME: WakaTimeStats = {
  codingTimeWeek: "—",
  codingSecondsWeek: 0,
  dailyAverage: "—",
  dailyAverageSeconds: 0,
  topLanguages: [],
  fetchedAt: "",
};

async function getMetrics(): Promise<{
  github: GitHubStats;
  wakatime: WakaTimeStats;
  lastUpdated: string | null;
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      github: FALLBACK_GITHUB,
      wakatime: FALLBACK_WAKATIME,
      lastUpdated: null,
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const [githubRow, wakatimeRow] = await Promise.all([
    supabase
      .from("metrics_cache")
      .select("value, updated_at")
      .eq("key", CACHE_KEYS.GITHUB_STATS)
      .single(),
    supabase
      .from("metrics_cache")
      .select("value, updated_at")
      .eq("key", CACHE_KEYS.WAKATIME_STATS)
      .single(),
  ]);

  const github = (githubRow.data?.value as GitHubStats) ?? FALLBACK_GITHUB;
  const wakatime =
    (wakatimeRow.data?.value as WakaTimeStats) ?? FALLBACK_WAKATIME;

  // Use the most recent updated_at from either source
  const updatedTimes = [
    githubRow.data?.updated_at,
    wakatimeRow.data?.updated_at,
  ].filter(Boolean);
  const lastUpdated =
    updatedTimes.length > 0
      ? updatedTimes.sort().reverse()[0] ?? null
      : null;

  return { github, wakatime, lastUpdated };
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return "never";
  const diff = Date.now() - new Date(isoString).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function MetricsPage() {
  const { github, wakatime, lastUpdated } = await getMetrics();

  const statCards = [
    {
      label: "Total Commits",
      value: formatNumber(github.totalCommits),
      icon: FaGithub,
    },
    {
      label: "Current Streak",
      value: `${github.currentStreak} days`,
      icon: FaFire,
    },
    {
      label: "Longest Streak",
      value: `${github.longestStreak} days`,
      icon: FaCalendar,
    },
    {
      label: "This Week",
      value: wakatime.codingTimeWeek,
      icon: FaClock,
    },
    {
      label: "Public Repos",
      value: formatNumber(github.publicRepos),
      icon: FaGithub,
    },
    {
      label: "Total Stars",
      value: formatNumber(github.totalStars),
      icon: FaStar,
    },
  ];

  return (
    <div className="flex flex-col gap-8 py-8 px-4 max-w-4xl mx-auto">
      <FadeIn>
        <div className="border-b border-border pb-6">
          <h1 className="text-xs uppercase tracking-widest text-accent-400 mb-2">
            Coding Metrics
          </h1>
          <p className="text-muted text-sm">
            GitHub & WakaTime statistics
          </p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <FadeIn key={stat.label} delay={i * 0.08}>
            <div className="p-4 bg-input border border-border rounded-lg">
              <div className="flex items-center gap-2 text-muted text-xs mb-2">
                <stat.icon className="text-accent-400" />
                {stat.label}
              </div>
              <span className="text-2xl font-bold text-white">
                {stat.value}
              </span>
            </div>
          </FadeIn>
        ))}
      </div>

      {wakatime.topLanguages.length > 0 && (
        <FadeIn delay={0.5}>
          <div className="p-6 bg-input border border-border rounded-lg">
            <h2 className="text-xs uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
              <FaCode className="text-accent-400" />
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

      <FadeIn delay={0.6}>
        <div className="text-center pt-4 border-t border-border-subtle">
          <p className="text-xs text-faint">
            Data from GitHub API & WakaTime
            {lastUpdated && (
              <span className="ml-2 text-faint">
                · updated {formatRelativeTime(lastUpdated)}
              </span>
            )}
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
