import type {
  Deal,
  Deadline,
  Domain,
  RevenueStream,
  VentureHealth,
} from "@anipotts/lib/money";
import { StatusBadge } from "./money-display";

const PAGE_LOAD_TIME = Date.now();

export function DealRow({ deal }: { deal: Deal }) {
  const daysSince = deal.firstContact
    ? Math.floor(
        (PAGE_LOAD_TIME - new Date(deal.firstContact).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  return (
    <div className="admin-row text-[12px]">
      <div className="flex-1 min-w-0">
        <div className="text-zinc-200 font-medium">{deal.company}</div>
        {deal.agency && (
          <div className="text-[10px] text-zinc-600">via {deal.agency}</div>
        )}
      </div>
      <div className="w-20">
        <StatusBadge status={deal.status} />
      </div>
      <div className="w-16 text-zinc-500">{deal.platform}</div>
      <div className="w-20">
        <StatusBadge status={deal.paymentStatus} />
      </div>
      <div
        className={`w-16 text-right ${
          daysSince === null
            ? "text-zinc-600"
            : daysSince < 30
              ? "text-emerald-400"
              : daysSince <= 60
                ? "text-amber-400"
                : "text-red-400"
        }`}
      >
        {daysSince !== null ? `${daysSince}d` : ""}
      </div>
    </div>
  );
}

export function DeadlineRow({ deadline }: { deadline: Deadline }) {
  const colorClass =
    deadline.status === "complete"
      ? "border-l-emerald-600"
      : deadline.isOverdue
        ? "border-l-red-500"
        : deadline.isUpcoming
          ? "border-l-amber-500"
          : "border-l-zinc-700";

  return (
    <div
      className={`flex items-start gap-3 py-2 px-3 border-l-2 ${colorClass}`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-zinc-300">{deadline.description}</div>
        {deadline.notes && (
          <div className="text-[10px] text-zinc-600 mt-0.5">
            {deadline.notes}
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <div className="text-[11px] text-zinc-500">{deadline.date}</div>
        {deadline.status !== "complete" && (
          <div
            className={`text-[10px] ${
              deadline.isOverdue
                ? "text-red-400"
                : deadline.isUpcoming
                  ? "text-amber-400"
                  : "text-zinc-600"
            }`}
          >
            {deadline.isOverdue
              ? `${Math.abs(deadline.daysUntil)}d overdue`
              : `${deadline.daysUntil}d`}
          </div>
        )}
      </div>
    </div>
  );
}

export function StreamRow({ stream }: { stream: RevenueStream }) {
  return (
    <div className="admin-row text-[12px]">
      <div className="flex-1 min-w-0">
        <div className="text-zinc-200">{stream.name}</div>
        <div className="text-[10px] text-zinc-600">
          {stream.frequency} · {stream.platform}
          {stream.flowsThroughLlc && " · LLC"}
        </div>
      </div>
      <div className="w-20">
        <StatusBadge status={stream.status} />
      </div>
    </div>
  );
}

export function DomainRow({ domain }: { domain: Domain }) {
  const verdictColors: Record<string, string> = {
    keep: "text-emerald-400",
    release: "text-red-400",
    decide: "text-amber-400",
  };

  return (
    <div className="admin-row text-[12px]">
      <div className="flex-1 min-w-0">
        <div className="text-zinc-200 font-medium">{domain.name}</div>
        <div className="text-[10px] text-zinc-600">
          {domain.registrar}
          {domain.project ? ` · ${domain.project}` : ""}
        </div>
      </div>
      {domain.renewalDate && (
        <div
          className={`text-[10px] ${domain.renewalSoon ? "text-amber-400" : "text-zinc-600"}`}
        >
          renews {domain.renewalDate}
        </div>
      )}
      {domain.tier && (
        <span className="admin-badge bg-zinc-800/40 text-zinc-400 border border-zinc-700/30">
          {domain.tier}
        </span>
      )}
      <div
        className={`w-14 text-right ${verdictColors[domain.verdict] || "text-zinc-500"}`}
      >
        {domain.verdict}
      </div>
    </div>
  );
}

export function VentureCard({ venture }: { venture: VentureHealth }) {
  const dotColor =
    venture.status === "up"
      ? "bg-emerald-400"
      : venture.status === "down"
        ? "bg-red-400"
        : "bg-amber-400";

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-zinc-800/20">
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-zinc-300">{venture.name}</div>
        <div className="text-[10px] text-zinc-600">{venture.platform}</div>
      </div>
      {venture.responseTimeMs !== null && (
        <div className="text-[10px] text-zinc-600">
          {venture.responseTimeMs}ms
        </div>
      )}
    </div>
  );
}
