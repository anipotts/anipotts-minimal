import { Suspense } from "react";
import { FadeIn } from "@anipotts/ui";
import { createClient } from "@anipotts/lib/supabase";
import { getCacheValue, CACHE_KEYS } from "@anipotts/lib/metrics";
import { getServiceStatuses } from "@anipotts/lib/status";
import { monitoredServices } from "@anipotts/lib/data";
import type {
  GitHubLanguageBreakdown,
  GitHubStats,
  GitHubRecentActivity,
  WakaTimeStats,
  ContributionDay,
} from "@anipotts/lib/metrics";
import type { ServiceStatus } from "@anipotts/lib/status";
import type { Metadata } from "next";

import DevSectionTabs from "./components/DevSectionTabs";
import type { DevSection } from "./components/DevSectionTabs";
import StackSection from "./components/StackSection";
import MetricsSection from "./components/MetricsSection";
import ActivitySection from "./components/ActivitySection";
import type { GitHubEvent } from "./components/ActivitySection";
import ContributionHeatmap from "./components/ContributionHeatmap";
import StatusSection from "./components/StatusSection";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "dev",
  description: "Development setup, coding metrics, activity, and service status",
  openGraph: {
    title: "dev | ani potts",
    description: "Development setup, coding metrics, activity, and service status",
    url: "https://anipotts.com/dev",
    siteName: "anipotts.com",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "dev | ani potts",
    description: "Development setup, coding metrics, activity, and service status",
  },
  alternates: {
    canonical: "https://anipotts.com/dev",
  },
};

const FALLBACK_GITHUB: GitHubStats = {
  totalCommits: 0,
  currentStreak: 0,
  longestStreak: 0,
  publicRepos: 0,
  totalStars: 0,
  fetchedAt: "",
};

const FALLBACK_WAKATIME: WakaTimeStats = {
  codingTimeWeek: "\u2014",
  codingSecondsWeek: 0,
  dailyAverage: "\u2014",
  dailyAverageSeconds: 0,
  topLanguages: [],
  fetchedAt: "",
};

async function fetchAllDevData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      languages: null as GitHubLanguageBreakdown | null,
      github: FALLBACK_GITHUB,
      wakatime: FALLBACK_WAKATIME,
      metricsUpdated: null as string | null,
      commits: [] as GitHubRecentActivity["commits"],
      activityFetchedAt: null as string | null,
      calendarDays: [] as ContributionDay[],
      calendarFetchedAt: null as string | null,
      githubEvents: [] as GitHubEvent[],
      services: monitoredServices.map((s) => ({
        serviceName: s.name,
        serviceUrl: s.url,
        isUp: true,
        statusCode: null,
        responseTimeMs: 0,
        lastChecked: "",
        uptime24h: 100,
        uptime7d: 100,
      })) as ServiceStatus[],
      statusLastChecked: null as string | null,
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const [languagesResult, githubRow, wakatimeRow, activityResult, calendarResult, services, eventsResult] =
    await Promise.all([
      getCacheValue<GitHubLanguageBreakdown>(
        supabase,
        CACHE_KEYS.GITHUB_LANGUAGES,
      ).catch(() => null),
      Promise.resolve(
        supabase
          .from("metrics_cache")
          .select("value, updated_at")
          .eq("key", CACHE_KEYS.GITHUB_STATS)
          .single(),
      )
        .then((r) => r.data as { value: unknown; updated_at: string } | null)
        .catch(() => null),
      Promise.resolve(
        supabase
          .from("metrics_cache")
          .select("value, updated_at")
          .eq("key", CACHE_KEYS.WAKATIME_STATS)
          .single(),
      )
        .then((r) => r.data as { value: unknown; updated_at: string } | null)
        .catch(() => null),
      getCacheValue<GitHubRecentActivity>(
        supabase,
        CACHE_KEYS.GITHUB_ACTIVITY,
      ).catch(() => null),
      getCacheValue<{ days: ContributionDay[]; fetchedAt: string }>(
        supabase,
        CACHE_KEYS.GITHUB_CALENDAR,
      ).catch(() => null),
      getServiceStatuses(supabase).catch(() => [] as ServiceStatus[]),
      Promise.resolve(
        supabase
          .from("github_events")
          .select("id, event_type, event_action, repo, repo_url, payload, github_timestamp")
          .order("github_timestamp", { ascending: false })
          .limit(100),
      )
        .then((r) => (r.data ?? []) as GitHubEvent[])
        .catch(() => [] as GitHubEvent[]),
    ]);

  const github = (githubRow?.value as GitHubStats) ?? FALLBACK_GITHUB;
  const wakatime = (wakatimeRow?.value as WakaTimeStats) ?? FALLBACK_WAKATIME;

  const updatedTimes = [
    githubRow?.updated_at,
    wakatimeRow?.updated_at,
  ].filter(Boolean);
  const metricsUpdated =
    updatedTimes.length > 0
      ? updatedTimes.sort().reverse()[0] ?? null
      : null;

  const finalServices =
    services.length > 0
      ? services
      : monitoredServices.map((s) => ({
          serviceName: s.name,
          serviceUrl: s.url,
          isUp: true,
          statusCode: null,
          responseTimeMs: 0,
          lastChecked: "",
          uptime24h: 100,
          uptime7d: 100,
        }));

  const statusLastChecked =
    finalServices.length > 0
      ? finalServices.reduce<string | null>(
          (latest, s) =>
            s.lastChecked > (latest ?? "") ? s.lastChecked : latest,
          null,
        )
      : null;

  return {
    languages: languagesResult?.value ?? null,
    github,
    wakatime,
    metricsUpdated,
    commits: activityResult?.value.commits ?? [],
    activityFetchedAt: activityResult?.value.fetchedAt ?? null,
    calendarDays: calendarResult?.value.days ?? [],
    calendarFetchedAt: calendarResult?.value.fetchedAt ?? null,
    githubEvents: eventsResult,
    services: finalServices as ServiceStatus[],
    statusLastChecked,
  };
}

export default async function DevPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const params = await searchParams;
  const section = (params.section as DevSection) || "stack";
  const data = await fetchAllDevData();

  return (
    <div className="flex flex-col gap-12 py-12 px-4 max-w-4xl mx-auto">
      <FadeIn>
        <div className="border-b border-border pb-6">
          <h1 className="text-sm uppercase tracking-widest text-accent-400 mb-2">
            Dev Dashboard
          </h1>
          <p className="text-muted text-base mb-4">
            Tools, metrics, activity, and service status
          </p>
          <Suspense>
            <DevSectionTabs />
          </Suspense>
        </div>
      </FadeIn>

      {section === "stack" && <StackSection languages={data.languages} />}
      {section === "metrics" && (
        <MetricsSection
          github={data.github}
          wakatime={data.wakatime}
          lastUpdated={data.metricsUpdated}
        />
      )}
      {section === "activity" && (
        <>
          <ContributionHeatmap
            days={data.calendarDays}
            fetchedAt={data.calendarFetchedAt}
          />
          <ActivitySection
            commits={data.commits}
            events={data.githubEvents}
            fetchedAt={data.activityFetchedAt}
            isLive={data.githubEvents.length > 0}
          />
        </>
      )}
      {section === "status" && (
        <StatusSection
          services={data.services}
          lastChecked={data.statusLastChecked}
        />
      )}
    </div>
  );
}
