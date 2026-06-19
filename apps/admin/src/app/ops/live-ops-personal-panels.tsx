import type { MiniPresence, MiniSessions, MiniVault } from "@anipotts/lib/mini";
import { LiveValue } from "../../components/live-value";
import { Section } from "./live-ops-primitives";

export function SessionsSection({
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

export function VaultSection({
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

export function PresenceSection({
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
