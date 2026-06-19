import {
  getContentPipelineStats,
  getDealsFromD1,
  getDeadlines,
  getMercurySnapshot,
} from "@anipotts/lib/money";
import { fetchCmsEditorSnapshot } from "@anipotts/lib/cms";
import { getEnv } from "@anipotts/lib/env";
import {
  getMiniHealth,
  getMiniRudy,
  getMiniSessions,
  getMiniVaultStats,
} from "@anipotts/lib/mini";
import HomeCopyEditor from "./home-copy-editor";
import SiteContentEditor from "./site-content-editor";
import LiveDashboard from "./live-dashboard";
import { HealthDot, PanelShell } from "./dashboard-panels";

const HEALTH_ENDPOINTS = [
  { name: "www", url: "https://anipotts.com/api/health" },
  { name: "admin", url: "https://admin.anipotts.com/_health" },
  { name: "ingest", url: "https://anipotts-ingest.anipotts.workers.dev" },
];

export async function SiteCopyPanel() {
  const snapshot = await fetchCmsEditorSnapshot();

  return (
    <div className="space-y-4">
      <HomeCopyEditor
        content={snapshot.homepage}
        source={snapshot.homepageMeta.source === "cms" ? "cms" : "fallback"}
        updatedAt={snapshot.homepageMeta.updated_at}
        version={snapshot.homepageMeta.version}
      />
      <SiteContentEditor
        projects={snapshot.projects}
        writing={snapshot.writing}
        newsletter={snapshot.newsletter}
        newsletterMeta={snapshot.newsletterMeta}
      />
    </div>
  );
}

export async function HealthPanel() {
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

export async function MercuryPanel() {
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

export async function DeadlinePanel() {
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
      ) : deadlines.length === 0 ? (
        <p className="text-[12px] text-zinc-600">
          No deadlines in D1. Run YAML sync to populate.
        </p>
      ) : overdue.length > 0 ? (
        <p className="text-[12px] text-zinc-600">No upcoming deadlines</p>
      ) : (
        <p className="text-[12px] text-zinc-600">All deadlines clear</p>
      )}
    </PanelShell>
  );
}

export async function DealsPanel() {
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

export async function ContentPanel() {
  const stats = await getContentPipelineStats();

  return (
    <PanelShell title="Content">
      <div className="flex gap-4">
        {[
          { label: "Draft", value: stats.drafts, color: "text-yellow-400" },
          { label: "Ready", value: stats.ready, color: "text-blue-400" },
          {
            label: "Published",
            value: stats.published,
            color: "text-green-400",
          },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className={`text-[16px] font-medium ${s.color}`}>
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

export async function LiveDashboardWrapper() {
  const [rudy, vault, sessions] = await Promise.all([
    getMiniRudy(),
    getMiniVaultStats(),
    getMiniSessions(),
  ]);

  return <LiveDashboard initial={{ rudy, vault, sessions }} />;
}
