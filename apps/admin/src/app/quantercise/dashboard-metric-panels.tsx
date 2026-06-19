import type { QCDashboard } from "@anipotts/lib/quantercise";
import { MetricCard, PanelShell } from "./components";

function fmt(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export function MetricsPanel({ data }: { data: QCDashboard }) {
  const { metrics } = data;
  return (
    <PanelShell title="Key Metrics">
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Users"
          value={metrics.totalUsers.toLocaleString()}
          sub={`+${metrics.newUsersThisWeek} this week`}
          color="text-blue-400"
        />
        <MetricCard
          label="MRR"
          value={fmt(metrics.mrrCents)}
          sub={`${metrics.totalSubscribers} subscribers`}
          color="text-emerald-400"
        />
        <MetricCard
          label="Active Today"
          value={metrics.activeToday}
          sub={
            metrics.activeTodayVsAvg !== 0
              ? `${metrics.activeTodayVsAvg > 0 ? "+" : ""}${metrics.activeTodayVsAvg}% vs avg`
              : undefined
          }
          color="text-violet-400"
        />
        <MetricCard
          label="Online Now"
          value={metrics.usersOnlineNow}
          sub={`${metrics.activeSessions} sessions`}
          color="text-amber-400"
        />
      </div>
    </PanelShell>
  );
}

export function AlertsPanel({ data }: { data: QCDashboard }) {
  const { alerts } = data;
  const items = [
    {
      label: "Failed payments",
      value: alerts.failedPayments.count,
      critical: alerts.failedPayments.count > 0,
    },
    {
      label: "Active disputes",
      value: alerts.activeDisputes,
      critical: alerts.activeDisputes > 0,
    },
    {
      label: "Critical errors",
      value: alerts.criticalErrors,
      critical: alerts.criticalErrors > 0,
    },
    { label: "Open feedback", value: alerts.openFeedback, critical: false },
  ];

  const hasCritical = items.some((i) => i.critical);

  return (
    <PanelShell title="Alerts">
      {hasCritical ? (
        <div className="space-y-1.5">
          {items
            .filter((i) => i.value > 0)
            .map((item) => (
              <div
                key={item.label}
                className="flex justify-between items-baseline"
              >
                <span
                  className={`text-[12px] ${item.critical ? "text-red-400" : "text-zinc-500"}`}
                >
                  {item.label}
                </span>
                <span
                  className={`text-[13px] font-mono ${item.critical ? "text-red-400" : "text-zinc-400"}`}
                >
                  {item.value}
                </span>
              </div>
            ))}
        </div>
      ) : (
        <p className="text-[12px] text-emerald-500/70">All clear</p>
      )}
    </PanelShell>
  );
}

export function QuickStatsPanel({ data }: { data: QCDashboard }) {
  const { quickStats } = data;
  const stats = [
    {
      label: "Pass rate",
      value: `${Math.round(quickStats.passRate)}%`,
    },
    {
      label: "Submissions today",
      value: quickStats.submissionsToday,
    },
    {
      label: "Avg session",
      value: `${Math.round(quickStats.avgSessionSeconds / 60)}m`,
    },
    {
      label: "Churn rate",
      value: `${quickStats.churnRate}%`,
    },
  ];

  return (
    <PanelShell title="Quick Stats">
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
