import {
  getMercurySnapshot,
  getDealsFromD1,
  getDeadlines,
  getRevenueStreams,
  getDomainPortfolio,
  getVentureHealth,
} from "@anipotts/lib/money";
import { getEnv } from "@anipotts/lib/env";
import { Section } from "@/components/shared/section";
import { formatCurrency } from "./money-display";
import {
  DeadlineRow,
  DealRow,
  DomainRow,
  StreamRow,
  VentureCard,
} from "./money-rows";

export async function MercurySection() {
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
                {formatCurrency(snapshot.checking.currentBalance)}
              </div>
              <div className="text-[11px] text-zinc-500">
                Available: {formatCurrency(snapshot.checking.availableBalance)}
              </div>
            </div>
          )}
          {snapshot.savings && (
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">
                Savings
              </div>
              <div className="text-[20px] font-medium text-zinc-100">
                {formatCurrency(snapshot.savings.currentBalance)}
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
                    {formatCurrency(Math.abs(tx.amount))}
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

export async function DealsSection() {
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

export async function DeadlinesSection() {
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

export async function RevenueSection() {
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

export async function DomainsSection() {
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

export async function VenturesSection() {
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
