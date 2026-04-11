import { Suspense } from "react";
import {
  getMercurySnapshot,
  getDealsFromD1,
  getDeadlines,
  getRevenueStreams,
  getDomainPortfolio,
  getVentureHealth,
} from "@anipotts/lib/money";
import { getEnv } from "@anipotts/lib/env";
import type {
  Deal,
  Deadline,
  RevenueStream,
  Domain,
  VentureHealth,
} from "@anipotts/lib/money";
import { Section, SectionSkeleton } from "@/components/shared/section";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-950/40 text-emerald-400 border-emerald-900/30",
    negotiating: "bg-amber-950/40 text-amber-400 border-amber-900/30",
    complete: "bg-blue-950/40 text-blue-400 border-blue-900/30",
    declined: "bg-zinc-800/40 text-zinc-500 border-zinc-700/30",
    ghosted: "bg-red-950/40 text-red-400 border-red-900/30",
    pipeline: "bg-indigo-950/40 text-indigo-400 border-indigo-900/30",
    pending: "bg-amber-950/40 text-amber-400 border-amber-900/30",
    paid: "bg-emerald-950/40 text-emerald-400 border-emerald-900/30",
    incoming: "bg-emerald-950/40 text-emerald-400 border-emerald-900/30",
    planned: "bg-zinc-800/40 text-zinc-500 border-zinc-700/30",
    "not-started": "bg-zinc-800/40 text-zinc-500 border-zinc-700/30",
  };
  const cls =
    colors[status] || "bg-zinc-800/40 text-zinc-400 border-zinc-700/30";
  return <span className={`admin-badge border ${cls}`}>{status}</span>;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);

// ── Mercury Banking ──

async function MercurySection() {
  const snapshot = await getMercurySnapshot({
    MERCURY_API_TOKEN: getEnv("MERCURY_API_TOKEN"),
    MERCURY_ACCOUNT_ID_CHECKING: getEnv("MERCURY_ACCOUNT_ID_CHECKING"),
    MERCURY_ACCOUNT_ID_SAVINGS: getEnv("MERCURY_ACCOUNT_ID_SAVINGS"),
  });

  const hasData = snapshot.checking || snapshot.savings;
  const isFullError = snapshot.error && !hasData;

  if (isFullError) {
    return (
      <Section title="Mercury Banking">
        <p className="text-[12px] text-zinc-600">{snapshot.error}</p>
      </Section>
    );
  }

  const fetchedTime = new Date(snapshot.fetchedAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Section title="Mercury Banking">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {snapshot.checking && (
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">
                Checking
              </div>
              <div className="text-[20px] font-medium text-zinc-100">
                {fmt(snapshot.checking.currentBalance)}
              </div>
              <div className="text-[11px] text-zinc-500">
                Available: {fmt(snapshot.checking.availableBalance)}
              </div>
            </div>
          )}
          {snapshot.savings && (
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">
                Savings
              </div>
              <div className="text-[20px] font-medium text-zinc-100">
                {fmt(snapshot.savings.currentBalance)}
              </div>
            </div>
          )}
        </div>

        {snapshot.recentTransactions.length > 0 && (
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-2">
              Recent Transactions
            </div>
            <div className="space-y-px">
              {snapshot.recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-zinc-800/20"
                >
                  <div>
                    <div className="text-[12px] text-zinc-300">
                      {tx.counterpartyName}
                    </div>
                    <div className="text-[10px] text-zinc-600">
                      {tx.dashDate} · {tx.status}
                    </div>
                  </div>
                  <div
                    className={`text-[12px] font-medium ${
                      tx.kind === "credit"
                        ? "text-emerald-400"
                        : "text-zinc-400"
                    }`}
                  >
                    {tx.kind === "credit" ? "+" : "-"}
                    {fmt(Math.abs(tx.amount))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {snapshot.error && (
          <p className="text-[10px] text-amber-500/70">
            Partial: {snapshot.error}
          </p>
        )}
        <p className="text-[10px] text-zinc-600">Fetched {fetchedTime}</p>
      </div>
    </Section>
  );
}

// ── Deals Table ──

const PAGE_LOAD_TIME = Date.now();

function DealRow({ deal }: { deal: Deal }) {
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

async function DealsSection() {
  const deals = await getDealsFromD1();

  if (deals.length === 0) {
    return (
      <Section title="Brand Deals">
        <p className="text-[12px] text-zinc-600">
          No deals in D1. Run the YAML sync script to populate.
        </p>
      </Section>
    );
  }

  return (
    <Section title="Brand Deals">
      <div className="admin-row text-[10px] text-zinc-500 uppercase tracking-wide border-b border-zinc-800/40">
        <div className="flex-1">Company</div>
        <div className="w-20">Status</div>
        <div className="w-16">Platform</div>
        <div className="w-20">Payment</div>
        <div className="w-16 text-right">Age</div>
      </div>
      {deals.map((deal) => (
        <DealRow key={deal.company} deal={deal} />
      ))}
    </Section>
  );
}

// ── Deadlines Timeline ──

function DeadlineRow({ deadline }: { deadline: Deadline }) {
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

async function DeadlinesSection() {
  const deadlines = await getDeadlines();

  if (deadlines.length === 0) {
    return (
      <Section title="Deadlines">
        <p className="text-[12px] text-zinc-600">
          No deadlines in D1. Run the YAML sync script to populate.
        </p>
      </Section>
    );
  }

  return (
    <Section title="Deadlines">
      <div className="space-y-px">
        {deadlines.map((d) => (
          <DeadlineRow key={`${d.date}-${d.description}`} deadline={d} />
        ))}
      </div>
    </Section>
  );
}

// ── Revenue Streams ──

function StreamRow({ stream }: { stream: RevenueStream }) {
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

async function RevenueSection() {
  const streams = await getRevenueStreams();

  if (streams.length === 0) {
    return (
      <Section title="Revenue Streams">
        <p className="text-[12px] text-zinc-600">
          No revenue streams in D1. Run the YAML sync script to populate.
        </p>
      </Section>
    );
  }

  return (
    <Section title="Revenue Streams">
      {streams.map((s) => (
        <StreamRow key={s.name} stream={s} />
      ))}
    </Section>
  );
}

// ── Domains ──

function DomainRow({ domain }: { domain: Domain }) {
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

async function DomainsSection() {
  const domains = await getDomainPortfolio();

  if (domains.length === 0) {
    return (
      <Section title="Domains">
        <p className="text-[12px] text-zinc-600">
          No domains in D1. Run the YAML sync script to populate.
        </p>
      </Section>
    );
  }

  return (
    <Section title={`Domains (${domains.length})`}>
      {domains.map((d) => (
        <DomainRow key={d.name} domain={d} />
      ))}
    </Section>
  );
}

// ── Venture Health ──

function VentureCard({ venture }: { venture: VentureHealth }) {
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

async function VenturesSection() {
  const ventures = await getVentureHealth();

  return (
    <Section title="Ventures">
      <div className="space-y-px">
        {ventures.map((v) => (
          <VentureCard key={v.name} venture={v} />
        ))}
      </div>
    </Section>
  );
}

// ── Revenue Trend (placeholder) ──

function RevenueTrendPlaceholder() {
  return (
    <Section title="Revenue Trend">
      <div className="flex flex-col items-center justify-center py-6">
        <div className="text-[11px] text-zinc-600 mb-1">Collecting data...</div>
        <div className="text-[10px] text-zinc-700">
          Mercury transactions will populate this chart once enough history
          accumulates in daily_rollups.
        </div>
      </div>
    </Section>
  );
}

// ── Calendar (placeholder) ──

function CalendarPlaceholder() {
  return (
    <Section title="Calendar">
      <div className="flex flex-col items-center justify-center py-6">
        <div className="text-[11px] text-zinc-500">Connect Calendar</div>
        <div className="text-[10px] text-zinc-700 mt-1">
          Mini API has no calendar endpoint yet. Add one to surface upcoming
          meetings here.
        </div>
      </div>
    </Section>
  );
}

// ── Invoices (placeholder) ──

function InvoicePlaceholder() {
  return (
    <Section title="Invoices">
      <div className="flex flex-col items-center justify-center py-6">
        <div className="text-[11px] text-zinc-500">Connect Gmail</div>
        <div className="text-[10px] text-zinc-700 mt-1">
          Future integration will pull invoice attachments from Gmail and
          surface outstanding payments here.
        </div>
      </div>
    </Section>
  );
}

// ── Page ──

export default function MoneyPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 border-b border-zinc-800/60 px-6 py-3">
        <h2 className="text-[13px] font-medium text-zinc-200">Money</h2>
      </div>
      <div className="flex-1 overflow-y-auto admin-scroll p-6 space-y-4">
        <Suspense fallback={<SectionSkeleton title="Mercury Banking" />}>
          <MercurySection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton title="Brand Deals" />}>
          <DealsSection />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<SectionSkeleton title="Deadlines" />}>
            <DeadlinesSection />
          </Suspense>
          <Suspense fallback={<SectionSkeleton title="Revenue Streams" />}>
            <RevenueSection />
          </Suspense>
        </div>

        <Suspense fallback={<SectionSkeleton title="Domains" />}>
          <DomainsSection />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<SectionSkeleton title="Ventures" />}>
            <VenturesSection />
          </Suspense>
          <RevenueTrendPlaceholder />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CalendarPlaceholder />
          <InvoicePlaceholder />
        </div>
      </div>
    </div>
  );
}
