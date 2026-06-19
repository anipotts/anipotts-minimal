import type { QCAnalytics } from "@anipotts/lib/quantercise";
import { MetricCard, PanelShell } from "../components";

export function AnalyticsPanels({ data }: { data: QCAnalytics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <OverviewPanel data={data} />
      <ActiveUsersPanel data={data} />
      <SubscriptionPanel data={data} />
      <SubmissionsPanel data={data} />
      <div className="md:col-span-2">
        <DAUChart data={data} />
      </div>
    </div>
  );
}

function OverviewPanel({ data }: { data: QCAnalytics }) {
  return (
    <PanelShell title="Overview">
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Total Users"
          value={data.totalUsers.toLocaleString()}
          color="text-blue-400"
        />
        <MetricCard
          label="MRR"
          value={`$${data.revenueEstimate.mrr.toLocaleString()}`}
          color="text-emerald-400"
        />
        <MetricCard
          label="Monthly Rev"
          value={`$${data.revenueEstimate.monthly.toLocaleString()}`}
        />
        <MetricCard
          label="Annual Rev"
          value={`$${data.revenueEstimate.annual.toLocaleString()}`}
        />
      </div>
    </PanelShell>
  );
}

function ActiveUsersPanel({ data }: { data: QCAnalytics }) {
  const { activeUsers } = data;
  const rows = [
    { label: "Daily", value: activeUsers.daily, color: "text-violet-400" },
    { label: "Weekly", value: activeUsers.weekly, color: "text-blue-400" },
    { label: "Monthly", value: activeUsers.monthly, color: "text-cyan-400" },
  ];

  return (
    <PanelShell title="Active Users">
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between items-baseline">
            <span className="text-[12px] text-zinc-500">{r.label}</span>
            <span className={`text-[14px] font-mono font-medium ${r.color}`}>
              {r.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

function SubscriptionPanel({ data }: { data: QCAnalytics }) {
  const { subscriptionBreakdown: subs } = data;
  const total = subs.free + subs.monthly + subs.annual;
  const segments = [
    { label: "Free", value: subs.free, color: "bg-zinc-600" },
    { label: "Monthly", value: subs.monthly, color: "bg-blue-500" },
    { label: "Annual", value: subs.annual, color: "bg-emerald-500" },
  ];

  return (
    <PanelShell title="Subscriptions">
      {total > 0 && (
        <div className="flex h-2 rounded-full overflow-hidden mb-3">
          {segments.map((s) => (
            <div
              key={s.label}
              className={`${s.color} transition-all`}
              style={{ width: `${(s.value / total) * 100}%` }}
            />
          ))}
        </div>
      )}
      <div className="space-y-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex justify-between items-baseline">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${s.color}`} />
              <span className="text-[12px] text-zinc-500">{s.label}</span>
            </div>
            <span className="text-[12px] font-mono text-zinc-300">
              {s.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

function SubmissionsPanel({ data }: { data: QCAnalytics }) {
  const { submissionStats } = data;
  return (
    <PanelShell title="Submissions">
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Total"
          value={submissionStats.total.toLocaleString()}
        />
        <MetricCard
          label="Passed"
          value={submissionStats.passed.toLocaleString()}
          color="text-emerald-400"
        />
      </div>
      <div className="mt-3">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-[10px] text-zinc-500">Pass Rate</span>
          <span className="text-[12px] font-mono text-[#61AEBA]">
            {Math.round(submissionStats.passRate)}%
          </span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#61AEBA] rounded-full transition-all"
            style={{ width: `${submissionStats.passRate}%` }}
          />
        </div>
      </div>
    </PanelShell>
  );
}

function DAUChart({ data }: { data: QCAnalytics }) {
  const points = data.dailyActiveUsers;
  if (points.length === 0) return null;

  const max = Math.max(...points.map((p) => p.count), 1);

  return (
    <PanelShell title="Daily Active Users (30d)">
      <div className="flex items-end gap-px h-24">
        {points.map((p) => {
          const pct = (p.count / max) * 100;
          return (
            <div
              key={p.date}
              className="flex-1 bg-violet-500/40 hover:bg-violet-500/70 rounded-t transition-colors"
              style={{ height: `${Math.max(pct, 2)}%` }}
              title={`${p.date}: ${p.count}`}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-1.5 text-[9px] text-zinc-600">
        <span>{points[0]?.date}</span>
        <span>{points[points.length - 1]?.date}</span>
      </div>
    </PanelShell>
  );
}
