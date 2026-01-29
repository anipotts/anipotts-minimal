/**
 * WakaTime API helpers for coding metrics.
 * Uses the v1 API with API key authentication.
 * Free tier: 14-day history — we cache in Supabase to preserve longer history.
 */

interface WakaTimeLanguage {
  name: string;
  percent: number;
  total_seconds: number;
  text: string;
}

export interface WakaTimeStats {
  codingTimeWeek: string;
  codingSecondsWeek: number;
  dailyAverage: string;
  dailyAverageSeconds: number;
  topLanguages: {
    name: string;
    percentage: number;
    color: string;
  }[];
  fetchedAt: string;
}

/** Standard language → color mapping (matches GitHub language colors). */
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Shell: "#89e051",
  Bash: "#89e051",
  SQL: "#e38c00",
  Markdown: "#083fa1",
  JSON: "#292929",
  YAML: "#cb171e",
  Docker: "#384d54",
  Lua: "#000080",
  Other: "#6b7280",
};

function getLanguageColor(name: string): string {
  return LANGUAGE_COLORS[name] ?? LANGUAGE_COLORS["Other"];
}

/**
 * Fetch WakaTime stats for the last 7 days.
 * @param apiKey - WakaTime API key (base64-encoded for Basic auth)
 */
export async function fetchWakaTimeStats(
  apiKey: string,
): Promise<WakaTimeStats> {
  const encoded = Buffer.from(apiKey).toString("base64");

  const res = await fetch(
    "https://wakatime.com/api/v1/users/current/stats/last_7_days",
    {
      headers: {
        Authorization: `Basic ${encoded}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error(`WakaTime API error: ${res.status}`);
  }

  const data = await res.json();
  const stats = data.data;

  // Parse total coding time
  const totalSeconds = stats.total_seconds ?? 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const codingTimeWeek = `${hours}h ${minutes}m`;

  // Parse daily average
  const dailySeconds = stats.daily_average ?? 0;
  const dailyH = Math.floor(dailySeconds / 3600);
  const dailyM = Math.floor((dailySeconds % 3600) / 60);
  const dailyAverage = `${dailyH}h ${dailyM}m`;

  // Parse top languages (top 5)
  const languages: WakaTimeLanguage[] = stats.languages ?? [];
  const topLanguages = languages.slice(0, 5).map((lang) => ({
    name: lang.name,
    percentage: Math.round(lang.percent * 10) / 10,
    color: getLanguageColor(lang.name),
  }));

  // If there are more languages, group as "Other"
  if (languages.length > 5) {
    const otherPercent = languages
      .slice(5)
      .reduce((sum, l) => sum + l.percent, 0);
    topLanguages.push({
      name: "Other",
      percentage: Math.round(otherPercent * 10) / 10,
      color: LANGUAGE_COLORS["Other"],
    });
  }

  return {
    codingTimeWeek,
    codingSecondsWeek: totalSeconds,
    dailyAverage,
    dailyAverageSeconds: dailySeconds,
    topLanguages,
    fetchedAt: new Date().toISOString(),
  };
}
