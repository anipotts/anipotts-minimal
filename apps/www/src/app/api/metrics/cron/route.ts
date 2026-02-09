import { NextResponse } from "next/server";
import { createClient } from "@anipotts/lib/supabase";
import {
  fetchGitHubStats,
  fetchRepoLanguages,
  fetchRecentCommits,
  fetchContributionCalendar,
  fetchWakaTimeStats,
  setCacheValue,
  CACHE_KEYS,
} from "@anipotts/lib/metrics";

/**
 * Vercel Cron handler — runs daily at 6 AM UTC.
 * Fetches GitHub stats, languages, recent commits, and WakaTime stats.
 * Caches everything in Supabase.
 *
 * Required env vars:
 *   CRON_SECRET        — shared secret to authenticate cron requests
 *   GITHUB_TOKEN       — GitHub PAT with read:user scope
 *   GITHUB_USERNAME    — GitHub username to fetch stats for
 *   WAKATIME_API_KEY   — WakaTime API key
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
export async function GET(request: Request) {
  // Verify cron secret (Vercel sends this header for cron jobs)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const results: Record<string, string> = {};

  // Fetch all GitHub data
  const githubToken = process.env.GITHUB_TOKEN;
  const githubUsername = process.env.GITHUB_USERNAME ?? "anipotts";

  if (githubToken) {
    // Stats (commits, streaks, stars)
    try {
      const githubStats = await fetchGitHubStats(githubUsername, githubToken);
      await setCacheValue(supabase, CACHE_KEYS.GITHUB_STATS, githubStats);
      results.github = "ok";
    } catch (err) {
      console.error("GitHub stats fetch failed:", err);
      results.github = `error: ${err instanceof Error ? err.message : "unknown"}`;
    }

    // Language breakdown (for dev page)
    try {
      const languages = await fetchRepoLanguages(githubUsername, githubToken);
      await setCacheValue(supabase, CACHE_KEYS.GITHUB_LANGUAGES, languages);
      results.github_languages = "ok";
    } catch (err) {
      console.error("GitHub languages fetch failed:", err);
      results.github_languages = `error: ${err instanceof Error ? err.message : "unknown"}`;
    }

    // Recent commits (for updates page)
    try {
      const activity = await fetchRecentCommits(githubUsername, githubToken);
      await setCacheValue(supabase, CACHE_KEYS.GITHUB_ACTIVITY, activity);
      results.github_activity = "ok";
    } catch (err) {
      console.error("GitHub activity fetch failed:", err);
      results.github_activity = `error: ${err instanceof Error ? err.message : "unknown"}`;
    }

    // Contribution calendar (for heatmap on dev page)
    try {
      const calendarDays = await fetchContributionCalendar(githubUsername, githubToken);
      await setCacheValue(supabase, CACHE_KEYS.GITHUB_CALENDAR, {
        days: calendarDays,
        fetchedAt: new Date().toISOString(),
      });
      results.github_calendar = "ok";
    } catch (err) {
      console.error("GitHub calendar fetch failed:", err);
      results.github_calendar = `error: ${err instanceof Error ? err.message : "unknown"}`;
    }
  } else {
    results.github = "skipped (no GITHUB_TOKEN)";
    results.github_languages = "skipped (no GITHUB_TOKEN)";
    results.github_activity = "skipped (no GITHUB_TOKEN)";
    results.github_calendar = "skipped (no GITHUB_TOKEN)";
  }

  // Fetch WakaTime stats
  const wakatimeKey = process.env.WAKATIME_API_KEY;

  if (wakatimeKey) {
    try {
      const wakatimeStats = await fetchWakaTimeStats(wakatimeKey);
      await setCacheValue(supabase, CACHE_KEYS.WAKATIME_STATS, wakatimeStats);
      results.wakatime = "ok";
    } catch (err) {
      console.error("WakaTime fetch failed:", err);
      results.wakatime = `error: ${err instanceof Error ? err.message : "unknown"}`;
    }
  } else {
    results.wakatime = "skipped (no WAKATIME_API_KEY)";
  }

  const hasErrors = Object.values(results).some((v) => v.startsWith("error"));

  return NextResponse.json(
    {
      success: !hasErrors,
      results,
      timestamp: new Date().toISOString(),
    },
    hasErrors ? { status: 500 } : undefined,
  );
}
