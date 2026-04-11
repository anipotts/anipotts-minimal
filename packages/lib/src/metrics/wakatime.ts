/**
 * WakaTime API helpers for coding metrics.
 * Uses the v1 API with API key authentication.
 * Free tier: 14-day history — we cache in D1 to preserve longer history.
 */

import { LANGUAGE_COLORS, getLanguageColor } from "../utils/languages";

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
      color: LANGUAGE_COLORS["Other"] ?? "#6b7280",
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
