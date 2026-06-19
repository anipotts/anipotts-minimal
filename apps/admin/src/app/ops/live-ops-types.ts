import type {
  MiniAgents,
  MiniPresence,
  MiniProcesses,
  MiniRudy,
  MiniSessions,
  MiniSyncthing,
  MiniVault,
  MiniVitalsLive,
} from "@anipotts/lib/mini";

export interface InitialData {
  vitals: MiniVitalsLive | null;
  agents: MiniAgents | null;
  rudy: MiniRudy | null;
  sessions: MiniSessions | null;
  presence: MiniPresence | null;
  vault: MiniVault | null;
  syncthing: MiniSyncthing | null;
  processes: MiniProcesses | null;
}
