import {
  getMiniVitalsLive,
  getMiniAgents,
  getMiniRudy,
  getMiniSessions,
  getMiniPresence,
  getMiniVaultStats,
  getMiniSyncthing,
  getMiniProcesses,
} from "@anipotts/lib/mini";
import LiveOpsPage from "./live-ops";

export const dynamic = "force-dynamic";

export default async function OpsPage() {
  const [
    vitals,
    agents,
    rudy,
    sessions,
    presence,
    vault,
    syncthing,
    processes,
  ] = await Promise.all([
    getMiniVitalsLive(),
    getMiniAgents(),
    getMiniRudy(),
    getMiniSessions(),
    getMiniPresence(),
    getMiniVaultStats(),
    getMiniSyncthing(),
    getMiniProcesses(),
  ]);

  return (
    <LiveOpsPage
      initial={{
        vitals,
        agents,
        rudy,
        sessions,
        presence,
        vault,
        syncthing,
        processes,
      }}
    />
  );
}
