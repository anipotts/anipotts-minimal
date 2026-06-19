import type { QCRevenueAnalytics } from "@anipotts/lib/quantercise";
import { MetricCard, PanelShell } from "../components";
import { fmtDollars } from "./payments-format";

export function RevenuePanel({ data }: { data: QCRevenueAnalytics }) {
  const growth = data.mrrGrowth;
  const growthColor =
    growth > 0
      ? "text-emerald-400"
      : growth < 0
        ? "text-red-400"
        : "text-zinc-400";

  return (
    <PanelShell title="Revenue">
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Current MRR"
          value={fmtDollars(data.currentMrr)}
          sub={`${growth > 0 ? "+" : ""}${growth.toFixed(1)}% growth`}
          color="text-emerald-400"
        />
        <MetricCard
          label="ARR"
          value={fmtDollars(data.arr)}
          color="text-blue-400"
        />
        <MetricCard
          label="ARPU"
          value={fmtDollars(data.avgRevenuePerUser)}
          color="text-violet-400"
        />
        <MetricCard
          label="LTV"
          value={fmtDollars(data.ltv)}
          color="text-amber-400"
        />
      </div>
      <div className="mt-3 flex gap-4 text-[10px] text-zinc-500">
        <span>
          Churn:{" "}
          <span className={growthColor}>{data.churnRate.toFixed(1)}%</span>
        </span>
        <span>Previous MRR: {fmtDollars(data.previousMrr)}</span>
      </div>
    </PanelShell>
  );
}

export function SubscribersPanel({ data }: { data: QCRevenueAnalytics }) {
  return (
    <PanelShell title="Subscribers">
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-[12px] text-zinc-500">Total</span>
          <span className="text-[14px] font-mono text-zinc-200">
            {data.totalSubscribers}
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[12px] text-zinc-500">Monthly</span>
          <span className="text-[12px] font-mono text-zinc-300">
            {data.monthlySubscribers} (
            {fmtDollars(data.planBreakdown.monthly.revenue)})
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[12px] text-zinc-500">Annual</span>
          <span className="text-[12px] font-mono text-zinc-300">
            {data.annualSubscribers} (
            {fmtDollars(data.planBreakdown.annual.revenue)})
          </span>
        </div>
      </div>
    </PanelShell>
  );
}

export function MRRChart({ data }: { data: QCRevenueAnalytics }) {
  const history = data.revenueHistory;
  if (history.length === 0) return null;

  const max = Math.max(...history.map((h) => h.mrr), 1);

  return (
    <PanelShell title="MRR History">
      <div className="flex items-end gap-px h-20">
        {history.map((h) => {
          const pct = (h.mrr / max) * 100;
          return (
            <div
              key={h.date}
              className="flex-1 bg-emerald-500/40 hover:bg-emerald-500/70 rounded-t transition-colors"
              style={{ height: `${Math.max(pct, 2)}%` }}
              title={`${h.date}: ${fmtDollars(h.mrr)} MRR, ${h.subscribers} subs`}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-1.5 text-[9px] text-zinc-600">
        <span>{history[0]?.date}</span>
        <span>{history[history.length - 1]?.date}</span>
      </div>
    </PanelShell>
  );
}
