import type { QCPaymentAnalytics } from "@anipotts/lib/quantercise";
import { EmptyState, PanelShell, StatusBadge } from "../components";
import { fmtCents } from "./payments-format";

export function FailedPaymentsPanel({ data }: { data: QCPaymentAnalytics }) {
  const { failedPayments, summary } = data;

  return (
    <PanelShell title="Failed Payments">
      <div className="flex gap-4 mb-3 text-[10px] text-zinc-500">
        <span>
          Total failed:{" "}
          <span className="text-red-400">{summary.totalFailedCount}</span> (
          {fmtCents(summary.totalFailedAmount)})
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
                {fmtCents(fp.amount)}
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
            {fmtCents(summary.totalRefundedAmount)}
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
                <span className="text-zinc-300 font-mono">
                  {fmtCents(d.amount)}
                </span>
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
                <span className="text-zinc-300 font-mono">
                  {fmtCents(r.amount)}
                </span>
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
