"use client";

import { useMemo, useState } from "react";
import { useMiniStream } from "@anipotts/lib/mini/stream";
import type {
  MiniVitalsLive,
  MiniAgents,
  MiniRudy,
  MiniSessions,
  MiniPresence,
  MiniVault,
  MiniSyncthing,
  MiniProcesses,
  MiniProcess,
} from "@anipotts/lib/mini";
import { LiveValue } from "../../components/live-value";

interface InitialData {
  vitals: MiniVitalsLive | null;
  agents: MiniAgents | null;
  rudy: MiniRudy | null;
  sessions: MiniSessions | null;
  presence: MiniPresence | null;
  vault: MiniVault | null;
  syncthing: MiniSyncthing | null;
  processes: MiniProcesses | null;
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

function PlaceholderSection({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <section className="rounded-lg border border-zinc-800/30 bg-zinc-950/30">
      <div className="px-4 py-2.5 border-b border-zinc-800/20 flex items-center gap-2">
        <h3 className="text-[11px] font-medium tracking-wide text-zinc-600 uppercase">
          {title}
        </h3>
      </div>
      <div className="p-4">
        <p className="text-[11px] text-zinc-600 italic">{message}</p>
      </div>
    </section>
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
          {rudy.db_size_mb !== undefined && (
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

// ── Syncthing Section ─────────────────────────────────────────────────

function SyncthingSection({
  syncthing,
  live,
}: {
  syncthing: MiniSyncthing | null;
  live: boolean;
}) {
  if (!syncthing || !syncthing.available) {
    return (
      <Section title="Syncthing">
        <div className="py-6 text-center">
          <p className="text-[12px] text-zinc-500">Syncthing not running</p>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Syncthing" live={live}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <StatusDot active />
          <span className="text-[12px] text-zinc-300">Connected</span>
          {syncthing.uptime !== undefined && (
            <span className="ml-auto text-[10px] text-zinc-600 font-mono">
              up {formatUptime(syncthing.uptime)}
            </span>
          )}
        </div>
        {syncthing.my_id && (
          <div className="text-[10px] text-zinc-600 font-mono truncate">
            {syncthing.my_id}
          </div>
        )}
      </div>
    </Section>
  );
}

// ── Presence Section ──────────────────────────────────────────────────

function PresenceSection({
  presence,
  live,
}: {
  presence: MiniPresence | null;
  live: boolean;
}) {
  if (!presence || !presence.available) {
    return (
      <Section title="Presence">
        <div className="py-6 text-center">
          <p className="text-[12px] text-zinc-500">No presence data</p>
        </div>
      </Section>
    );
  }

  const latest =
    presence.snapshots && presence.snapshots.length > 0
      ? presence.snapshots[presence.snapshots.length - 1]
      : null;

  if (!latest) {
    return (
      <Section title="Presence" live={live}>
        <div className="py-6 text-center">
          <p className="text-[12px] text-zinc-500">No snapshots yet</p>
        </div>
      </Section>
    );
  }

  const confidenceColor =
    latest.confidence >= 0.8
      ? "text-emerald-400"
      : latest.confidence >= 0.5
        ? "text-amber-400"
        : "text-zinc-500";

  return (
    <Section title="Presence" live={live}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-zinc-200">
            <LiveValue value={latest.location} />
          </span>
          <span className={`ml-auto text-[10px] font-mono ${confidenceColor}`}>
            {(latest.confidence * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex gap-3">
          <PresenceIndicator label="Laptop" active={latest.nearLaptop} />
          <PresenceIndicator label="Phone" active={latest.phoneOnNetwork} />
        </div>
      </div>
    </Section>
  );
}

function PresenceIndicator({
  label,
  active,
}: {
  label: string;
  active: boolean | null;
}) {
  const dotColor =
    active === true
      ? "bg-emerald-400"
      : active === false
        ? "bg-zinc-600"
        : "bg-zinc-700";
  const textColor = active === true ? "text-zinc-300" : "text-zinc-600";

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span className={`text-[11px] ${textColor}`}>{label}</span>
    </div>
  );
}

// ── Process Monitor Section ───────────────────────────────────────────

type SortField = "cpu" | "mem" | "command";

function ProcessSection({
  processes,
  live,
}: {
  processes: MiniProcesses | null;
  live: boolean;
}) {
  const [sortBy, setSortBy] = useState<SortField>("cpu");

  const sorted = useMemo(() => {
    if (!processes || processes.processes.length === 0) return [];
    const list = [...processes.processes];
    list.sort((a: MiniProcess, b: MiniProcess) => {
      if (sortBy === "cpu") return b.cpu - a.cpu;
      if (sortBy === "mem") return b.mem - a.mem;
      return a.command.localeCompare(b.command);
    });
    return list.slice(0, 12);
  }, [processes, sortBy]);

  if (!processes || processes.processes.length === 0) {
    return (
      <Section title="Processes">
        <div className="py-6 text-center">
          <p className="text-[12px] text-zinc-500">No process data</p>
        </div>
      </Section>
    );
  }

  return (
    <Section title={`Processes (${processes.processes.length})`} live={live}>
      <div className="space-y-1">
        <div className="flex items-center text-[10px] text-zinc-600 uppercase tracking-wide px-1 pb-1">
          <span className="flex-1">Command</span>
          <SortButton
            label="CPU%"
            field="cpu"
            current={sortBy}
            onSort={setSortBy}
          />
          <SortButton
            label="MEM%"
            field="mem"
            current={sortBy}
            onSort={setSortBy}
          />
        </div>
        {sorted.map((p: MiniProcess) => (
          <div
            key={`${p.pid}-${p.command}`}
            className="flex items-center gap-2 py-1 px-1 rounded hover:bg-zinc-800/20 text-[11px] font-mono"
          >
            <span className="flex-1 truncate text-zinc-400" title={p.command}>
              {truncateCommand(p.command)}
            </span>
            <span className="w-12 text-right text-zinc-500">
              <LiveValue value={p.cpu.toFixed(1)} />
            </span>
            <span className="w-12 text-right text-zinc-500">
              <LiveValue value={p.mem.toFixed(1)} />
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function SortButton({
  label,
  field,
  current,
  onSort,
}: {
  label: string;
  field: SortField;
  current: SortField;
  onSort: (f: SortField) => void;
}) {
  const isActive = current === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={`w-12 text-right text-[10px] uppercase tracking-wide cursor-pointer ${
        isActive ? "text-[#61AEBA]" : "text-zinc-600 hover:text-zinc-400"
      }`}
    >
      {label}
    </button>
  );
}

function truncateCommand(cmd: string): string {
  // Strip common path prefixes for readability
  const cleaned = cmd.replace(/^\/usr\/(?:local\/)?(?:bin|sbin)\//, "");
  if (cleaned.length <= 40) return cleaned;
  return cleaned.slice(0, 37) + "...";
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
  const syncthing = stream.syncthing ?? initial.syncthing;
  const processes = stream.processes ?? initial.processes;

  const isLive = stream.connected;

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SyncthingSection syncthing={syncthing} live={isLive} />
          <PresenceSection presence={presence} live={isLive} />
        </div>

        <ProcessSection processes={processes} live={isLive} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PlaceholderSection
            title="Tailscale"
            message="Add /ops/tailscale to Mini API"
          />
          <PlaceholderSection title="MacBook Agents" message="Check locally" />
        </div>
      </div>
    </div>
  );
}
