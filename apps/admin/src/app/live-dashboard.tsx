"use client";

import { useMiniStream } from "@anipotts/lib/mini/stream";
import type { MiniRudy, MiniVault, MiniSessions } from "@anipotts/lib/mini";
import { LiveValue } from "../components/live-value";

interface InitialDashboardData {
  rudy: MiniRudy | null;
  vault: MiniVault | null;
  sessions: MiniSessions | null;
}

function PanelShell({
  title,
  live,
  children,
}: {
  title: string;
  live?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/50">
      <div className="px-4 py-2.5 border-b border-zinc-800/40 flex items-center gap-2">
        <h3 className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
          {title}
        </h3>
        {live && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#61AEBA] animate-pulse" />
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function RudyPanel({
  rudy,
  vault,
  live,
}: {
  rudy: MiniRudy | null;
  vault: MiniVault | null;
  live: boolean;
}) {
  const available = rudy?.available ?? false;

  if (!available) {
    return (
      <PanelShell title="Rudy">
        <p className="text-[12px] text-zinc-600">Mini offline</p>
      </PanelShell>
    );
  }

  const stats = [
    { label: "Entities", value: rudy?.entities ?? 0 },
    { label: "Events", value: rudy?.events ?? 0 },
    { label: "Vault notes", value: vault?.total_notes ?? 0 },
    { label: "DB size", value: `${rudy?.db_size_mb ?? 0} MB` },
    { label: "Changes (24h)", value: vault?.recent_changes_24h ?? 0 },
  ];

  return (
    <PanelShell title="Rudy" live={live}>
      <div className="space-y-1.5">
        {stats.map((s) => (
          <div key={s.label} className="flex justify-between items-baseline">
            <span className="text-[12px] text-zinc-500">{s.label}</span>
            <span className="text-[13px] font-mono text-[#61AEBA]">
              <LiveValue value={s.value} />
            </span>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

function SessionsPanel({
  sessions,
  live,
}: {
  sessions: MiniSessions | null;
  live: boolean;
}) {
  const available = sessions?.available ?? false;

  if (!available) {
    const reason = sessions?.reason ?? "mine.db unavailable";
    return (
      <PanelShell title="CC Sessions">
        <p className="text-[12px] text-zinc-600">{reason}</p>
      </PanelShell>
    );
  }

  const today = sessions?.today;
  const week = sessions?.last_7d;

  const fmtCost = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <PanelShell title="CC Sessions" live={live}>
      <div className="space-y-1.5">
        <div className="flex justify-between items-baseline">
          <span className="text-[12px] text-zinc-500">Today</span>
          <span className="text-[13px] font-mono text-[#61AEBA]">
            <LiveValue value={today?.sessions ?? 0} /> sessions
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[12px] text-zinc-500">Tool calls</span>
          <span className="text-[13px] font-mono text-[#61AEBA]">
            <LiveValue value={today?.tool_calls ?? 0} />
          </span>
        </div>
        {today?.cost != null && (
          <div className="flex justify-between items-baseline">
            <span className="text-[12px] text-zinc-500">Cost</span>
            <span className="text-[13px] font-mono text-[#61AEBA]">
              <LiveValue value={fmtCost(today.cost)} />
            </span>
          </div>
        )}
        {week && (
          <div className="mt-2 pt-2 border-t border-zinc-800/40">
            <div className="flex justify-between items-baseline">
              <span className="text-[12px] text-zinc-500">7d</span>
              <span className="text-[12px] font-mono text-zinc-400">
                <LiveValue value={week.sessions} /> sessions
                {week.cost != null && ` / ${fmtCost(week.cost)}`}
              </span>
            </div>
          </div>
        )}
      </div>
    </PanelShell>
  );
}

export default function LiveDashboard({
  initial,
}: {
  initial: InitialDashboardData;
}) {
  const stream = useMiniStream();

  const rudy = stream.rudy ?? initial.rudy;
  const vault = stream.vault ?? initial.vault;
  const sessions = stream.sessions ?? initial.sessions;

  const isLive = stream.connected;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`w-2 h-2 rounded-full ${isLive ? "bg-[#61AEBA] animate-pulse" : "bg-zinc-600"}`}
        />
        <span className="text-[11px] text-zinc-500">
          {isLive ? "Live" : "Cached"}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RudyPanel rudy={rudy} vault={vault} live={isLive} />
        <SessionsPanel sessions={sessions} live={isLive} />
      </div>
    </div>
  );
}
