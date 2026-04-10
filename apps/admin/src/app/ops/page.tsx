import {
  getMiniVitalsLive,
  getMiniAgents,
  getMiniRudy,
  getMiniSessions,
  getMiniPresence,
  getMiniVaultStats,
} from "@anipotts/lib/mini";
import LiveOpsPage from "./live-ops";

export const dynamic = "force-dynamic";

export default async function OpsPage() {
  const [vitals, agents, rudy, sessions, presence, vault] = await Promise.all([
    getMiniVitalsLive(),
    getMiniAgents(),
    getMiniRudy(),
    getMiniSessions(),
    getMiniPresence(),
    getMiniVaultStats(),
  ]);

  return (
    <LiveOpsPage
      initial={{ vitals, agents, rudy, sessions, presence, vault }}
    />
  );
}
