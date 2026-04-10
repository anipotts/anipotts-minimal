// Server-side only exports (no "use client" imports)
export {
  getMiniHealth,
  getMiniVitalsLive,
  getMiniProcesses,
  getMiniAgents,
  getMiniRudy,
  getMiniSyncthing,
  getMiniPresence,
  getMiniRepos,
  getMiniSessions,
  getMiniVaultStats,
} from "./client";
export type {
  MiniVitalsLive,
  MiniProcess,
  MiniProcesses,
  MiniAgent,
  MiniAgents,
  MiniRepoStatus,
  MiniRepos,
  MiniRudy,
  MiniSessions,
  MiniSyncthing,
  MiniPresence,
  MiniVault,
  MiniHealth,
  MiniStreamState,
} from "./types";

// Client-side hook is exported from a separate entry point:
// import { useMiniStream } from "@anipotts/lib/mini/stream"
