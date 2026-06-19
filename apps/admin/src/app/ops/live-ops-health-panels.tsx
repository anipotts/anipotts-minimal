import type {
  MiniAgents,
  MiniRudy,
  MiniSyncthing,
  MiniVitalsLive,
} from "@anipotts/lib/mini";
import { LiveValue } from "../../components/live-value";
import { Section, StatusDot, formatUptime } from "./live-ops-primitives";

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

export function VitalsSection({
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

export function AgentsSection({
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

export function RudySection({
  rudy,
  live,
}: {
  rudy: MiniRudy | null;
  live: boolean;
}) {
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

export function SyncthingSection({
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
