import type { QCDashboard } from "@anipotts/lib/quantercise";
import { PanelShell, MetricCard } from "./components";

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

export function ActivityPanel({ data }: { data: QCDashboard }) {
  const events = data.recentActivity.slice(0, 5);

  if (events.length === 0) {
    return (
      <PanelShell title="Recent Activity">
        <p className="text-[12px] text-zinc-600">No recent events</p>
      </PanelShell>
    );
  }

  return (
    <PanelShell title="Recent Activity">
      <div className="space-y-2">
        {events.map((event) => {
          const time = new Date(event.timestamp).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          });
          return (
            <div key={event.id} className="flex justify-between items-baseline">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] text-zinc-400 truncate block">
                  {event.userName || event.userEmail}
                </span>
                <span className="text-[10px] text-zinc-600">
                  {event.eventType}
                </span>
              </div>
              <span className="text-[10px] text-zinc-600 shrink-0 ml-2">
                {time}
              </span>
            </div>
          );
        })}
      </div>
    </PanelShell>
  );
}

export function ContentStatsPanel({ data }: { data: QCDashboard }) {
  const { contentStats } = data;
  const stages = [
    { key: "idea", label: "Idea" },
    { key: "scripting", label: "Scripting" },
    { key: "recording", label: "Recording" },
    { key: "editing", label: "Editing" },
    { key: "ready", label: "Ready" },
    { key: "published", label: "Published" },
  ];

  return (
    <PanelShell title="Content Pipeline">
      <div className="flex gap-3">
        {stages.map((s) => (
          <div key={s.key} className="text-center">
            <div className="text-[14px] font-medium text-zinc-200">
              {contentStats[s.key] ?? 0}
            </div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wide">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

export function LastUpdatedPanel({ timestamp }: { timestamp: string }) {
  const updated = new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <PanelShell title="Last Updated">
      <p className="text-[12px] text-zinc-500">{updated}</p>
    </PanelShell>
  );
}
