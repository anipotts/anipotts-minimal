"use client";

import { useMiniStream } from "@anipotts/lib/mini/stream";
import {
  AgentsSection,
  ConnectionStatus,
  PlaceholderSection,
  PresenceSection,
  ProcessSection,
  RudySection,
  SessionsSection,
  SyncthingSection,
  VaultSection,
  VitalsSection,
  type InitialData,
} from "./live-ops-panels";

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
