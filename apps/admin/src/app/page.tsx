import { Suspense } from "react";
import {
  getDealsFromD1,
  getDeadlines,
  getContentPipelineStats,
  getMercurySnapshot,
} from "@anipotts/lib/money";
import { getEnv } from "@anipotts/lib/env";
import {
  getMiniHealth,
  getMiniRudy,
  getMiniVaultStats,
  getMiniSessions,
} from "@anipotts/lib/mini";

export const dynamic = "force-dynamic";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-zinc-800/40 ${className}`} />
  );
}

function PanelShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/50">
      <div className="px-4 py-2.5 border-b border-zinc-800/40">
        <h3 className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
          {title}
        </h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function PanelSkeleton({ title }: { title: string }) {
  return (
    <PanelShell title={title}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </PanelShell>
  );
}

function HealthDot({ status }: { status: "up" | "down" | "unknown" }) {
  const color =
    status === "up"
      ? "bg-emerald-400"
      : status === "down"
        ? "bg-red-400"
        : "bg-amber-400";
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color}`} />;
}

const HEALTH_ENDPOINTS = [
  { name: "www", url: "https://anipotts.com/_health" },
  { name: "admin", url: "https://admin.anipotts.com/_health" },
  { name: "ingest", url: "https://anipotts-ingest.anipotts.workers.dev" },
];

async function HealthPanel() {
  const [workerResults, miniHealth] = await Promise.all([
    Promise.allSettled(
      HEALTH_ENDPOINTS.map(async ({ name, url }) => {
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
          if (!res.ok) return { name, ok: false };
          const data = (await res.json()) as { ok: boolean };
          return { name, ok: data.ok };
        } catch {
          return { name, ok: false };
        }
      }),
    ),
    getMiniHealth(),
  ]);

  const apps = workerResults.map((r) =>
    r.status === "fulfilled" ? r.value : { name: "?", ok: false },
  );

  // Add Mini API health
  apps.push({ name: "mini", ok: miniHealth?.ok ?? false });

  return (
    <PanelShell title="Health">
      <div className="flex gap-4">
        {apps.map((app) => (
          <div key={app.name} className="flex items-center gap-1.5">
            <HealthDot status={app.ok ? "up" : "down"} />
            <span className="text-[12px] text-zinc-400">{app.name}</span>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

async function MercuryPanel() {
  const snapshot = await getMercurySnapshot({
    MERCURY_API_TOKEN: getEnv("MERCURY_API_TOKEN"),
    MERCURY_ACCOUNT_ID_CHECKING: getEnv("MERCURY_ACCOUNT_ID_CHECKING"),
    MERCURY_ACCOUNT_ID_SAVINGS: getEnv("MERCURY_ACCOUNT_ID_SAVINGS"),
  });

  const hasData = snapshot.checking || snapshot.savings;
  const isFullError = snapshot.error && !hasData;

  if (isFullError) {
    return (
      <PanelShell title="Mercury">
        <p className="text-[12px] text-zinc-600">{snapshot.error}</p>
      </PanelShell>
    );
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(n);

  const fetchedTime = new Date(snapshot.fetchedAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <PanelShell title="Mercury">
      <div className="space-y-2">
        {snapshot.checking && (
          <div className="flex justify-between items-baseline">
            <span className="text-[12px] text-zinc-500">Checking</span>
            <span className="text-[14px] font-medium text-zinc-200">
              {fmt(snapshot.checking.currentBalance)}
            </span>
          </div>
        )}
        {snapshot.savings && (
          <div className="flex justify-between items-baseline">
            <span className="text-[12px] text-zinc-500">Savings</span>
            <span className="text-[14px] font-medium text-zinc-200">
              {fmt(snapshot.savings.currentBalance)}
            </span>
          </div>
        )}
        {!hasData && (
          <p className="text-[12px] text-zinc-600">No accounts configured</p>
        )}
        {snapshot.error && (
          <p className="text-[10px] text-amber-500/70 mt-1">
            Partial: {snapshot.error}
          </p>
        )}
        <p className="text-[10px] text-zinc-600">Fetched {fetchedTime}</p>
      </div>
    </PanelShell>
  );
}

async function DeadlinePanel() {
  const deadlines = await getDeadlines();
  const next = deadlines.find((d) => !d.isOverdue && d.status !== "complete");
  const overdue = deadlines.filter((d) => d.isOverdue);

  return (
    <PanelShell title="Next Deadline">
      {overdue.length > 0 && (
        <div className="mb-2 px-2 py-1.5 rounded bg-red-950/30 border border-red-900/30">
          <span className="text-[11px] text-red-400 font-medium">
            {overdue.length} overdue
          </span>
        </div>
      )}
      {next ? (
        <div>
          <p className="text-[13px] text-zinc-300">{next.description}</p>
          <p className="text-[11px] text-zinc-500 mt-1">
            {next.date}
            {next.daysUntil >= 0 && (
              <span className={next.isUpcoming ? " text-amber-400" : ""}>
                {" "}
                ({next.daysUntil}d)
              </span>
            )}
          </p>
        </div>
      ) : (
        <p className="text-[12px] text-zinc-600">No upcoming deadlines</p>
      )}
    </PanelShell>
  );
}

async function DealsPanel() {
  const deals = await getDealsFromD1();
  const active = deals.filter(
    (d) => d.status === "active" || d.status === "negotiating",
  );
  const pipeline = deals.reduce(
    (acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <PanelShell title="Deals">
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-[12px] text-zinc-500">Active</span>
          <span className="text-[14px] font-medium text-zinc-200">
            {active.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(pipeline).map(([status, count]) => (
            <span
              key={status}
              className="admin-badge bg-zinc-800/60 text-zinc-400"
            >
              {status}: {count}
            </span>
          ))}
        </div>
        {active.length > 0 && (
          <div className="mt-1 space-y-1">
            {active.map((d) => (
              <div key={d.company} className="text-[11px] text-zinc-400">
                {d.company}{" "}
                <span className="text-zinc-600">({d.platform})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </PanelShell>
  );
}

async function ContentPanel() {
  const stats = await getContentPipelineStats();

  return (
    <PanelShell title="Content">
      <div className="flex gap-4">
        {[
          { label: "Draft", value: stats.drafts },
          { label: "Ready", value: stats.ready },
          { label: "Published", value: stats.published },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-[16px] font-medium text-zinc-200">
              {s.value}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

async function RudyPanel() {
  const [rudy, vault] = await Promise.all([getMiniRudy(), getMiniVaultStats()]);

  const available = rudy?.available ?? false;

  if (!available) {
    return (
      <PanelShell title="Rudy">
        <p className="text-[12px] text-zinc-600">Mini offline</p>
      </PanelShell>
    );
  }

  const stats = [
    { label: "Entities", value: rudy?.entities ?? 0 },
    { label: "Events", value: rudy?.events ?? 0 },
    { label: "Vault notes", value: vault?.total_notes ?? 0 },
    { label: "DB size", value: `${rudy?.db_size_mb ?? 0} MB` },
    { label: "Changes (24h)", value: vault?.recent_changes_24h ?? 0 },
  ];

  return (
    <PanelShell title="Rudy">
      <div className="space-y-1.5">
        {stats.map((s) => (
          <div key={s.label} className="flex justify-between items-baseline">
            <span className="text-[12px] text-zinc-500">{s.label}</span>
            <span className="text-[13px] font-mono text-[#61AEBA]">
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

async function SessionsPanel() {
  const sessions = await getMiniSessions();

  const available = sessions?.available ?? false;

  if (!available) {
    const reason = sessions?.reason ?? "mine.db unavailable";
    return (
      <PanelShell title="CC Sessions">
        <p className="text-[12px] text-zinc-600">{reason}</p>
      </PanelShell>
    );
  }

  const today = sessions?.today;

  return (
    <PanelShell title="CC Sessions">
      <div className="space-y-1.5">
        <div className="flex justify-between items-baseline">
          <span className="text-[12px] text-zinc-500">Today</span>
          <span className="text-[13px] font-mono text-[#61AEBA]">
            {today?.sessions ?? 0} sessions
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[12px] text-zinc-500">Tool calls</span>
          <span className="text-[13px] font-mono text-[#61AEBA]">
            {today?.tool_calls ?? 0}
          </span>
        </div>
      </div>
    </PanelShell>
  );
}

export default function DashboardPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 border-b border-zinc-800/60 px-6 py-3">
        <h2 className="text-[13px] font-medium text-zinc-200">Dashboard</h2>
      </div>
      <div className="flex-1 overflow-y-auto admin-scroll p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Suspense fallback={<PanelSkeleton title="Health" />}>
            <HealthPanel />
          </Suspense>
          <Suspense fallback={<PanelSkeleton title="Mercury" />}>
            <MercuryPanel />
          </Suspense>
          <Suspense fallback={<PanelSkeleton title="Next Deadline" />}>
            <DeadlinePanel />
          </Suspense>
          <Suspense fallback={<PanelSkeleton title="Deals" />}>
            <DealsPanel />
          </Suspense>
          <Suspense fallback={<PanelSkeleton title="Content" />}>
            <ContentPanel />
          </Suspense>
          <Suspense fallback={<PanelSkeleton title="Rudy" />}>
            <RudyPanel />
          </Suspense>
          <Suspense fallback={<PanelSkeleton title="CC Sessions" />}>
            <SessionsPanel />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
