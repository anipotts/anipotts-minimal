import type {
  QCRevenueAnalytics,
  QCPaymentAnalytics,
} from "@anipotts/lib/quantercise";
import { PanelShell, MetricCard, StatusBadge, EmptyState } from "../components";

function fmt(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function fmtDollars(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

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

export function FailedPaymentsPanel({ data }: { data: QCPaymentAnalytics }) {
  const { failedPayments, summary } = data;

  return (
    <PanelShell title="Failed Payments">
      <div className="flex gap-4 mb-3 text-[10px] text-zinc-500">
        <span>
          Total failed:{" "}
          <span className="text-red-400">{summary.totalFailedCount}</span> (
          {fmt(summary.totalFailedAmount)})
        </span>
        <span>
          Success rate:{" "}
          <span className="text-emerald-400">
            {summary.paymentSuccessRate.toFixed(1)}%
          </span>
        </span>
      </div>
      {failedPayments.length === 0 ? (
        <EmptyState message="No failed payments." />
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {failedPayments.slice(0, 20).map((fp) => (
            <div
              key={fp.id}
              className="flex justify-between items-start text-[11px] py-1.5 border-b border-zinc-800/30 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <div className="text-zinc-300 truncate">
                  {fp.customerEmail || "Unknown"}
                </div>
                <div className="text-[10px] text-zinc-600 mt-0.5">
                  {fp.failureMessage || fp.failureCode || "Unknown failure"}
                  {fp.attemptCount > 1 && ` (${fp.attemptCount} attempts)`}
                </div>
              </div>
              <span className="text-red-400 font-mono shrink-0 ml-2">
                {fmt(fp.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </PanelShell>
  );
}

export function DisputesPanel({ data }: { data: QCPaymentAnalytics }) {
  const { disputes, refunds, summary } = data;

  return (
    <PanelShell title="Disputes & Refunds">
      <div className="flex gap-4 mb-3 text-[10px] text-zinc-500">
        <span>
          Active disputes:{" "}
          <span className="text-amber-400">{summary.activeDisputeCount}</span>
        </span>
        <span>
          Total refunded:{" "}
          <span className="text-zinc-400">
            {fmt(summary.totalRefundedAmount)}
          </span>
        </span>
      </div>

      {disputes.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] text-zinc-500 font-medium mb-1.5">
            Disputes
          </div>
          <div className="space-y-1.5">
            {disputes.map((d) => (
              <div
                key={d.id}
                className="flex justify-between items-center text-[11px]"
              >
                <div className="flex items-center gap-2">
                  <StatusBadge status={d.status} />
                  <span className="text-zinc-400">{d.reason}</span>
                </div>
                <span className="text-zinc-300 font-mono">{fmt(d.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {refunds.length > 0 && (
        <div>
          <div className="text-[10px] text-zinc-500 font-medium mb-1.5">
            Recent Refunds
          </div>
          <div className="space-y-1.5">
            {refunds.slice(0, 10).map((r) => (
              <div
                key={r.id}
                className="flex justify-between items-center text-[11px]"
              >
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  <span className="text-zinc-400">
                    {r.reason || "No reason"}
                  </span>
                </div>
                <span className="text-zinc-300 font-mono">{fmt(r.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {disputes.length === 0 && refunds.length === 0 && (
        <EmptyState message="No disputes or refunds." />
      )}
    </PanelShell>
  );
}

export function DunningPanel({ data }: { data: QCPaymentAnalytics }) {
  const { dunningStatus } = data;
  const rows = [
    {
      label: "In retry",
      value: dunningStatus.inRetry,
      color: "text-amber-400",
    },
    { label: "Past due", value: dunningStatus.pastDue, color: "text-red-400" },
    {
      label: "Recoverable",
      value: dunningStatus.recoverable,
      color: "text-blue-400",
    },
  ];

  return (
    <PanelShell title="Dunning">
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between items-baseline">
            <span className="text-[12px] text-zinc-500">{r.label}</span>
            <span className={`text-[14px] font-mono font-medium ${r.color}`}>
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}
