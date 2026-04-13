import { Suspense } from "react";
import {
  getQCObservability,
  getQCFailedEvents,
} from "@anipotts/lib/quantercise";
import type { QCObservability, QCFailedEvent } from "@anipotts/lib/quantercise";
import {
  getQCEnv,
  QCPageLayout,
  PanelShell,
  PanelSkeleton,
  StatusBadge,
  MetricCard,
  EmptyState,
  ErrorPanel,
} from "../components";
import { FailedEventActions } from "./failed-event-actions";

export const dynamic = "force-dynamic";

function ServiceHealthPanel({ data }: { data: QCObservability }) {
  const services = Object.values(data.health);

  return (
    <PanelShell title="Services">
      <div className="space-y-2">
        {services.map((s) => (
          <div key={s.service} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  s.status === "healthy"
                    ? "bg-emerald-400"
                    : s.status === "degraded"
                      ? "bg-amber-400"
                      : "bg-red-400"
                }`}
              />
              <span className="text-[12px] text-zinc-300">{s.service}</span>
            </div>
            <div className="flex items-center gap-3">
              {s.latency !== undefined && (
                <span className="text-[10px] font-mono text-zinc-500">
                  {s.latency}ms
                </span>
              )}
              <StatusBadge status={s.status} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-[9px] text-zinc-600">
        Last checked:{" "}
        {new Date(data.lastUpdated).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })}
      </div>
    </PanelShell>
  );
}

function MetricsPanel({ data }: { data: QCObservability }) {
  const { metrics } = data;
  return (
    <PanelShell title="System Metrics">
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Active Users (24h)"
          value={metrics.activeUsers24h}
          color="text-blue-400"
        />
        <MetricCard
          label="Errors (1h)"
          value={metrics.errorsLast1h}
          color={metrics.errorsLast1h > 0 ? "text-red-400" : "text-emerald-400"}
        />
        <MetricCard
          label="Submissions (24h)"
          value={metrics.submissionsLast24h}
          color="text-violet-400"
        />
        <MetricCard
          label="Avg Response"
          value={`${metrics.avgResponseTimeMs}ms`}
          color="text-amber-400"
        />
      </div>
    </PanelShell>
  );
}

function RateLimitPanel({ data }: { data: QCObservability }) {
  const { rateLimiting } = data;
  return (
    <PanelShell title="Rate Limiting">
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-[12px] text-zinc-500">Redis</span>
          <StatusBadge
            status={rateLimiting.redisAvailable ? "healthy" : "error"}
          />
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[12px] text-zinc-500">In-memory store</span>
          <span className="text-[12px] font-mono text-zinc-300">
            {rateLimiting.inMemoryStoreSize}
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[12px] text-zinc-500">Recent violations</span>
          <span
            className={`text-[12px] font-mono ${rateLimiting.recentViolations > 0 ? "text-amber-400" : "text-zinc-400"}`}
          >
            {rateLimiting.recentViolations}
          </span>
        </div>
      </div>
    </PanelShell>
  );
}

function FailedEventRow({ event }: { event: QCFailedEvent }) {
  const isPending = event.status === "pending" || event.status === "retrying";

  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={event.status} />
            <span className="text-[10px] text-zinc-500 font-mono">
              {event.source}
            </span>
            <span className="text-[10px] text-zinc-600">
              {new Date(event.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="text-[11px] text-zinc-300">{event.errorMessage}</div>
          {event.stack && (
            <details className="mt-1">
              <summary className="text-[10px] text-zinc-600 cursor-pointer hover:text-zinc-400">
                Stack trace
              </summary>
              <pre className="text-[9px] text-zinc-600 mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap font-mono">
                {event.stack}
              </pre>
            </details>
          )}
          {event.resolutionNotes && (
            <div className="text-[10px] text-zinc-500 mt-1 italic">
              {event.resolutionNotes}
            </div>
          )}
        </div>
        {isPending && (
          <FailedEventActions eventId={event.id} source={event.source} />
        )}
      </div>
    </div>
  );
}

async function HealthContent() {
  const env = getQCEnv();

  let observability: QCObservability;
  let events: QCFailedEvent[];
  try {
    const [obsRes, eventsRes] = await Promise.all([
      getQCObservability(env),
      getQCFailedEvents(env, { limit: 50 }),
    ]);
    observability = obsRes.data;
    events = eventsRes.events;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return <ErrorPanel title="Health" message={msg} />;
  }

  const pendingCount = events.filter(
    (e) => e.status === "pending" || e.status === "retrying",
  ).length;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <ServiceHealthPanel data={observability} />
        <MetricsPanel data={observability} />
        <RateLimitPanel data={observability} />
      </div>

      <PanelShell
        title={`Failed Events${pendingCount > 0 ? ` (${pendingCount} pending)` : ""}`}
      >
        {events.length === 0 ? (
          <EmptyState message="No failed events." />
        ) : (
          <div className="divide-y divide-zinc-800/40 -mx-4 -mb-4">
            {events.map((event) => (
              <FailedEventRow key={event.id} event={event} />
            ))}
          </div>
        )}
      </PanelShell>
    </>
  );
}

export default function HealthPage() {
  return (
    <QCPageLayout title="System Health">
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <PanelSkeleton title="Services" />
              <PanelSkeleton title="System Metrics" />
              <PanelSkeleton title="Rate Limiting" />
            </div>
            <PanelSkeleton title="Failed Events" />
          </div>
        }
      >
        <HealthContent />
      </Suspense>
    </QCPageLayout>
  );
}
