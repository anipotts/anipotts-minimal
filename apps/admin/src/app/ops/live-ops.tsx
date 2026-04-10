"use client";

import { useMiniStream } from "@anipotts/lib/mini/stream";
import type {
  MiniVitalsLive,
  MiniAgents,
  MiniRudy,
  MiniSessions,
  MiniPresence,
  MiniVault,
} from "@anipotts/lib/mini";
import { useRef, useEffect, useState } from "react";

interface InitialData {
  vitals: MiniVitalsLive | null;
  agents: MiniAgents | null;
  rudy: MiniRudy | null;
  sessions: MiniSessions | null;
  presence: MiniPresence | null;
  vault: MiniVault | null;
}

// ── Shared Components ─────────────────────────────────────────────────

function Section({
  title,
  live,
  children,
}: {
  title: string;
  live?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-800/60 bg-zinc-950/50">
      <div className="px-4 py-2.5 border-b border-zinc-800/40 flex items-center gap-2">
        <h3 className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
          {title}
        </h3>
        {live && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#61AEBA] animate-pulse" />
        )}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function LiveValue({
  value,
  prevValue,
  className = "",
}: {
  value: string | number;
  prevValue?: string | number;
  className?: string;
}) {
  const [flash, setFlash] = useState(false);
  const prev = useRef(prevValue ?? value);

  useEffect(() => {
    if (String(value) !== String(prev.current)) {
      setFlash(true);
      prev.current = value;
      const t = setTimeout(() => setFlash(false), 1000);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <span
      className={`font-mono transition-colors duration-500 ${flash ? "text-[#61AEBA]" : ""} ${className}`}
    >
      {value}
    </span>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-zinc-500"}`}
    />
  );
}

function VitalGauge({
  label,
  percent,
}: {
  label: string;
  percent: number | null;
}) {
  if (percent === null) return null;
  const color =
    percent < 70
      ? "bg-emerald-500"
      : percent < 90
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-zinc-500 uppercase tracking-wide">{label}</span>
        <LiveValue value={`${percent.toFixed(0)}%`} className="text-zinc-400" />
      </div>
      <div
        className="h-1.5 rounded-full bg-zinc-800"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} usage`}
      >
        <div
          className={`h-1.5 rounded-full ${color} transition-all duration-700`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ── Vitals Section ────────────────────────────────────────────────────

function VitalsSection({
  vitals,
  live,
}: {
  vitals: MiniVitalsLive | null;
  live: boolean;
}) {
  if (!vitals) {
    return (
      <Section title="Mac Mini">
        <div className="py-6 text-center">
          <p className="text-[12px] text-zinc-500">Mini offline</p>
        </div>
      </Section>
    );
  }

  return (
    <Section title={`Mac Mini (${vitals.hostname})`} live={live}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[12px] text-zinc-300">Online</span>
          <span className="ml-auto text-[10px] text-zinc-600 font-mono">
            up {formatUptime(vitals.uptime_seconds)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <VitalGauge label="CPU" percent={vitals.cpu_percent} />
          <VitalGauge label="Memory" percent={vitals.mem_percent} />
          <VitalGauge label="Disk" percent={vitals.disk_percent} />
        </div>
        <div className="flex gap-4 text-[11px] text-zinc-500 font-mono">
          <span>
            Load:{" "}
            <LiveValue
              value={vitals.load_average.map((v) => v.toFixed(2)).join(" ")}
            />
          </span>
          <span>
            {vitals.disk_used} / {vitals.disk_total}
          </span>
        </div>
      </div>
    </Section>
  );
}

// ── Agents Section ────────────────────────────────────────────────────

function AgentsSection({
  agents,
  live,
}: {
  agents: MiniAgents | null;
  live: boolean;
}) {
  if (!agents || agents.agents.length === 0) {
    return (
      <Section title="LaunchAgents">
        <div className="py-6 text-center">
          <p className="text-[12px] text-zinc-500">No agent data</p>
        </div>
      </Section>
    );
  }

  return (
    <Section title={`LaunchAgents (${agents.agents.length})`} live={live}>
      <div className="space-y-px">
        {agents.agents.map((a) => (
          <div
            key={a.label}
            className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-zinc-800/20"
          >
            <StatusDot active={a.running} />
            <span className="text-[12px] text-zinc-300 truncate flex-1 font-mono">
              {a.label}
            </span>
            {a.pid && (
              <span className="text-[10px] text-zinc-600 font-mono">
                pid {a.pid}
              </span>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── Rudy Section ──────────────────────────────────────────────────────

function RudySection({ rudy, live }: { rudy: MiniRudy | null; live: boolean }) {
  if (!rudy || !rudy.available) {
    return (
      <Section title="Rudy">
        <div className="py-6 text-center">
          <p className="text-[12px] text-zinc-500">
            {rudy?.error || "Rudy unavailable"}
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Rudy" live={live}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <StatusDot active={rudy.daemon_running ?? false} />
          <span className="text-[12px] text-zinc-300">
            {rudy.daemon_running ? "Running" : "Stopped"}
          </span>
          {rudy.db_size_mb && (
            <span className="ml-auto text-[10px] text-zinc-600 font-mono">
              {rudy.db_size_mb} MB
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {rudy.events !== undefined && (
            <div className="text-center">
              <div className="text-[14px] font-medium text-zinc-200 font-mono">
                <LiveValue value={rudy.events.toLocaleString()} />
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
                Events
              </div>
            </div>
          )}
          {rudy.entities !== undefined && (
            <div className="text-center">
              <div className="text-[14px] font-medium text-zinc-200 font-mono">
                <LiveValue value={rudy.entities.toLocaleString()} />
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
                Entities
              </div>
            </div>
          )}
          {rudy.vault_notes_indexed !== undefined && (
            <div className="text-center">
              <div className="text-[14px] font-medium text-zinc-200 font-mono">
                <LiveValue value={rudy.vault_notes_indexed.toLocaleString()} />
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
                Vault Indexed
              </div>
            </div>
          )}
          {rudy.relationships !== undefined && rudy.relationships > 0 && (
            <div className="text-center">
              <div className="text-[14px] font-medium text-zinc-200 font-mono">
                <LiveValue value={rudy.relationships.toLocaleString()} />
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
                Relationships
              </div>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

// ── Sessions Section ──────────────────────────────────────────────────

function SessionsSection({
  sessions,
  live,
}: {
  sessions: MiniSessions | null;
  live: boolean;
}) {
  if (!sessions || !sessions.available) {
    return (
      <Section title="CC Sessions">
        <div className="py-6 text-center">
          <p className="text-[12px] text-zinc-500">
            {sessions?.reason || "mine.db unavailable"}
          </p>
        </div>
      </Section>
    );
  }

  const periods = [
    { label: "Today", data: sessions.today },
    { label: "7d", data: sessions.last_7d },
    { label: "30d", data: sessions.last_30d },
  ];

  return (
    <Section title="CC Sessions" live={live}>
      <div className="grid grid-cols-3 gap-2">
        {periods.map(
          ({ label, data }) =>
            data && (
              <div key={label} className="text-center space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
                  {label}
                </div>
                <div className="text-[14px] font-medium text-zinc-200 font-mono">
                  <LiveValue value={data.sessions} />
                </div>
                <div className="text-[10px] text-zinc-600 font-mono">
                  {data.tool_calls.toLocaleString()} tools
                </div>
                <div className="text-[10px] text-zinc-600 font-mono">
                  ${data.cost.toFixed(0)}
                </div>
              </div>
            ),
        )}
      </div>
    </Section>
  );
}

// ── Vault Section ─────────────────────────────────────────────────────

function VaultSection({
  vault,
  live,
}: {
  vault: MiniVault | null;
  live: boolean;
}) {
  if (!vault || !vault.available) {
    return (
      <Section title="Vault">
        <div className="py-6 text-center">
          <p className="text-[12px] text-zinc-500">Vault data unavailable</p>
        </div>
      </Section>
    );
  }

  const topFolders = vault.folders
    ? Object.entries(vault.folders)
        .filter(([, count]) => count > 0)
        .sort(([, a], [, b]) => b - a)
    : [];

  return (
    <Section title="Vault" live={live}>
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-[16px] font-medium text-zinc-200 font-mono">
              <LiveValue value={vault.total_notes ?? 0} />
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
              Notes
            </div>
          </div>
          <div className="text-center">
            <div className="text-[16px] font-medium text-zinc-200 font-mono">
              <LiveValue value={vault.recent_changes_24h ?? 0} />
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
              Changed (24h)
            </div>
          </div>
        </div>
        {topFolders.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {topFolders.map(([folder, count]) => (
              <span
                key={folder}
                className="admin-badge bg-zinc-800/60 text-zinc-400 font-mono"
              >
                {folder}: {count}
              </span>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

// ── Connection Status ─────────────────────────────────────────────────

function ConnectionStatus({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-2 h-2 rounded-full ${connected ? "bg-[#61AEBA] animate-pulse" : "bg-zinc-600"}`}
      />
      <span className="text-[11px] text-zinc-500">
        {connected ? "SSE connected" : "SSE disconnected"}
      </span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export default function LiveOpsPage({ initial }: { initial: InitialData }) {
  const stream = useMiniStream();

  // Merge: prefer SSE data when connected, fall back to initial REST data
  const vitals = stream.vitals ?? initial.vitals;
  const agents = stream.agents ?? initial.agents;
  const rudy = stream.rudy ?? initial.rudy;
  const sessions = stream.sessions ?? initial.sessions;
  const presence = stream.presence ?? initial.presence;
  const vault = stream.vault ?? initial.vault;

  const isLive = stream.connected;

  // Suppress unused variable warning (presence used for future expansion)
  void presence;

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 border-b border-zinc-800/60 px-6 py-3 flex items-center justify-between">
        <h2 className="text-[13px] font-medium text-zinc-200">Ops</h2>
        <ConnectionStatus connected={isLive} />
      </div>
      <div className="flex-1 overflow-y-auto admin-scroll p-6 space-y-4">
        <VitalsSection vitals={vitals} live={isLive} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AgentsSection agents={agents} live={isLive} />
          <RudySection rudy={rudy} live={isLive} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SessionsSection sessions={sessions} live={isLive} />
          <VaultSection vault={vault} live={isLive} />
        </div>
      </div>
    </div>
  );
}
